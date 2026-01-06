from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Header
from sqlalchemy.orm import Session, aliased
from sqlalchemy import func
from datetime import datetime, date, timedelta
from typing import List
import csv
import os
import json
import re # 引入正则库
from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel
import random

from .database import SessionLocal
from .model import Word, UserWordProgress, QuizMistake, UserGrammarAnalysis
from .schemas import WordDTO, StudySubmit, ArticleDTO, QuizItem, MistakeCreate, MistakeDTO, WritingSubmit, WritingDTO
from .srs_algo import calculate_review

from .model import Article, UserStats, UserWriting # 记得导入

# 1. 加载本地 .env 文件 (否则读不到 API Key)
load_dotenv()

# 2. 初始化 DeepSeek 客户端
# 即使部署到云端，这段代码也兼容（云端会自动注入环境变量，本地则读取 .env）
client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
)

# 等级配置：数据库Tag -> AI Prompt 描述
LEVEL_CONFIG = {
    "zk": {"name": "中考", "prompt": "Middle School Student (approx. 1500 vocabulary)"},
    "gk": {"name": "高考", "prompt": "High School Student (approx. 3500 vocabulary)"},
    "cet4": {"name": "CET-4", "prompt": "College Student (CET-4 level)"},
    "cet6": {"name": "CET-6", "prompt": "College Student (CET-6 level)"},
    "ky": {"name": "考研", "prompt": "Postgraduate Entrance Exam candidate"},
    "ielts": {"name": "雅思", "prompt": "IELTS candidate (Band 7.0 target)"},
    "toefl": {"name": "托福", "prompt": "TOEFL candidate (Score 100+ target)"},
}

class GrammarRequest(BaseModel):
    sentence: str

class TargetUpdate(BaseModel):
    target: int

class BookmarkRequest(BaseModel):
    word_id: int

class LevelUpdate(BaseModel):
    level: str

router = APIRouter()

# 依赖注入：自动从 Header 获取 User ID
def get_current_user_id(x_user_id: str = Header(...)):
    return x_user_id

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def run_import_task():
    print("🚀 开始后台导入单词任务...")
    csv_path = 'scripts/ecdict.csv' # Render 上文件路径是相对于根目录的
    
    if not os.path.exists(csv_path):
        print(f"❌ 找不到文件: {csv_path}")
        return

    db = SessionLocal()
    try:
        with open(csv_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            count = 0
            for row in reader:
                tags = row.get('tag', '')
                if 'zk' in tags or 'gk' in tags: # 只导入中高考
                    # 检查是否存在
                    existing = db.query(Word).filter(Word.spell == row['word']).first()
                    if not existing:
                        word = Word(
                            spell=row['word'],
                            phonetic=row['phonetic'],
                            definition=row['definition'],
                            translation=row['translation'],
                            exchange=row['exchange'],
                            tag=tags
                        )
                        db.add(word)
                        count += 1
                        if count % 100 == 0:
                            db.commit()
                            print(f"已导入 {count} ...")
            db.commit()
            print(f"✅ 导入完成！共 {count} 个单词。")
    except Exception as e:
        print(f"❌ 导入出错: {e}")
    finally:
        db.close()

@router.get("/user/dashboard")
def get_user_dashboard(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    
    # 1. 总共已背单词数 (is_learned = 1)
    total_learned = db.query(UserWordProgress).filter(
        UserWordProgress.user_id == user_id,
        UserWordProgress.is_learned == 1
    ).count()
    
    # 2. 剩余待复习/新词 (今日任务)
    # 逻辑：找出 next_review <= now 的词 + 还没背的新词(这里简单模拟一下，假设每日固定20个)
    # 为了 MVP 简单展示，我们直接查 "queue" 接口同样的逻辑，看有多少个
    daily_target = 15 # 暂时写个模拟数据，或者你可以复用 get_study_queue 的计数逻辑
    
    # 3. 真实：获取打卡天数 === 修改了这里 ===
    streak_days = 0
    daily_progress = 0 # 默认为0
    current_level = "zk" # 默认

    user_stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()

    if user_stats:
        streak_days = user_stats.streak_days
        daily_target = user_stats.daily_target or 15 # 获取数据库里的目标
        current_level = user_stats.current_level or "zk"
        # 如果数据库里的日期是今天，就用数据库的值；如果不是今天（说明今天还没学），就是0
        if user_stats.last_study_date and user_stats.last_study_date.date() == date.today():
            daily_progress = user_stats.daily_progress
        else:
            daily_progress = 0
    
    return {
        "total_learned": total_learned,
        "today_task": daily_target,
        "streak_days": streak_days,
        "vocabulary_limit": 880, # 假设是中考大纲词汇量
        "daily_progress": daily_progress, # <--- 返回给前端的新字段
        "current_level": current_level,
        "level_display": LEVEL_CONFIG.get(current_level, {}).get("name", "中考")
    }

# 1. 获取学习队列 (新词 + 需要复习的旧词)
@router.get("/study/queue", response_model=List[WordDTO])
def get_study_queue(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    
    # 1. 先查用户的等级
    user_stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    level_tag = user_stats.current_level if user_stats else "zk"

    # A. 找需要复习的词 (next_review <= now)
    review_list = db.query(Word).join(UserWordProgress).filter(
        UserWordProgress.user_id == user_id,
        UserWordProgress.next_review <= datetime.utcnow()
    ).limit(20).all()

    # 如果复习词不够 10 个，就加点新词
    if len(review_list) < 10:
        limit_new = 10 - len(review_list)
        # 找还没有进度的词 (LEFT JOIN check)
        # 子查询：找出该用户学过的 word_id
        subquery = db.query(UserWordProgress.word_id).filter(UserWordProgress.user_id == user_id)
        
        new_words = db.query(Word).filter(
            Word.id.notin_(subquery),
            Word.tag.contains(level_tag), # <--- 关键修改：只根据当前等级筛选
            Word.ai_sentence != None  # 只出有 AI 例句的词
        ).limit(limit_new).all()
        
        review_list.extend(new_words)

    return review_list

# 2. 提交学习结果
@router.post("/study/submit")
def submit_study(data: StudySubmit, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    
    # 查找或创建进度记录
    progress = db.query(UserWordProgress).filter(
        UserWordProgress.user_id == user_id,
        UserWordProgress.word_id == data.word_id
    ).first()

    if not progress:
        progress = UserWordProgress(
            user_id=user_id, 
            word_id=data.word_id, 
            easiness=2.5, 
            interval=0, 
            repetitions=0
        )
        db.add(progress)

    # 调用算法计算
    ef, interval, reps, next_date = calculate_review(
        data.quality, progress.easiness, progress.interval, progress.repetitions
    )

    # 更新数据库
    progress.easiness = ef
    progress.interval = interval
    progress.repetitions = reps
    progress.next_review = next_date
    progress.is_learned = 1
    
    # === 处理打卡逻辑 ===
    today = date.today()

    # 获取或创建用户统计
    user_stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    if not user_stats:
        user_stats = UserStats(user_id=user_id, streak_days=0, last_study_date=None, daily_progress=0)
        db.add(user_stats)

    last_date = user_stats.last_study_date.date() if user_stats.last_study_date else None

    if last_date == today:
        # 今天已经学过了，累加今日进度
        user_stats.daily_progress += 1
    elif last_date == today - timedelta(days=1):
        # 昨天打卡了，连续天数+1
        user_stats.streak_days += 1
        user_stats.daily_progress = 1
        user_stats.last_study_date = datetime.utcnow()
    else:
        # 断签了（或者是第一次），Streak重置为1，今日进度重置为1
        user_stats.streak_days = 1
        user_stats.daily_progress = 1
        user_stats.last_study_date = datetime.utcnow()

    db.commit()
    return {"status": "ok", "next_review": next_date}

@router.post("/reading/generate")
def generate_new_article(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    # 1. 获取等级
    user_stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    level_tag = user_stats.current_level if user_stats else "zk"
    level_prompt = LEVEL_CONFIG[level_tag]["prompt"] # 获取 "IELTS candidate..."
    # 1. 随机选词 (模拟：从库里随机挑 5 个中考词)
    # 实际产品中，这里应该选用户"刚加入生词本"的词
    words = db.query(Word).filter(Word.tag.contains(level_tag)).order_by(func.random()).limit(8).all()
    if not words:
        raise HTTPException(status_code=400, detail="Word database is empty")
        
    word_list_str = ", ".join([w.spell for w in words])
    word_ids = [w.id for w in words]
    
    print(f"🤖 Generating article with: {word_list_str}")

    # 2. 调用 DeepSeek
    prompt = f"""
    Write a short English article for a {level_prompt}.
    Difficulty Level: {level_tag.upper()}.
    It MUST include these words: {word_list_str}.
    
    Return strict JSON:
    {{
        "title": "Title Here",
        "content": "Story content...",
        "translation": "Chinese translation..."
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content)
        
        # 3. 存入数据库
        article = Article(
            title=data['title'],
            content=data['content'],
            translation=data.get('translation', ''), # 兼容有的AI没返回翻译
            difficulty="Level 2",
            vocab_list=word_ids
        )
        db.add(article)
        db.commit()
        db.refresh(article)
        
        return {"status": "ok", "article_id": article.id}
        
    except Exception as e:
        print(f"Gen Article Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate article")

@router.get("/reading/list", response_model=List[ArticleDTO])
def get_articles(db: Session = Depends(get_db)):
    return db.query(Article).order_by(Article.id.desc()).limit(10).all()

@router.get("/reading/{article_id}", response_model=ArticleDTO)
def get_article_detail(article_id: int, db: Session = Depends(get_db)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@router.post("/reading/{article_id}/quiz", response_model=List[QuizItem])
def generate_quiz(article_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    # 1. 获取等级
    user_stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    level_tag = user_stats.current_level if user_stats else "zk"
    level_prompt = LEVEL_CONFIG[level_tag]["prompt"] # 获取 "IELTS candidate..."
    # 1. 查出文章
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    # 2. 调用 DeepSeek
    print(f"🤖 AI正在为文章 {article.title} 出题...") # 加个日志方便调试

    prompt = f"""
    Based on the text below, create 3 multiple-choice questions for a {level_prompt}.
    Difficulty Level: {level_tag.upper()}.
    Text:
    {article.content}

    You MUST return the result as a pure JSON list.
    Strict format requirements:
    1. Do not use Markdown formatting (no ```json or ```).
    2. The root element must be a LIST [].
    3. Each item must have: "question", "options" (list of 4 strings), "answer" (just A, B, C, or D), and "explanation".

    Example:
    [
      {{
        "question": "What is the main idea?",
        "options": ["A. Idea 1", "B. Idea 2", "C. Idea 3", "D. Idea 4"],
        "answer": "A",
        "explanation": "Because..."
      }}
    ]
    """

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1, # 降低随机性，保证格式稳定
            response_format={"type": "json_object"} # 强制 JSON
        )
        content = response.choices[0].message.content
        print(f"🤖 AI原始返回: {content}") # 打印出来看看，如果报错方便排查

        # === 增强型 JSON 清洗逻辑 ===
        # 1. 有时候 AI 还是会返回 ```json，手动去掉
        if "```" in content:
            content = content.replace("```json", "").replace("```", "")

        # 2. 尝试解析
        data = json.loads(content)

        # 3. 兼容性处理：如果返回的是 {"quizzes": [...]} 或者是 {"questions": [...]}
        if isinstance(data, dict):
            for key in ["quizzes", "questions", "items"]:
                if key in data and isinstance(data[key], list):
                    return data[key]
            # 如果是字典但没找到 key，可能结构不对，强行转 list 试试?
            # 这里的 fallback 视情况而定，通常上面能解决

        # 4. 如果本身就是 list，直接返回
        if isinstance(data, list):
            return data

        raise ValueError("AI returned unexpected JSON structure")

    except Exception as e:
        print(f"❌ AI Error Details: {e}") # 这一行非常重要，看终端报错
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

# 1. 批量保存错题 (在测验结算时调用)
@router.post("/mistakes/batch_add")
def add_mistakes(mistakes: List[MistakeCreate], db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    for m in mistakes:
        # 简单查重：防止同一道题重复存 (可选)
        exists = db.query(QuizMistake).filter(
            QuizMistake.user_id == user_id, 
            QuizMistake.question == m.question
        ).first()
        
        if not exists:
            new_mistake = QuizMistake(
                user_id=user_id,
                question=m.question,
                options=m.options,
                correct_answer=m.correct_answer,
                user_answer=m.user_answer,
                explanation=m.explanation,
                from_article_title=m.from_article_title
            )
            db.add(new_mistake)
    
    db.commit()
    return {"status": "ok", "saved_count": len(mistakes)}

# 2. 获取所有错题
@router.get("/mistakes/list", response_model=List[MistakeDTO])
def get_mistakes(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    return db.query(QuizMistake).filter(QuizMistake.user_id == user_id).order_by(QuizMistake.id.desc()).all()

# 3. 移除错题 (已掌握)
@router.delete("/mistakes/{mistake_id}")
def delete_mistake(mistake_id: int, db: Session = Depends(get_db)):
    db.query(QuizMistake).filter(QuizMistake.id == mistake_id).delete()
    db.commit()
    return {"status": "deleted"}

# 1. 提交作文并获取 AI 批改
@router.post("/writing/evaluate", response_model=WritingDTO)
def evaluate_writing(data: WritingSubmit, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    # 1. 获取等级
    user_stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    level_tag = user_stats.current_level if user_stats else "zk"
    level_prompt = LEVEL_CONFIG[level_tag]["prompt"] # 获取 "IELTS candidate..."

    print(f"🤖 正在批改作文: {data.topic}")
    prompt = f"""
    Act as an English teacher. Evaluate the {level_prompt} essay.
    Difficulty Level: {level_tag.upper()}.
    Topic: {data.topic}
    Student Content: {data.content}
    
    Return strict JSON (no markdown code blocks):
    {{
        "score": 85, 
        "comment": "General feedback...",
        "corrections": [
            {{"original": "wrong text", "correction": "right text", "reason": "grammar rule"}}
        ],
        "better_version": "A rewritten native-like version..."
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.1, # 降低随机性
            timeout=60 # 给 DeepSeek SDK 更多时间
        )
        content = response.choices[0].message.content
        print(f"📝 AI原始返回: {content}") # 打印出来方便调试

        # === 增强型 JSON 清洗 ===
        if "```" in content:
            content = content.replace("```json", "").replace("```", "")
        
        feedback = json.loads(content)
        
        # === 存入数据库 ===
        writing = UserWriting(
            user_id=user_id,
            topic=data.topic,
            original_content=data.content,
            ai_feedback=feedback
        )
        db.add(writing)
        db.commit()
        db.refresh(writing)
        
        return writing

    except Exception as e:
        print(f"❌ AI Error: {e}") # 这一行能让你看到具体报错
        raise HTTPException(status_code=500, detail=f"AI evaluation failed: {str(e)}")

# 2. 获取写作历史
@router.get("/writing/history", response_model=List[WritingDTO])
def get_writing_history(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    return db.query(UserWriting).filter(UserWriting.user_id == user_id).order_by(UserWriting.id.desc()).all()

# 3. 随机生成一个题目 (可选小功能)
@router.get("/writing/topic")
def get_random_topic(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    # 1. 获取等级
    user_stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    level_tag = user_stats.current_level if user_stats else "zk"
    level_prompt = LEVEL_CONFIG[level_tag]["prompt"] # 获取 "IELTS candidate..."
    # 原来是写死的 list，现在改成调用 AI
    prompt = """
    Generate ONE creative and interesting English writing topic suitable for a {level_prompt}. 
    Difficulty Level: {level_tag.upper()}.
    Examples: "If I could fly", "My favorite season", "A day without phone".
    Return ONLY the topic string, no quotes, no extra words.
    """
    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7 # 稍微高一点，保证创意
        )
        topic = response.choices[0].message.content.strip().replace('"', '')
        return {"topic": topic}
    except:
        # 兜底方案
        return {"topic": "My Best Friend"}

# 2. 语法分析接口
@router.post("/grammar/analyze")
def analyze_grammar(req: GrammarRequest, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    # 1. 获取等级
    user_stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    level_tag = user_stats.current_level if user_stats else "zk"
    level_prompt = LEVEL_CONFIG[level_tag]["prompt"] # 获取 "IELTS candidate..."
    print(f"🤖 正在分析长难句: {req.sentence}")

    prompt = f"""
    You are an expert English grammar teacher. Analyze the syntax of the following sentence for a {level_prompt}.
    
    Sentence: "{req.sentence}"

    Return strict JSON (no markdown block):
    {{
      "translation": "Translate the sentence into natural Chinese.",
      "structure": [
        {{"part": "Subject (主语)", "content": "The specific words", "color": "text-green-600", "bg": "bg-green-50"}},
        {{"part": "Verb (谓语)", "content": "The specific words", "color": "text-red-600", "bg": "bg-red-50"}},
        {{"part": "Object/Complement (宾/表)", "content": "The specific words", "color": "text-blue-600", "bg": "bg-blue-50"}},
        {{"part": "Modifier (修饰成分)", "content": "Time/Place/Clauses...", "color": "text-gray-600", "bg": "bg-gray-50"}}
      ],
      "grammar_points": [
        {{ "title": "Point name (e.g. 定语从句)", "desc": "Explanation..." }}
      ]
    }}
    """

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        content = response.choices[0].message.content

        # 清洗 Markdown
        if "```" in content:
            content = content.replace("```json", "").replace("```", "")

        # 在 return json.loads(content) 之前，存入数据库
        result_json = json.loads(content)
    
        # 存库
        record = UserGrammarAnalysis(
            user_id=user_id,
            sentence=req.sentence,
            analysis_result=result_json
        )
        db.add(record)
        db.commit()

        return result_json

    except Exception as e:
        print(f"Grammar AI Error: {e}")
        raise HTTPException(status_code=500, detail="Analysis failed")

# 2. 新增历史记录接口
@router.get("/grammar/history")
def get_grammar_history(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    return db.query(UserGrammarAnalysis).filter(
        UserGrammarAnalysis.user_id == user_id
    ).order_by(UserGrammarAnalysis.id.desc()).all()

@router.post("/user/update_target")
def update_target(data: TargetUpdate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    user_stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    if not user_stats:
        # 如果是新用户还没学过习，先创建记录
        user_stats = UserStats(user_id=user_id, daily_target=data.target)
        db.add(user_stats)
    else:
        user_stats.daily_target = data.target
    
    db.commit()
    return {"status": "ok", "new_target": data.target}

@router.get("/word/lookup")
def lookup_word(spell: str, db: Session = Depends(get_db)):
    # 忽略大小写查找
    word = db.query(Word).filter(Word.spell == spell.lower()).first()

    if not word:
        # 如果数据库没有，这可能是一个生僻词或者变形词(dolphins)
        # 简单处理：返回空，或者可以接入 DeepSeek 实时查询（高级功能）
        return {"found": False, "spell": spell}

    return {
        "found": True,
        "id": word.id,
        "spell": word.spell,
        "phonetic": word.phonetic,
        "translation": word.translation,
        "definition": word.definition
    }

@router.post("/word/bookmark")
def bookmark_word(data: BookmarkRequest, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    # 检查是否已经在进度表中
    progress = db.query(UserWordProgress).filter(
        UserWordProgress.user_id == user_id,
        UserWordProgress.word_id == data.word_id
    ).first()
    
    if progress:
        return {"message": "Already in vocabulary list"}
    
    # 如果不在，创建一个新记录 (is_learned=0 表示新词)
    new_progress = UserWordProgress(
        user_id=user_id,
        word_id=data.word_id,
        is_learned=0,
        easiness=2.5,
        interval=0,
        repetitions=0
    )
    db.add(new_progress)
    db.commit()
    return {"message": "Added to vocabulary"}

@router.post("/user/update_level")
def update_level(data: LevelUpdate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    if data.level not in LEVEL_CONFIG:
        raise HTTPException(status_code=400, detail="Invalid level")
        
    user_stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    if not user_stats:
        user_stats = UserStats(user_id=user_id, current_level=data.level)
        db.add(user_stats)
    else:
        user_stats.current_level = data.level
    
    db.commit()
    return {"status": "ok", "current_level": data.level, "level_name": LEVEL_CONFIG[data.level]["name"]}

@router.get("/admin/trigger_import")
def trigger_import(background_tasks: BackgroundTasks):
    # 使用后台任务运行，防止请求超时
    background_tasks.add_task(run_import_task)
    return {"message": "正在后台导入数据，请查看 Render 日志..."}

