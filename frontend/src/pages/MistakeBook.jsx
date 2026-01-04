import React, { useEffect, useState } from 'react';
import client from '../api/client';

const MistakeBook = ({ onBack }) => {
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMistakes = () => {
    client.get('/mistakes/list').then(data => {
      setMistakes(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchMistakes();
  }, []);

  const handleResolve = (id) => {
    client.delete(`/mistakes/${id}`).then(() => {
      // 乐观更新 UI
      setMistakes(mistakes.filter(m => m.id !== id));
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* 顶部 */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10 flex items-center">
        <button onClick={onBack} className="text-2xl mr-4">🏠</button>
        <h1 className="font-bold text-xl text-red-600">错题本 ({mistakes.length})</h1>
      </div>

      {/* 列表 */}
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {loading ? (
          <div className="text-center text-gray-400 mt-20">加载中...</div>
        ) : mistakes.length === 0 ? (
          <div className="text-center mt-20">
            <div className="text-6xl mb-4">💯</div>
            <p className="text-gray-500">太棒了！目前没有错题。</p>
          </div>
        ) : (
          mistakes.map(item => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-red-400">
              <div className="text-xs text-gray-400 mb-2 flex justify-between">
                <span>📄 {item.from_article_title}</span>
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
              
              <h3 className="font-bold text-gray-800 text-lg mb-4">{item.question}</h3>
              
              {/* 选项展示 */}
              <div className="space-y-2 mb-4">
                {item.options.map((opt, idx) => {
                  const label = opt.charAt(0); // "A"
                  let style = "text-gray-600";
                  if (label === item.correct_answer) style = "text-green-600 font-bold bg-green-50 px-2 py-1 rounded";
                  if (label === item.user_answer && label !== item.correct_answer) style = "text-red-500 line-through decoration-2";
                  
                  return (
                    <div key={idx} className={`text-sm ${style}`}>
                      {opt}
                    </div>
                  )
                })}
              </div>

              {/* 解析 */}
              <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800 mb-4">
                💡 <b>解析：</b> {item.explanation}
              </div>

              <button 
                onClick={() => handleResolve(item.id)}
                className="w-full py-2 border border-green-200 text-green-600 rounded-lg font-bold hover:bg-green-50 transition"
              >
                ✅ 我学会了 (移除)
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MistakeBook;
