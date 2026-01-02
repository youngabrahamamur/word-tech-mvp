from app.database import engine, Base
from app.model import Word

# 这行代码会在数据库里创建所有定义的表
print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")
