import React, { useEffect, useState } from 'react';
import useStudyStore from './stores/studyStore';
import FlashCard from './components/FlashCard';
import ReadingList from './pages/ReadingList';
import ArticleReader from './pages/ArticleReader';
import Dashboard from './pages/Dashboard';
import MistakeBook from './pages/MistakeBook';
import WritingPage from './pages/WritingPage'; // 引入组件

function App() {
  const { queue, fetchQueue, isLoading, isFinished } = useStudyStore();
  
  // 🟢 修复1: 默认视图改为 'dashboard'
  const [view, setView] = useState('dashboard'); 
  const [currentArticleId, setCurrentArticleId] = useState(null);

  // 视图渲染逻辑
  const renderView = () => {
    // === 1. 仪表盘 (Dashboard) ===
    if (view === 'dashboard') {
      return (
        <Dashboard
          onStartStudy={() => {
            fetchQueue(); // 点击开始时才去拉取单词
            setView('home');
          }}
          onStartReading={() => setView('reading')}
	  onOpenMistakes={() => setView('mistakes')} // <--- 新增
	  onStartWriting={() => setView('writing')} // <--- 新增
        />
      );
    }

    // === 2. 阅读相关 (Reading) ===
    if (view === 'article') {
      return <ArticleReader articleId={currentArticleId} onBack={() => setView('reading')} />;
    }
    if (view === 'reading') {
      return (
        <div className="pb-16 min-h-screen bg-gray-50">
            {/* 顶部导航：统一使用小房子图标 */}
            <div className="p-4 bg-white shadow-sm flex items-center sticky top-0 z-10">
                <button onClick={() => setView('dashboard')} className="mr-4 text-2xl hover:scale-110 transition">🏠</button>
                <h2 className="font-bold text-lg text-gray-800">阅读列表</h2>
            </div>
            <ReadingList onSelectArticle={(id) => { setCurrentArticleId(id); setView('article'); }} />
        </div>
      );
    }
    if (view === 'mistakes') {
      return <MistakeBook onBack={() => setView('dashboard')} />;
    }
    if (view === 'writing') {
      return <WritingPage onBack={() => setView('dashboard')} />;
    }

    // === 3. 背单词 (Home) ===
    
    // A. 加载中
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-xl text-gray-500 animate-pulse">正在生成今日学习计划...</div>
        </div>
      );
    }

    // 🟢 修复2: 找回了丢失的“完成状态”判断
    // 如果没有这段代码，背完单词后就会卡住
    if (isFinished) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 pb-20">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h1 className="text-3xl font-bold text-green-700 mb-2">太棒了！</h1>
          <p className="text-green-600 mb-8">今天的单词任务已完成。</p>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setView('dashboard')} 
              className="bg-white text-green-600 border border-green-200 px-6 py-3 rounded-full font-bold shadow hover:bg-green-50"
            >
              返回主页
            </button>
            <button 
              onClick={() => fetchQueue()} 
              className="bg-green-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-green-700"
            >
              再来一组
            </button>
          </div>
        </div>
      );
    }

    // 🟢 修复3: 找回了“没有待学单词”的判断
    if (queue.length === 0) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
           <div className="text-gray-400 mb-4">暂无待复习单词</div>
           <button onClick={() => setView('dashboard')} className="text-blue-500 font-bold">返回主页</button>
        </div>
      );
    }

    // B. 正常背单词界面
    return (
      <div className="pb-20 min-h-screen bg-gray-50">
         {/* 🟢 修复4: 顶部导航改为你喜欢的小房子样式 */}
         <div className="p-4 bg-white shadow-sm flex items-center mb-4">
            <button onClick={() => setView('dashboard')} className="mr-4 text-2xl hover:scale-110 transition">🏠</button>
            <div className="font-bold flex-1 text-center pr-8 text-gray-800">今日任务</div>
         </div>
         <FlashCard />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderView()}
    </div>
  );
}

export default App;
