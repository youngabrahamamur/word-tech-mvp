import csv
import sys
import os

# 这一步是为了能导入 backend 目录下的模块
sys.path.append(os.getcwd())

from sqlalchemy.orm import Session
from backend.app.database import SessionLocal, engine
from backend.app.model import Word

def import_data():
    csv_path = 'scripts/ecdict.csv' # 确保文件名正确
    # 定义我们支持的标签映射
    VALID_TAGS = ['zk', 'gk', 'cet4', 'cet6', 'ky', 'toefl', 'ielts', 'gre']
    
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found.")
        return

    db = SessionLocal()
    count = 0
    
    print("Start importing... This might take a while.")
    
    try:
        with open(csv_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            for row in reader:
                tags = row.get('tag', '')
                
                # === 核心逻辑：只导入中考(zk)和高考(gk)词汇 ===
                # 如果你想做全量，可以去掉这个 if
                if any(t in tags for t in VALID_TAGS):
                    
                    # 检查是否已存在（避免重复运行报错）
                    existing = db.query(Word).filter(Word.spell == row['word']).first()
                    if existing:
                        continue

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
                    
                    # 每 1000 个提交一次，避免内存溢出
                    if count % 1000 == 0:
                        db.commit()
                        print(f"Imported {count} words...")
            
            db.commit() # 提交剩余的数据
            print(f"✅ Finished! Total imported: {count} words.")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import_data()
