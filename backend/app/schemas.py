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
