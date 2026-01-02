import React, { useState, useEffect } from 'react';
import useStudyStore from '../stores/studyStore';

const FlashCard = () => {
  const { queue, currentIndex, playAudio, submitResult } = useStudyStore();
  const [showAnswer, setShowAnswer] = useState(false);

  const wordData = queue[currentIndex];

  // 每次切换单词时，重置“显示答案”的状态，并自动播放发音
  useEffect(() => {
    setShowAnswer(false);
    if (wordData) {
      playAudio(wordData.spell);
    }
  }, [currentIndex, wordData]);

  if (!wordData) return <div className="text-center mt-20">加载中...</div>;

  return (
    <div className="max-w-md mx-auto mt-8 px-4">
      {/* 进度条 */}
      <div className="mb-4 flex justify-between text-sm text-gray-500">
        <span>今日进度</span>
        <span>{currentIndex + 1} / {queue.length}</span>
      </div>

      {/* 卡片主体 */}
      <div className="bg-white rounded-2xl shadow-xl p-8 min-h-[400px] flex flex-col items-center relative transition-all duration-300">
        
        {/* 单词区 */}
        <div className="mt-8 text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-2">{wordData.spell}</h1>
          <div 
            className="inline-flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full cursor-pointer hover:bg-gray-200"
            onClick={() => playAudio(wordData.spell)}
          >
            <span className="text-gray-500 font-mono text-lg">/{wordData.phonetic || '... '}/</span>
            <span>🔊</span>
          </div>
        </div>

        {/* 答案区 (点击后显示) */}
        {showAnswer ? (
          <div className="mt-10 w-full animate-fadeIn">
            {/* 中文释义 */}
            <div className="text-lg text-gray-700 mb-6 text-center border-b pb-4">
              {wordData.translation}
            </div>

            {/* AI 例句 */}
            {wordData.ai_sentence && (
              <div className="bg-blue-50 p-4 rounded-xl text-left text-sm">
                <p className="font-semibold text-blue-600 mb-1">DeepSeek AI Example:</p>
                <p className="text-gray-800 text-base">{wordData.ai_sentence.en}</p>
                <p className="text-gray-500 mt-1">{wordData.ai_sentence.cn}</p>
              </div>
            )}
          </div>
        ) : (
          <button 
            onClick={() => setShowAnswer(true)}
            className="mt-20 text-gray-400 hover:text-blue-500 transition-colors"
          >
            👆 点击显示释义
          </button>
        )}
      </div>

      {/* 底部按钮区 */}
      <div className="mt-8">
        {!showAnswer ? (
          <button 
            onClick={() => setShowAnswer(true)}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
          >
            查看答案
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <button onClick={() => submitResult(0)} className="bg-red-100 text-red-600 py-4 rounded-xl font-bold text-lg hover:bg-red-200 active:scale-95 transition-all">
              忘记
            </button>
            <button onClick={() => submitResult(3)} className="bg-yellow-100 text-yellow-700 py-4 rounded-xl font-bold text-lg hover:bg-yellow-200 active:scale-95 transition-all">
              模糊
            </button>
            <button onClick={() => submitResult(5)} className="bg-green-100 text-green-700 py-4 rounded-xl font-bold text-lg hover:bg-green-200 active:scale-95 transition-all">
              认识
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashCard;
