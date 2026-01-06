import React, { useEffect, useState } from 'react';
import client from '../api/client';
import ProgressRing from '../components/ProgressRing';
import LevelSelector from '../components/LevelSelector';
// 1. 引入 Clerk 组件
import { useUser, UserButton } from "@clerk/clerk-react";

const Dashboard = ({ onStartStudy, onStartReading, onOpenMistakes, onStartWriting, onStartGrammar }) => {
  const [showLevelModal, setShowLevelModal] = useState(false);
  // 2. 获取当前用户信息
  const { user } = useUser();

  const [stats, setStats] = useState({ 
    total_learned: 0, 
    today_task: 15, // 默认给个值防止除以0看起来丑
    streak_days: 0, 
    vocabulary_limit: 880, 
    daily_progress: 0 // <--- 初始化加一个 0
  });
  

  useEffect(() => {
    client.get('/user/dashboard').then(setStats).catch(console.error);
  }, []);

  // 计算总体进度的百分比
  const totalPercent = Math.min(100, Math.round((stats.total_learned / stats.vocabulary_limit) * 100));

  const handleEditTarget = () => {
    const newTarget = prompt("请输入新的每日单词目标 (例如 20):", stats.today_task);
    if (newTarget && !isNaN(newTarget) && newTarget > 0) {
      // 乐观更新 UI
      setStats({ ...stats, today_task: parseInt(newTarget) });
      
      // 发送请求
      client.post('/user/update_target', { target: parseInt(newTarget) })
        .catch(err => {
          console.error(err);
          alert("修改失败");
        });
    }
  };

  const handleLevelChange = (newLevel) => {
    client.post('/user/update_level', { level: newLevel }).then(res => {
        // 更新本地状态
        setStats({ ...stats, current_level: res.current_level, level_display: res.level_name });
        setShowLevelModal(false);
        // 这里可以加个 reload 或者提示 "切换成功，下次背单词生效"
        alert(`已切换到 ${res.level_name} 模式！后续内容将自动调整难度。`);
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6 pb-24 font-sans text-gray-800">
      
      {/* 1. Header: 欢迎语 + 头像 */}
      <header className="flex justify-between items-center mb-8 pt-2">
        <div>
	  <div
            onClick={() => setShowLevelModal(true)}
            className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm text-xs font-bold text-blue-600 mb-2 cursor-pointer border border-blue-100 hover:scale-105 transition"
          >
            <span>🎯</span>
            <span>{stats.level_display || "中考"}</span>
            <span>▼</span>
          </div>
          <p className="text-gray-400 text-sm font-medium mb-1">Welcome back,</p>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">{user?.firstName || user?.username || "Scholar"} 👋</h1>
        </div>
	<div className="scale-125"> {/* 稍微放大一点，更好看 */}
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* 弹窗挂载 */}
      {showLevelModal && (
        <LevelSelector 
            currentLevel={stats.current_level} 
            onSelect={handleLevelChange} 
            onClose={() => setShowLevelModal(false)} 
        />
      )}

      {/* 2. Bento Grid 布局核心区域 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        
        {/* 卡片 A: 今日核心任务 (占据左侧大块) */}
        <div className="bg-white col-span-1 row-span-2 rounded-[30px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center relative overflow-hidden border border-gray-100">
           {/* 背景装饰 */}
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
           
           <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Daily Goal</h3>
           <ProgressRing 
              radius={60} 
              stroke={10} 
              progress={stats.daily_progress || 0}
              total={stats.today_task} 
              colorStart="#3b82f6" 
              colorEnd="#8b5cf6"
           />
           <div 
             className="mt-4 text-center cursor-pointer hover:opacity-70 transition"
             onClick={handleEditTarget}
             title="点击修改目标"
           >
             <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
               Target ✏️
             </p>
             <p className="font-bold text-lg">{stats.today_task} Words</p>
           </div>
        </div>

        {/* 卡片 B: 连续打卡 (右上) */}
        <div className="bg-orange-50 col-span-1 rounded-[24px] p-4 flex flex-col justify-center items-start border border-orange-100 relative overflow-hidden">
           <div className="absolute right-[-10px] top-[-10px] text-6xl opacity-20">🔥</div>
           <p className="text-orange-600 text-xs font-bold uppercase">Streak</p>
           <div className="flex items-baseline mt-1">
             <span className="text-3xl font-black text-orange-500">{stats.streak_days}</span>
             <span className="text-xs text-orange-400 ml-1 font-bold">Days</span>
           </div>
        </div>

        {/* 卡片 C: 总词汇量 (右下) */}
        <div className="bg-blue-50 col-span-1 rounded-[24px] p-4 flex flex-col justify-center items-start border border-blue-100 relative overflow-hidden">
           <div className="absolute right-[-10px] bottom-[-10px] text-6xl opacity-20">🏆</div>
           <p className="text-blue-600 text-xs font-bold uppercase">Mastered</p>
           <div className="flex items-baseline mt-1">
             <span className="text-3xl font-black text-blue-500">{stats.total_learned}</span>
             <span className="text-xs text-blue-400 ml-1 font-bold">/ {stats.vocabulary_limit}</span>
           </div>
        </div>

	{/* 新增卡片 D: 错题本入口 (加在 grid 里) */}
        <div 
          onClick={onOpenMistakes} // 需要从父组件传下来
          className="bg-red-50 col-span-2 rounded-[24px] p-4 flex items-center justify-between border border-red-100 cursor-pointer active:scale-95 transition"
        >
           <div className="flex items-center gap-3">
             <div className="bg-red-100 p-2 rounded-full text-xl">📕</div>
             <div>
               <h4 className="font-bold text-red-800">错题本</h4>
               <p className="text-xs text-red-400">Review Mistakes</p>
             </div>
           </div>
           <div className="text-red-400">➜</div>
        </div>
      </div>

      {/* 3. 总体进度条 (长条) */}
      <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 mb-8">
        <div className="flex justify-between items-end mb-2">
          <span className="font-bold text-gray-700">Level Progress</span>
          <span className="text-sm font-bold text-purple-600">{totalPercent}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 h-3 rounded-full transition-all duration-1000"
            style={{ width: `${totalPercent}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-400 mt-2">You are crushing it! Keep going.</p>
      </div>

      {/* 4. 功能入口 (大按钮) */}
      <h3 className="text-xl font-bold text-gray-900 mb-4">Start Learning</h3>
      
      <div className="space-y-4">
        {/* 背单词入口 */}
        <button 
          onClick={onStartStudy}
          className="w-full group bg-white p-4 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-transparent hover:border-blue-200 transition-all active:scale-[0.98] flex items-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-3xl shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
            ⚡️
          </div>
          <div className="ml-4 text-left flex-1">
            <h4 className="text-lg font-bold text-gray-800">Flashcards</h4>
            <p className="text-sm text-gray-400">Review today's queue</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
            ➜
          </div>
        </button>

        {/* 阅读入口 */}
        <button 
          onClick={onStartReading}
          className="w-full group bg-white p-4 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-transparent hover:border-purple-200 transition-all active:scale-[0.98] flex items-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-3xl shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform">
            🧠
          </div>
          <div className="ml-4 text-left flex-1">
            <h4 className="text-lg font-bold text-gray-800">AI Reading</h4>
            <p className="text-sm text-gray-400">Contextual learning</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
            ➜
          </div>
        </button>
	
	{/* 写作入口 */}
        <button 
          onClick={onStartWriting}
          className="w-full group bg-white p-4 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-transparent hover:border-cyan-200 transition-all active:scale-[0.98] flex items-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-3xl shadow-lg shadow-cyan-200 group-hover:scale-110 transition-transform">
            ✍️
          </div>
          <div className="ml-4 text-left flex-1">
            <h4 className="text-lg font-bold text-gray-800">Writing</h4>
            <p className="text-sm text-gray-400">AI correction & feedback</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
            ➜
          </div>
        </button>

	{/* 新增: 语法分析入口 */}
        <button 
          onClick={onStartGrammar}
          className="w-full group bg-white p-4 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-transparent hover:border-indigo-200 transition-all active:scale-[0.98] flex items-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-3xl shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
            🔍
          </div>
          <div className="ml-4 text-left flex-1">
            <h4 className="text-lg font-bold text-gray-800">Grammar Scan</h4>
            <p className="text-sm text-gray-400">Analyze complex sentences</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
            ➜
          </div>
        </button>
      </div>

    </div>
  );
};

export default Dashboard;
