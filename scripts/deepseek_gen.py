import sys
import os
import json
import time
from dotenv import load_dotenv
from openai import OpenAI # DeepSeek 兼容 OpenAI SDK

sys.path.append(os.getcwd())
from sqlalchemy.orm import Session
from backend.app.database import SessionLocal
from backend.app.model import Word

# 加载 .env
load_dotenv()

# 读取 Key
API_KEY = os.getenv("DEEPSEEK_API_KEY")
BASE_URL = os.getenv("DEEPSEEK_BASE_URL")

if not API_KEY:
    raise ValueError("❌ 错误：未找到 DEEPSEEK_API_KEY，请检查 .env 文件")

client = OpenAI(api_key=API_KEY, base_url=BASE_URL)

def generate_sentence(word_spell):
    prompt = f"""
    你是初中英语老师。请为单词 "{word_spell}" 生成：
    1. 一个非常简单、易懂的英文例句（适合初二水平）。
    2. 该例句的中文翻译。
    请严格按照JSON格式返回，不要包含markdown标记：
    {{"en": "英文句子", "cn": "中文翻译"}}
    """
    
    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=1.0
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"AI Error for {word_spell}: {e}")
        return None

def process_words(limit=10):
    db = SessionLocal()
    # 选出还没有例句的单词
    words = db.query(Word).filter(Word.ai_sentence == None).limit(limit).all()
    
    print(f"Processing {len(words)} words using DeepSeek...")
    
    for w in words:
        print(f"Generating for: {w.spell}...")
        result = generate_sentence(w.spell)
        
        if result:
            w.ai_sentence = result
            db.commit()
            print(f" -> Saved: {result['en']}")
        
        # 避免触发 API 速率限制
        time.sleep(1) 
        
    db.close()

if __name__ == "__main__":
    # 先试跑 5 个词，别一次跑太多费钱
    process_words(limit=100)
