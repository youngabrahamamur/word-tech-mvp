# WordTech - AI 驱动的中学英语智能学习平台 🚀

WordTech 是一个基于大语言模型 (DeepSeek V3) 的全栈英语学习应用，旨在通过 AI 技术为中学生提供个性化的单词记忆、阅读训练和写作批改服务。

🔗 **在线体验**: [https://word-tech-mvp.vercel.app](https://word-tech-mvp.vercel.app)

## ✨ 核心功能

- **📚 智能背词**：基于 SuperMemo-2 记忆算法，结合中考大纲词库 (880词)。
- **🧠 AI 分级阅读**：根据词汇量动态生成阅读文章，支持点击查词与全文朗读。
- **📝 实时测验**：阅读后由 AI 实时生成理解测试题，自动判分并解析。
- **📕 错题本**：自动收录错题，支持复习与销项。
- **✍️ AI 写作批改**：智能评分、语法纠错、润色建议及范文生成。
- **🔍 长难句分析**：一键拆解句子结构（主谓宾），解析语法难点。

## 🛠 技术栈

- **前端**: React 18, Vite, Tailwind CSS, Zustand, Axios
- **后端**: Python FastAPI, SQLAlchemy, Pydantic
- **AI**: OpenAI SDK (接入 DeepSeek V3 模型)
- **数据库**: PostgreSQL (Supabase)
- **部署**: Vercel (Frontend) + Render (Backend)

## 📸 项目截图

<img width="2431" height="888" alt="Screenshot 2026-01-05 002656" src="https://github.com/user-attachments/assets/651031c1-d730-4087-b343-54276160b6ed" />
<img width="2430" height="701" alt="Screenshot 2026-01-05 002722" src="https://github.com/user-attachments/assets/b33deb3a-d6e0-4c67-832d-5f0b6f914c7c" />
<img width="1338" height="1059" alt="Screenshot 2026-01-05 002750" src="https://github.com/user-attachments/assets/fa7f5b5f-0fd3-496b-a408-592cb8928550" />
<img width="1180" height="850" alt="Screenshot 2026-01-05 002812" src="https://github.com/user-attachments/assets/c22a7aca-f881-4ec3-a804-4c28f9c930a2" />
<img width="1157" height="980" alt="Screenshot 2026-01-05 002956" src="https://github.com/user-attachments/assets/e151e1b4-5780-407f-8d1d-bdf37123bb39" />
<img width="1131" height="639" alt="Screenshot 2026-01-05 003110" src="https://github.com/user-attachments/assets/a9d08381-f51b-4a5a-89a7-9a7930e31267" />







## 🚀 本地运行

1. 克隆项目
2. 配置 `.env` (包含 DEEPSEEK_API_KEY 和 DATABASE_URL)
3. 后端: `pip install -r requirements.txt` -> `uvicorn backend.app.main:app --reload`
4. 前端: `npm install` -> `npm run dev`

---
*Created by Abraham*
