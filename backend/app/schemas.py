from pydantic import BaseModel
from typing import Optional, Dict, List

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
