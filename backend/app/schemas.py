from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime

# 单词返回给前端的格式
class WordDTO(BaseModel):
    id: int
    spell: str
    phonetic: Optional[str] = None
    translation: Optional[str] = None
    ai_sentence: Optional[Dict] = None

    class Config:
        from_attributes = True

# 前端提交学习结果的格式
class StudySubmit(BaseModel):
    word_id: int
    quality: int # 0-5

class ArticleDTO(BaseModel):
    id: int
    title: str
    content: str
    translation: Optional[str]
    vocab_list: List[int] # 包含的单词ID

class QuizItem(BaseModel):
    question: str
    options: List[str]
    answer: str
    explanation: str # 让 AI 给个解析，更人性化

# 单个错题提交模型
class MistakeCreate(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    user_answer: str
    explanation: str
    from_article_title: str

# 错题返回模型
class MistakeDTO(MistakeCreate):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# 提交作文的请求
class WritingSubmit(BaseModel):
    topic: str
    content: str

# 写作记录返回
class WritingDTO(BaseModel): # 不要继承 WritingSubmit 了，重新定义，避免混淆
    id: int
    topic: str
    # 关键修改：把 content 改成 original_content，和数据库保持一致
    original_content: str
    ai_feedback: Dict
    created_at: datetime

    class Config:
        from_attributes = True

class FeedbackCreate(BaseModel):
    content: str
    contact_email: str = None
