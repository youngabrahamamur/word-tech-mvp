import React, { useEffect, useState } from 'react';
import client from '../api/client';
import QuizModal from '../components/QuizModal'; // <--- 1. 引入组件

const ArticleReader = ({ articleId, onBack }) => {
  // 1. 所有 Hooks 必须放在最上面
  const [article, setArticle] = useState(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const [wordDetail, setWordDetail] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false); // <--- 2. 新增状态控制弹窗

  // Hook 1: 加载文章
  useEffect(() => {
    client.get(`/reading/${articleId}`).then(setArticle);
    // 记得清理朗读
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [articleId]);

  // Hook 2: 查单词 (即使 article 为 null，这个 hook 也必须存在，只是不执行内部逻辑)
  useEffect(() => {
    if (selectedWord) {
      setWordDetail(null);
      client.get(`/word/lookup?spell=${selectedWord}`)
        .then(data => {
          setWordDetail(data);
        })
        .catch(err => console.error(err));
    }
  }, [selectedWord]);

  // 2. 辅助函数定义
  const handleSpeakArticle = () => {
    if (!article) return; // 安全检查
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(article.content);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const renderContent = () => {
    if (!article) return null;
    return article.content.split(' ').map((word, index) => {
      const cleanWord = word.replace(/[^a-zA-Z]/g, "");
      return (
        <span
          key={index}
          onClick={() => setSelectedWord(cleanWord)}
          className="inline-block mx-1 cursor-pointer hover:bg-yellow-200 hover:text-yellow-800 rounded px-0.5 transition"
        >
          {word}
        </span>
      );
    });
  };

  // 3. ✅ 只有在所有 Hooks 执行完之后，才能进行条件返回 (Loading 判断)
  if (!article) return <div className="p-10 text-center">文章加载中...</div>;

  // 4. 最后才是主 JSX 返回
  return (
    <div className="max-w-2xl mx-auto bg-white min-h-screen shadow-2xl relative">
      {/* 顶部栏 */}
      <div className="sticky top-0 bg-white/95 backdrop-blur border-b p-4 flex items-center justify-between z-40">
        <div className="flex items-center">
          <button onClick={onBack} className="text-gray-500 hover:text-black mr-4 text-xl">←</button>
          <h1 className="font-bold text-lg truncate w-40">{article.title}</h1>
        </div>

        <button
          onClick={handleSpeakArticle}
          className={`px-3 py-1 rounded-full text-sm font-bold border transition ${isSpeaking ? 'bg-red-100 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}
        >
          {isSpeaking ? '⏹ 停止' : '▶ 朗读全文'}
        </button>
      </div>

      {/* 正文 */}
      <div className="p-8 pb-32">
        <p className="text-xl leading-9 text-gray-800 font-serif">
          {renderContent()}
        </p>
      </div>

      {/* === 3. 悬浮的 AI 测验按钮 === */}
      {!selectedWord && (
        <div className="fixed bottom-6 w-full max-w-2xl flex justify-center z-30 pointer-events-none">
           <button 
             onClick={() => setShowQuiz(true)}
             className="pointer-events-auto bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-purple-200 hover:scale-105 transition-transform flex items-center gap-2 animate-fadeIn"
           >
             <span>✨</span> AI Challenge
           </button>
        </div>
      )}

      {/* === 4. 测验弹窗 === */}
      {showQuiz && (
        <QuizModal 
          articleId={articleId} 
	  articleTitle={article.title} // <--- 传进去标题
          onClose={() => setShowQuiz(false)} 
        />
      )}


      {/* 底部弹窗 */}
      {selectedWord && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t-2 border-blue-500 p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] animate-slideUp z-50">
          <div className="max-w-2xl mx-auto">
            {/* 头部 */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-3xl font-bold text-gray-800">{selectedWord}</h3>
                {wordDetail?.phonetic && (
                   <span className="text-gray-500 font-mono text-sm">/{wordDetail.phonetic}/</span>
                )}
              </div>
              <button
                onClick={() => setSelectedWord(null)}
                className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 text-gray-500"
              >
                ✕
              </button>
            </div>

            {/* 内容 */}
            <div className="min-h-[80px]">
              {!wordDetail ? (
                <div className="text-gray-400 animate-pulse">正在查询词典...</div>
              ) : wordDetail.found ? (
                <div>
                  <p className="text-lg text-gray-800 font-medium">{wordDetail.translation}</p>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-3">{wordDetail.definition}</p>
                </div>
              ) : (
                <div className="text-gray-500">
                  词库中暂无此词
                </div>
              )}
            </div>

            {/* 按钮 */}
            <div className="mt-6 flex gap-3">
               <button
                 onClick={() => {
                   const audio = new Audio(`https://dict.youdao.com/dictvoice?audio=${selectedWord}&type=1`);
                   audio.play().catch(e => console.log("播放被拦截", e));
                 }}
                 className="flex-1 bg-blue-100 text-blue-700 py-3 rounded-xl font-bold hover:bg-blue-200 transition flex items-center justify-center gap-2"
               >
                 <span>🔊</span> 听发音
               </button>
               <button className="flex-1 bg-yellow-100 text-yellow-700 py-3 rounded-xl font-bold hover:bg-yellow-200 transition">
                 ⭐ 加入生词本
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ArticleReader;
