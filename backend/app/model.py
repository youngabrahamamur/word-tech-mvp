from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Word(Base):
    __tablename__ = "words"
    id = Column(Integer, primary_key=True, index=True)
    spell = Column(String, unique=True, index=True)
    phonetic = Column(String)
    definition = Column(Text)
    translation = Column(Text)
    exchange = Column(String)
    tag = Column(String)
    ai_sentence = Column(JSON, nullable=True) 
    audio_url = Column(String, nullable=True)

class UserWordProgress(Base):
    __tablename__ = "user_word_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    # 暂时只模拟单用户，user_id 默认 1
    user_id = Column(String, index=True) # 去掉 default=1
    word_id = Column(Integer, ForeignKey("words.id"))
    
    # SRS 核心数据
    is_learned = Column(Integer, default=0) # 0:未学, 1:学习中
    easiness = Column(Float, default=2.5)   # 难度系数
    interval = Column(Integer, default=0)   # 间隔天数
    repetitions = Column(Integer, default=0) # 连续正确次数
    next_review = Column(DateTime, default=datetime.utcnow) # 下次复习时间
    
    word = relationship("Word")

class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(Text) # 文章正文
    difficulty = Column(String) # 例如: "KET", "PET", "中考"
    
    # 存储这篇文章包含的重点单词ID，存成列表: [1, 4, 10]
    vocab_list = Column(JSON) 
    
    # 译文 (可选)
    translation = Column(Text, nullable=True)

# backend/app/model.py

class UserStats(Base):
    __tablename__ = "user_stats"
    id = Column(Integer, primary_key=True)
    user_id = Column(String, index=True) # 去掉 default=1
    streak_days = Column(Integer, default=0)
    last_study_date = Column(DateTime, nullable=True) # 上次打卡日期
    total_learned_count = Column(Integer, default=0)
    daily_progress = Column(Integer, default=0)
    daily_target = Column(Integer, default=15)

class QuizMistake(Base):
    __tablename__ = "quiz_mistakes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True) # 去掉 default=1
    question = Column(Text)
    options = Column(JSON)
    correct_answer = Column(String)
    user_answer = Column(String)
    explanation = Column(Text)
    from_article_title = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

# ... 现有 imports
class UserWriting(Base):
    __tablename__ = "user_writings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True) # 去掉 default=1
    topic = Column(String)
    original_content = Column(Text)
    ai_feedback = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
