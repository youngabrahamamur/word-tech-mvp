import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# 如果没有 URL (本地测试时)，给个默认值防止报错
if not SQLALCHEMY_DATABASE_URL:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

# === 修改重点在这里 ===
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # 1. 开启“预检测”，每次从池子里拿连接前先 ping 一下，防止拿到断掉的连接
    pool_pre_ping=True, 
    # 2. 连接回收时间，设为 1 小时，防止连接太久被防火墙切断
    pool_recycle=3600,
    # 3. 传递给底层驱动的参数
    connect_args={
        "connect_timeout": 60, # 握手超时时间设为 60秒 (默认是10秒)
        "keepalives": 1,       # 开启 TCP 心跳保活
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
