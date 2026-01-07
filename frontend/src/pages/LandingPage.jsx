import React from 'react';
import { SignInButton } from "@clerk/clerk-react";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      
      {/* 1. 导航栏 */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
          SmartCram
        </div>
        <div className="space-x-6">
          <SignInButton mode="modal">
            <button className="text-gray-600 font-bold hover:text-gray-900">登录</button>
          </SignInButton>
          <SignInButton mode="modal">
            <button className="bg-gray-900 text-white px-5 py-2 rounded-full font-bold hover:bg-gray-800 transition">
              免费注册
            </button>
          </SignInButton>
        </div>
      </nav>

      {/* 2. Hero 区域 (首屏) */}
      <header className="text-center mt-20 px-4">
        <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-blue-50 text-blue-700 font-bold text-sm border border-blue-100">
          🚀 2026 新一代 AI 备考工具
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
          告别死记硬背，<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            用 AI 降维打击考试。
          </span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          SmartCram 根据你的词汇量，利用 DeepSeek 实时生成阅读文章和写作批改。
          <br className="hidden md:block" />
          中考、高考、雅思、托福，全龄段自适应。
        </p>
        
        <SignInButton mode="modal">
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full text-xl font-bold shadow-xl shadow-blue-200 hover:scale-105 transition-transform">
            立即开始 (免费)
          </button>
        </SignInButton>
        
        <p className="mt-4 text-sm text-gray-400">无需绑卡 · 30秒注册 · 每日免费额度</p>
      </header>

      {/* 3. 特性展示 (Bento 风格) */}
      <section className="max-w-6xl mx-auto mt-32 px-4 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:border-blue-200 transition">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-xl font-bold mb-2">语境记忆</h3>
            <p className="text-gray-500">不再孤立背单词。AI 自动生成包含生词的短文，在阅读中自然记住单词。</p>
          </div>
          {/* Feature 2 */}
          <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:border-purple-200 transition">
            <div className="text-4xl mb-4">✍️</div>
            <h3 className="text-xl font-bold mb-2">写作精批</h3>
            <p className="text-gray-500">像雅思高分助教一样。秒级批改，红绿纠错，还能提供满分范文重写。</p>
          </div>
          {/* Feature 3 */}
          <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:border-pink-200 transition">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">科学复习</h3>
            <p className="text-gray-500">内置艾宾浩斯遗忘曲线算法，智能安排复习时间，拒绝无效重复。</p>
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="border-t border-gray-100 py-12 text-center">
        <p className="text-gray-400 mb-4">SmartCram © 2026</p>
        <div className="space-x-4 text-sm text-gray-500">
          <a href="/terms" className="hover:text-blue-600">用户协议</a>
          <a href="/privacy" className="hover:text-blue-600">隐私政策</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
