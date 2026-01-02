import React from 'react';

const ProgressRing = ({ radius, stroke, progress, total, colorStart = "#6366f1", colorEnd = "#a855f7" }) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / total) * circumference;
  const uniqueId = `grad-${Math.random().toString(36).substr(2, 9)}`; // 生成唯一ID防止冲突

  return (
    <div className="relative flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
        <defs>
          <linearGradient id={uniqueId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorStart} />
            <stop offset="100%" stopColor={colorEnd} />
          </linearGradient>
        </defs>
        {/* 轨道 */}
        <circle
          stroke="#f3f4f6"
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          strokeLinecap="round"
        />
        {/* 进度条 */}
        <circle
          stroke={`url(#${uniqueId})`}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s ease-in-out' }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      {/* 中间内容 */}
      <div className="absolute text-center flex flex-col items-center">
        <span className="text-3xl font-black text-gray-800">{progress}</span>
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Today</span>
      </div>
    </div>
  );
};

export default ProgressRing;
