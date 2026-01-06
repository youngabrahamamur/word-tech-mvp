import React from 'react';

const LEVELS = [
  { id: 'zk', name: '中考', icon: '🎒' },
  { id: 'gk', name: '高考', icon: '🏫' },
  { id: 'cet4', name: '四级', icon: '📘' },
  { id: 'cet6', name: '六级', icon: '📙' },
  { id: 'ky', name: '考研', icon: '🎓' },
  { id: 'ielts', name: '雅思', icon: '🌏' },
  { id: 'toefl', name: '托福', icon: '🗽' },
];

const LevelSelector = ({ currentLevel, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white p-6 rounded-3xl w-80 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-gray-800">选择当前目标</h3>
            <button onClick={onClose} className="text-gray-400">✕</button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
            {LEVELS.map(lvl => (
                <button
                    key={lvl.id}
                    onClick={() => onSelect(lvl.id)}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                        currentLevel === lvl.id 
                        ? 'border-blue-500 bg-blue-50 text-blue-600' 
                        : 'border-gray-100 hover:border-blue-200 text-gray-600'
                    }`}
                >
                    <span className="text-2xl">{lvl.icon}</span>
                    <span className="font-bold text-sm">{lvl.name}</span>
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default LevelSelector;
