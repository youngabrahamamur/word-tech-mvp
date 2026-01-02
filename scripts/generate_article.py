import sys
import os
import json
import random
from openai import OpenAI
from dotenv import load_dotenv
sys.path.append(os.getcwd())
from sqlalchemy.orm import Session
from backend.app.database import SessionLocal
from backend.app.model import Word, Article

# 加载 .env
load_dotenv()

# 读取 Key
API_KEY = os.getenv("DEEPSEEK_API_KEY")
BASE_URL = os.getenv("DEEPSEEK_BASE_URL")

if not API_KEY:
    raise ValueError("❌ 错误：未找到 DEEPSEEK_API_KEY，请检查 .env 文件")

# 配置 DeepSeek
client = OpenAI(api_key=API_KEY, base_url=BASE_URL)

def generate_daily_article():
    db = SessionLocal()
    
    # 1. 随机选 5-8 个中考(zk)单词作为“今日核心词汇”
    # (实际项目中，这里应该选用户"刚背过"但"掌握度不高"的词)
    words = db.query(Word).filter(Word.tag.contains("zk")).limit(100).all()
    target_words = random.sample(words, 8)
    
    word_list_str = ", ".join([w.spell for w in target_words])
    word_ids = [w.id for w in target_words]
    
    print(f"Target Words: {word_list_str}")

    # 2. 让 AI 写故事
    prompt = f"""
    请写一篇约150词的英语短文（适合初二学生阅读）。
    要求必须自然地包含以下单词：{word_list_str}。
    
    请以JSON格式返回：
    {{
        "title": "文章标题",
        "content": "英文正文内容...",
        "translation": "中文全篇翻译..."
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
            translation=data['translation'],
            difficulty="Level 2",
            vocab_list=word_ids
        )
        db.add(article)
        db.commit()
        print(f"✅ Generated Article: {data['title']}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("开始生成今日阅读材料...")
    for i in range(5):
        print(f"--- Generating Article {i+1}/5 ---")
        generate_daily_article()
        # 稍微停顿一下防止 API 报错
        import time
        time.sleep(2)
