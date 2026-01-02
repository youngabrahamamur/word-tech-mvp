from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session, aliased
from sqlalchemy import func
from datetime import datetime, date, timedelta
from typing import List
import csv
import os

from .database import SessionLocal
from .model import Word, UserWordProgress
from .schemas import WordDTO, StudySubmit, ArticleDTO
from .srs_algo import calculate_review

from .model import Article, UserStats # 记得导入

router = APIRouter()

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
def get_user_dashboard(db: Session = Depends(get_db)):
    user_id = 1
    
    # 1. 总共已背单词数 (is_learned = 1)
    total_learned = db.query(UserWordProgress).filter(
        UserWordProgress.user_id == user_id,
        UserWordProgress.is_learned == 1
    ).count()
    
    # 2. 剩余待复习/新词 (今日任务)
    # 逻辑：找出 next_review <= now 的词 + 还没背的新词(这里简单模拟一下，假设每日固定20个)
    # 为了 MVP 简单展示，我们直接查 "queue" 接口同样的逻辑，看有多少个
    today_count = 15 # 暂时写个模拟数据，或者你可以复用 get_study_queue 的计数逻辑
    
    # 3. 真实：获取打卡天数 === 修改了这里 ===
    streak_days = 0
    user_stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    if user_stats:
        streak_days = user_stats.streak_days
    
    return {
        "total_learned": total_learned,
        "today_task": today_count,
        "streak_days": streak_days,
        "vocabulary_limit": 880 # 假设是中考大纲词汇量
    }

# 1. 获取学习队列 (新词 + 需要复习的旧词)
@router.get("/study/queue", response_model=List[WordDTO])
def get_study_queue(db: Session = Depends(get_db)):
    user_id = 1 # MVP固定用户
    
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
            Word.ai_sentence != None  # 只出有 AI 例句的词
        ).limit(limit_new).all()
        
        review_list.extend(new_words)

    return review_list

# 2. 提交学习结果
@router.post("/study/submit")
def submit_study(data: StudySubmit, db: Session = Depends(get_db)):
    user_id = 1
    
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
        user_stats = UserStats(user_id=user_id, streak_days=0, last_study_date=None)
        db.add(user_stats)

    last_date = user_stats.last_study_date.date() if user_stats.last_study_date else None

    if last_date == today:
        pass # 今天已经打过卡了，不处理
    elif last_date == today - timedelta(days=1):
        # 昨天打卡了，连续天数+1
        user_stats.streak_days += 1
        user_stats.last_study_date = datetime.utcnow()
    else:
        # 断签了（或者是第一次），重置为1
        user_stats.streak_days = 1
        user_stats.last_study_date = datetime.utcnow()

    db.commit()
    return {"status": "ok", "next_review": next_date}

@router.get("/reading/list", response_model=List[ArticleDTO])
def get_articles(db: Session = Depends(get_db)):
    return db.query(Article).order_by(Article.id.desc()).limit(10).all()

@router.get("/reading/{article_id}", response_model=ArticleDTO)
def get_article_detail(article_id: int, db: Session = Depends(get_db)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

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

@router.get("/admin/trigger_import")
def trigger_import(background_tasks: BackgroundTasks):
    # 使用后台任务运行，防止请求超时
    background_tasks.add_task(run_import_task)
    return {"message": "正在后台导入数据，请查看 Render 日志..."}
