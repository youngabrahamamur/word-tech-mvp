import React, { useEffect, useState } from 'react';
import client from '../api/client';

const ReadingList = ({ onSelectArticle }) => {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    client.get('/reading/list').then(setArticles);
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">每日阅读</h2>
      <div className="space-y-4">
        {articles.map(article => (
          <div 
            key={article.id}
            onClick={() => onSelectArticle(article.id)}
            className="bg-white p-5 rounded-xl shadow hover:shadow-md cursor-pointer transition border border-transparent hover:border-blue-300"
          >
            <h3 className="text-xl font-bold text-gray-800">{article.title}</h3>
            <p className="text-gray-500 text-sm mt-2 line-clamp-2">{article.content}</p>
            <div className="mt-3 flex gap-2">
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">AI 生成</span>
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">包含 {article.vocab_list.length} 个生词</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ReadingList;
