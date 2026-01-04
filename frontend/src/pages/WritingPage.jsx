import React, { useState, useEffect } from 'react';
import client from '../api/client';

const WritingPage = ({ onBack }) => {
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // 存储批改结果

  // 初始化：获取一个随机题目
  useEffect(() => {
    client.get('/writing/topic').then(res => setTopic(res.topic));
  }, []);

  const handleSubmit = () => {
    if (!content.trim()) return;
    setLoading(true);
    
    client.post('/writing/evaluate', { topic, content })
      .then(data => {
        setResult(data);
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
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* 顶部 */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center">
            <button onClick={onBack} className="text-2xl mr-4 hover:scale-110 transition">🏠</button>
            <h1 className="font-bold text-xl text-blue-600">写作训练</h1>
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

      </div>
    </div>
  );
};

export default WritingPage;
