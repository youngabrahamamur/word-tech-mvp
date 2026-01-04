import React, { useState } from 'react';
import client from '../api/client';

const GrammarPage = ({ onBack }) => {
  const [sentence, setSentence] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = () => {
    if (!sentence.trim()) return;
    setLoading(true);
    setResult(null);

    client.post('/grammar/analyze', { sentence })
      .then(data => {
        setResult(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        alert("分析失败，请重试");
        setLoading(false);
      });
  };

  // 预设几个例子，方便测试
  const fillExample = () => {
    setSentence("What made me sad was that I failed the exam which I prepared for a long time.");
  };

  return (
    <div className="min-h-screen bg-indigo-50 pb-10">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10 flex items-center">
        <button onClick={onBack} className="text-2xl mr-4 hover:scale-110 transition">🏠</button>
        <h1 className="font-bold text-xl text-indigo-700">AI 长难句分析器</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        
        {/* 输入区域 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm mb-6">
          <label className="block text-gray-500 text-sm font-bold mb-2 uppercase">
            Input Sentence
          </label>
          <textarea
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg resize-none"
            rows="4"
            placeholder="粘贴看不懂的长难句在这里..."
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
          ></textarea>
          
          <div className="mt-4 flex justify-between items-center">
            <button onClick={fillExample} className="text-sm text-indigo-400 hover:text-indigo-600 underline">
              试一个例子
            </button>
            <button 
              onClick={handleAnalyze}
              disabled={loading || !sentence}
              className={`px-8 py-3 rounded-full font-bold text-white shadow-lg transition-all flex items-center gap-2 ${loading ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105'}`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  分析中...
                </>
              ) : (
                <>🚀 一键分析</>
              )}
            </button>
          </div>
        </div>

        {/* 结果展示区域 */}
        {result && (
          <div className="space-y-6 animate-slideUp">
            
            {/* 1. 中文翻译 */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-indigo-500">
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Meaning</h3>
              <p className="text-lg text-gray-800 font-medium">{result.translation}</p>
            </div>

            {/* 2. 句子结构拆解 (卡片流) */}
            <div>
              <h3 className="text-gray-500 font-bold mb-3 flex items-center gap-2">
                <span className="bg-indigo-100 p-1 rounded">🧩</span> 结构拆解
              </h3>
              <div className="grid gap-3">
                {result.structure.map((item, idx) => (
                  <div key={idx} className={`p-4 rounded-xl flex items-center justify-between ${item.bg}`}>
                    <div>
                      <span className={`text-xs font-bold uppercase ${item.color} opacity-70`}>{item.part}</span>
                      <p className={`text-lg font-bold ${item.color} mt-1`}>{item.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. 核心语法点 */}
            <div className="bg-white p-6 rounded-3xl shadow-sm">
              <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                <span className="text-yellow-500 text-xl">💡</span> 语法重点
              </h3>
              <div className="space-y-4">
                {result.grammar_points.map((point, idx) => (
                  <div key={idx} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <h4 className="font-bold text-indigo-600 mb-1">{point.title}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{point.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default GrammarPage;
