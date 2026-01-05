import React, { useState, useEffect } from 'react';
import client from '../api/client';

const WritingPage = ({ onBack }) => {
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // 存储批改结果
  const [history, setHistory] = useState([]);

  // 初始化：获取一个随机题目，也获取历史
  useEffect(() => {
    client.get('/writing/topic').then(res => setTopic(res.topic));
    loadHistory();
  }, []);

  const loadHistory = () => {
    client.get('/writing/history').then(setHistory);
  };

  const handleSubmit = () => {
    if (!content.trim()) return;
    setLoading(true);
    
    client.post('/writing/evaluate', { topic, content })
      .then(data => {
        setResult(data);
	loadHistory();
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        alert("AI 批改失败，请重试");
        setLoading(false);
      });
  };

  const handleNewTopic = () => {
    setResult(null);
    setContent("");
    client.get('/writing/topic').then(res => setTopic(res.topic));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 新增：加载历史记录到主区域
  const handleLoadHistoryItem = (item) => {
    setTopic(item.topic);
    setContent(item.original_content); // 或者是 item.content，取决于你 schema 怎么定义的
    setResult({ ai_feedback: item.ai_feedback }); // 恢复结果展示
    
    // 滚回到顶部看结果
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 3. 新增：滚动到底部历史区
  const scrollToHistory = () => {
    document.getElementById('history-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* 顶部 */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center">
            <button onClick={onBack} className="text-2xl mr-4 hover:scale-110 transition">🏠</button>
            <h1 className="font-bold text-xl text-blue-600">写作训练</h1>
        </div>
	{/* 右侧功能区 */}
        <div className="flex gap-3">
            {/* 如果正在看结果，显示“写新文章” */}
            {result && (
                <button onClick={handleNewTopic} className="text-sm font-bold text-blue-500 border border-blue-100 px-3 py-1 rounded-full hover:bg-blue-50">
                    ✍️ 写新文
                </button>
            )}
            {/* 无论何时都显示“看历史” */}
            {history.length > 0 && (
                <button onClick={scrollToHistory} className="text-sm font-bold text-gray-500 hover:text-gray-800">
                    📜 历史
                </button>
            )}
        </div>
        {!loading && !result && (
            <button onClick={handleNewTopic} className="text-sm text-blue-500 font-bold">换个题目 🎲</button>
        )}
      </div>

      <div className="max-w-2xl mx-auto p-4">
        
        {/* 题目卡片 */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 rounded-2xl text-white shadow-lg mb-6">
            <p className="text-blue-100 text-xs font-bold uppercase mb-1">Today's Topic</p>
            <h2 className="text-2xl font-bold">{topic}</h2>
        </div>

        {/* 输入区域 (如果没有结果) */}
        {!result ? (
            <div className="bg-white p-4 rounded-2xl shadow-sm animate-fadeIn">
                <textarea 
                    className="w-full h-64 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-lg leading-relaxed"
                    placeholder="Start writing here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={loading}
                ></textarea>
                
                <div className="mt-4 flex justify-end">
                    <button 
                        onClick={handleSubmit}
                        disabled={loading || content.length < 10}
                        className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'}`}
                    >
                        {loading ? "AI 批改中..." : "提交批改 ✨"}
                    </button>
                </div>
            </div>
        ) : (
            /* 批改结果展示 */
            <div className="space-y-6 animate-slideUp">
                
                {/* 1. 分数和点评 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border-l-8 border-blue-500">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-gray-800 text-lg">AI 老师点评</h3>
                        <div className="flex flex-col items-center bg-blue-50 px-4 py-2 rounded-lg">
                            <span className="text-xs text-blue-400 font-bold uppercase">Score</span>
                            <span className="text-3xl font-black text-blue-600">{result.ai_feedback.score}</span>
                        </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{result.ai_feedback.comment}</p>
                </div>

                {/* 2. 纠错建议 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span>🛠️</span> 纠错与建议
                    </h3>
                    {result.ai_feedback.corrections.length === 0 ? (
                        <p className="text-green-500">完美！没有发现明显的语法错误。</p>
                    ) : (
                        <div className="space-y-4">
                            {result.ai_feedback.corrections.map((item, idx) => (
                                <div key={idx} className="bg-red-50 p-4 rounded-xl border border-red-100">
                                    <div className="flex items-center gap-2 mb-1 text-red-500 line-through text-sm">
                                        ❌ {item.original}
                                    </div>
                                    <div className="flex items-center gap-2 mb-2 text-green-600 font-bold">
                                        ✅ {item.correction}
                                    </div>
                                    <p className="text-xs text-gray-500">💡 {item.reason}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. 范文 */}
                <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                    <h3 className="font-bold text-green-800 mb-2">🌟 范文参考 (Better Version)</h3>
                    <p className="text-green-900 leading-relaxed italic">
                        "{result.ai_feedback.better_version}"
                    </p>
                </div>

                <button 
                    onClick={handleNewTopic}
                    className="w-full py-4 bg-gray-800 text-white rounded-xl font-bold shadow-lg hover:bg-black transition"
                >
                    再写一篇
                </button>
            </div>
        )}

	{history.length > 0 && (
            <div id="history-section" className="mt-12 border-t pt-8"> {/* <--- ID 加在这里 */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-400 text-sm uppercase tracking-wider">Past Writings</h3>
                    <span className="text-xs text-gray-300">点击卡片回顾</span>
                </div>
                
                <div className="space-y-4">
                    {history.map(item => (
                        <div 
                            key={item.id} 
                            onClick={() => handleLoadHistoryItem(item)}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-blue-300 transition hover:shadow-md active:scale-[0.99]"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-gray-800 line-clamp-1">{item.topic}</h4>
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">{item.ai_feedback.score}分</span>
                            </div>
                            <p className="text-gray-500 text-sm line-clamp-2">{item.original_content}</p>
                            <div className="text-xs text-gray-300 mt-2">
                                {new Date(item.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* 底部留白，方便滚动 */}
                <div className="h-20"></div> 
            </div>
        )}

      </div>
    </div>
  );
};

export default WritingPage;
