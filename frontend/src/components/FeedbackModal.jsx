import React, { useState } from 'react';
import client from '../api/client';

const FeedbackModal = ({ onClose }) => {
  const [content, setContent] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = () => {
    if (!content.trim()) return;
    setSending(true);
    client.post('/user/feedback', { content, contact_email: email })
      .then(() => {
        alert("感谢您的反馈！我们会认真阅读。");
        onClose();
      })
      .catch(() => alert("发送失败，请稍后重试"))
      .finally(() => setSending(false));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl m-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4">💬 意见反馈</h3>
        
        <textarea
          className="w-full p-3 border border-gray-200 rounded-xl mb-4 h-32 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          placeholder="遇到了Bug？还是有新功能建议？请告诉我们要如何改进..."
          value={content}
          onChange={e => setContent(e.target.value)}
        ></textarea>
        
        <input 
          type="email"
          className="w-full p-3 border border-gray-200 rounded-xl mb-6 outline-none"
          placeholder="联系邮箱 (选填，方便我们要回复您)"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600">取消</button>
          <button 
            onClick={handleSubmit}
            disabled={!content.trim() || sending}
            className="flex-1 py-3 bg-blue-600 rounded-xl font-bold text-white hover:bg-blue-700"
          >
            {sending ? "发送中..." : "发送"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
