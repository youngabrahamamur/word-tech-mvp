import React, { useState, useEffect } from 'react';
import client from '../api/client';

const QuizModal = ({ articleId, articleTitle, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false); // 是否已点击提交
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false); // 是否全部答完
  const [error, setError] = useState(null);
  const [wrongQuestions, setWrongQuestions] = useState([]); // <--- 新增：存错题数据

  // 1. 初始化：请求 AI 生成题目
  useEffect(() => {
    // 这是一个耗时操作，DeepSeek 生成需要几秒钟
    client.post(`/reading/${articleId}/quiz`)
      .then(data => {
        setQuestions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("AI 生成题目失败，请稍后再试");
        setLoading(false);
      });
  }, [articleId]);

  // 2. 处理点击选项
  const handleOptionClick = (option) => {
    if (isSubmitted) return; // 提交后不能改
    setSelectedOption(option);
  };

  // 3. 提交答案
  const handleSubmit = () => {
    if (!selectedOption) return;
    setIsSubmitted(true);
    
    const currentQ = questions[currentIndex];
    const correctConfig = currentQ.answer.trim().toUpperCase(); 
    const userConfig = selectedOption.charAt(0).toUpperCase(); 

    if (correctConfig === userConfig) {
      setScore(score + 1);
    } else {
      // === ❌ 答错了！记录下来 ===
      setWrongQuestions(prev => [...prev, {
        question: currentQ.question,
        options: currentQ.options,
        correct_answer: currentQ.answer,
        user_answer: userConfig,
        explanation: currentQ.explanation,
        from_article_title: articleTitle || "Unknown Article"
      }]);
    }
  };

  // 4. 下一题
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      setIsFinished(true);
    }
  };

  // === 界面 A: 加载中 ===
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
        <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full mx-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-bold text-gray-800">AI 正在出题中...</h3>
          <p className="text-gray-500 text-sm mt-2">正在分析文章并生成测试题</p>
        </div>
      </div>
    );
  }

  // === 界面 B: 出错 ===
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl w-80 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={onClose} className="bg-gray-100 px-4 py-2 rounded-lg">关闭</button>
        </div>
      </div>
    );
  }

  // === 界面 C: 结算页 ===
  if (isFinished) {
    // === 在显示结算页前，静默提交错题 ===
    // 使用 useEffect 避免重复提交
    useEffect(() => {
        if (wrongQuestions.length > 0) {
            client.post('/mistakes/batch_add', wrongQuestions)
                .catch(e => console.error("保存错题失败", e));
        }
    }, []); // 这里的空依赖可能需要调整，或者直接在 render 里发请求（不推荐），最好是加个 sent 状态位

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-slideUp">
        <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full mx-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-purple-500"></div>
          <div className="text-6xl mb-4">
            {score === questions.length ? '🏆' : score > 0 ? '🎉' : '💪'}
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">测试完成!</h2>
          <p className="text-gray-500 mb-6">
            你答对了 <span className="text-blue-600 font-bold text-xl">{score}</span> / {questions.length} 题
	    {wrongQuestions.length > 0 && <span className="block text-sm text-red-400 mt-2">({wrongQuestions.length} 道错题已加入错题本)</span>}
          </p>
          <button 
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:scale-[1.02] transition-transform"
          >
            完成挑战
          </button>
        </div>
      </div>
    );
  }

  // === 界面 D: 答题页 (核心) ===
  const currentQ = questions[currentIndex];
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col relative">
        
        {/* 顶部进度条 */}
        <div className="h-2 bg-gray-100 w-full">
          <div 
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

        <div className="p-6">
          {/* 关闭按钮 */}
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>

          {/* 题目 */}
          <span className="text-blue-500 font-bold text-xs tracking-wider uppercase mb-2 block">Question {currentIndex + 1}</span>
          <h3 className="text-xl font-bold text-gray-800 mb-6 leading-relaxed">
            {currentQ.question}
          </h3>

          {/* 选项列表 */}
          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              // 样式逻辑
              let itemStyle = "border-gray-200 hover:border-blue-300 hover:bg-blue-50"; // 默认
              
              if (selectedOption === option) {
                itemStyle = "border-blue-500 bg-blue-50 ring-1 ring-blue-500"; // 选中
              }

              // 提交后的判定样式
              if (isSubmitted) {
                const isCorrectOption = option.startsWith(currentQ.answer);
                const isSelected = selectedOption === option;

                if (isCorrectOption) {
                  itemStyle = "border-green-500 bg-green-100 text-green-800 font-bold"; // 正确答案高亮
                } else if (isSelected && !isCorrectOption) {
                  itemStyle = "border-red-500 bg-red-100 text-red-800"; // 选错了
                } else {
                  itemStyle = "border-gray-100 opacity-50"; // 其他无关选项变淡
                }
              }

              return (
                <div 
                  key={idx}
                  onClick={() => handleOptionClick(option)}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${itemStyle}`}
                >
                  {option}
                </div>
              )
            })}
          </div>

          {/* 解析区域 (提交后显示) */}
          {isSubmitted && (
            <div className="mt-6 bg-yellow-50 p-4 rounded-xl border border-yellow-100 animate-fadeIn">
              <p className="font-bold text-yellow-800 text-sm mb-1">💡 解析 (Explanation)</p>
              <p className="text-sm text-yellow-700">{currentQ.explanation}</p>
            </div>
          )}

          {/* 底部按钮 */}
          <div className="mt-8">
            {!isSubmitted ? (
              <button 
                onClick={handleSubmit}
                disabled={!selectedOption}
                className={`w-full py-3 rounded-xl font-bold text-lg transition-all ${selectedOption ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                提交答案
              </button>
            ) : (
              <button 
                onClick={handleNext}
                className="w-full bg-green-500 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-green-600 animate-bounce-short"
              >
                {currentIndex < questions.length - 1 ? '下一题 →' : '查看结果'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default QuizModal;
