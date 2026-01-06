import React from 'react';

const PrivacyPage = () => {
  return (
    <div className="max-w-3xl mx-auto p-8 bg-white min-h-screen text-gray-700">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">隐私政策 (Privacy Policy)</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-bold mb-2">1. 我们收集的信息</h2>
          <ul className="list-disc pl-5">
            <li>账户信息（通过 Clerk 授权的邮箱、头像）。</li>
            <li>学习数据（背词进度、错题、作文记录）。</li>
            <li>支付状态（通过 Stripe 处理，我们不存储信用卡号）。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">2. 数据使用</h2>
          <p>我们收集的数据仅用于提供和改进学习服务。我们不会将您的个人数据出售给第三方。</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">3. 第三方服务</h2>
          <p>本应用使用了 DeepSeek (AI生成)、Clerk (认证)、Stripe (支付)。这些服务可能会根据其隐私政策处理您的数据。</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
