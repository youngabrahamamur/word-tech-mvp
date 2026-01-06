import React from 'react';

const TermsPage = () => {
  return (
    <div className="max-w-3xl mx-auto p-8 bg-white min-h-screen text-gray-700">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">用户协议 (Terms of Service)</h1>
      <p className="mb-4 text-sm text-gray-500">最后更新日期：2026年1月1日</p>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-bold mb-2">1. 服务说明</h2>
          <p>WordTech 是一个 AI 驱动的英语学习辅助工具。我们利用人工智能技术生成内容，但不保证所有内容的 100% 准确性。</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">2. 订阅与退款</h2>
          <p>你可以随时取消订阅。由于数字产品的特性，原则上我们不提供退款，除非法律另有规定。</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">3. 免责声明 (Disclaimer)</h2>
          <p>本服务按“原样”提供。我们不对因使用本服务产生的任何直接或间接损失负责。AI 生成的建议仅供参考，不能替代专业教师。</p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
