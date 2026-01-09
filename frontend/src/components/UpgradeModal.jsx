import React, { useState } from 'react';
import client from '../api/client';

const UpgradeModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('code'); // 'code' 或 'stripe'
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. 兑换码逻辑
  const handleRedeem = () => {
    if (!code.trim()) return;
    setLoading(true);
    client.post('/payment/redeem', { code })
      .then(res => {
        alert(`🎉 兑换成功！有效期至：${new Date(res.new_expiry).toLocaleDateString()}`);
        window.location.reload();
      })
      .catch(err => alert(err.response?.data?.detail || "兑换失败"))
      .finally(() => setLoading(false));
  };

  const goToBuyCode = () => {
    window.open("https://mbd.pub/o/bread/mbd-YZWal51vaw==", "_blank"); // 你的面包多链接
  };

  // 2. Stripe 逻辑
  const handleStripeCheckout = () => {
    setLoading(true);
    client.post('/payment/create-checkout-session', { plan: 'monthly' })
      .then(res => {
        window.location.href = res.url;
      })
      .catch(err => {
        alert("连接国际支付网关失败");
        setLoading(false);
      });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
        
        {/* 关闭按钮 */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">✕</button>
        
        {/* 顶部标题区 */}
        <div className="bg-gray-50 p-6 pb-4 border-b border-gray-100 text-center">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">
            升级会员
          </h2>
          <p className="text-gray-500 text-sm mt-1">解锁无限 AI 功能，助力考试通关</p>
        </div> {/* Upgrade to Pro */}

        {/* Tab 切换栏 */}
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('code')}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'code' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-400 hover:text-gray-600'}`}
          >
            🎟️ 兑换码 (微信/支付宝)
          </button>
          <button 
            onClick={() => setActiveTab('stripe')}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'stripe' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50' : 'text-gray-400 hover:text-gray-600'}`}
          >
            💳 订阅 (国际卡)
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 min-h-[250px]">
          
          {/* === 模式 A: 兑换码 === */}
          {activeTab === 'code' && (
            <div className="animate-fadeIn">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                <h3 className="font-bold text-blue-800 mb-1 text-sm">如何获取？</h3>
                <p className="text-xs text-blue-600 mb-3">前往官方发卡店购买，自动发货。</p>
                <button onClick={goToBuyCode} className="w-full bg-blue-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-blue-600 transition">
                  购买月卡 (￥19.9)
                </button>
              </div>
              
              <div>
                <input 
                  type="text" 
                  placeholder="在此输入 VIP-XXXX 兑换码"
                  className="w-full p-3 border border-gray-200 rounded-xl mb-3 focus:ring-2 focus:ring-blue-500 outline-none uppercase text-center font-mono tracking-widest"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                />
                <button 
                  onClick={handleRedeem}
                  disabled={loading || !code}
                  className={`w-full py-3 rounded-xl font-bold text-white transition ${loading ? 'bg-gray-400' : 'bg-gray-900 hover:bg-black'}`}
                >
                  {loading ? "验证中..." : "立即激活"}
                </button>
              </div>
            </div>
          )}

          {/* === 模式 B: Stripe === */}
          {activeTab === 'stripe' && (
            <div className="animate-fadeIn text-center pt-2">
              <div className="mb-6">
                <span className="text-4xl font-black text-gray-800">$2.99</span>
                <span className="text-gray-500"> / month</span>
              </div>
              
              <ul className="text-left text-sm text-gray-600 space-y-3 mb-8 px-4">
                <li className="flex items-center gap-2">✅ <span>无限 AI 阅读生成 & 测验</span></li>
                <li className="flex items-center gap-2">✅ <span>无限 AI 写作批改</span></li>
                <li className="flex items-center gap-2">✅ <span>长难句深度分析</span></li>
                <li className="flex items-center gap-2">🔄 <span>自动续费，随时取消</span></li>
              </ul>

              <button 
                onClick={handleStripeCheckout}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-purple-200 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
              >
                {loading ? "跳转中..." : "Subscribe via Stripe"}
              </button>
              
              <p className="text-xs text-gray-400 mt-4">Secured by Stripe. Cancel anytime.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
