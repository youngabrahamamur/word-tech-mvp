from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from .api import router

app = FastAPI()

# 确保目录存在
os.makedirs("static/audio", exist_ok=True)

# 挂载静态目录，这样访问 /static/audio/xxx.mp3 就能拿到文件
app.mount("/static", StaticFiles(directory="static"), name="static")

# 允许跨域 (方便 React 调用)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "WordTech API is running!"}
