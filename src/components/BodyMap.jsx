import React from 'react';

// Approximate % positions on the croqui image (top/left as % of image height/width)
// These define where the glowing highlight lines appear over the real croqui photo
const HIGHLIGHTS = {
  shoulder:      { type: 'hline', y: 21,  x1: 28, x2: 72,  label: 'Shoulder' },
  bust:          { type: 'hline', y: 29,  x1: 22, x2: 78,  label: 'Bust' },
  waist:         { type: 'hline', y: 40,  x1: 26, x2: 74,  label: 'Waist' },
  hips:          { type: 'hline', y: 49,  x1: 24, x2: 76,  label: 'Hips' },
  gownLength:    { type: 'vline', x: 16,  y1: 20, y2: 82,  label: 'Length' },
  sleeveLength:  { type: 'diag', x1: 28, y1: 22, x2: 16, y2: 50, label: 'Sleeve' },
  trouserLength: { type: 'vline', x: 38, y1: 50, y2: 93,  label: 'Trouser' },
  thigh:         { type: 'hline', y: 56,  x1: 28, x2: 52,  label: 'Thigh' },
};

const CROQUI_URL = 'https://media.base44.com/images/public/697d0c21476d1c06f4d428ff/da94c08a4_Croqui.jpg';

export default function BodyMap({ activeField, isPremium, measurements = {} }) {
  const gold = '#d4af37';
  const indigoPrimary = '#818cf8';
  const activeColor = isPremium ? gold : '#f43f5e';
  const idleColor = isPremium ? indigoPrimary : '#94a3b8';

  const renderHighlight = (key, h, isActive) => {
    const color = isActive ? activeColor : idleColor;
    const opacity = isActive ? 1 : 0.35;
    const strokeWidth = isActive ? 2.5 : 1.2;
    const glow = isActive ? `drop-shadow(0 0 5px ${color})` : 'none';
    const value = measurements[key];

    const style = {
      stroke: color,
      strokeWidth,
      opacity,
      transition: 'all 0.3s ease',
      filter: glow,
      strokeDasharray: isActive ? '0' : '5 3',
    };

    const labelStyle = {
      fill: color,
      fontSize: isActive ? 5.5 : 4.5,
      fontWeight: isActive ? 700 : 400,
      fontFamily: 'monospace',
      opacity: isActive ? 1 : 0.5,
      transition: 'all 0.3s ease',
    };

    if (h.type === 'hline') {
      const midX = (h.x1 + h.x2) / 2;
      return (
        <g key={key}>
          <line x1={`${h.x1}%`} y1={`${h.y}%`} x2={`${h.x2}%`} y2={`${h.y}%`} style={style} />
          {isActive && (
            <text x={`${h.x2 + 1}%`} y={`${h.y + 1}%`} style={labelStyle}>
              {h.label}{value ? `: ${value}"` : ''}
            </text>
          )}
        </g>
      );
    }
    if (h.type === 'vline') {
      return (
        <g key={key}>
          <line x1={`${h.x}%`} y1={`${h.y1}%`} x2={`${h.x}%`} y2={`${h.y2}%`} style={style} />
          {isActive && (
            <text x={`${h.x + 1}%`} y={`${(h.y1 + h.y2) / 2}%`} style={labelStyle}>
              {h.label}{value ? `: ${value}"` : ''}
            </text>
          )}
        </g>
      );
    }
    if (h.type === 'diag') {
      return (
        <g key={key}>
          <line x1={`${h.x1}%`} y1={`${h.y1}%`} x2={`${h.x2}%`} y2={`${h.y2}%`} style={style} />
          {isActive && (
            <text x={`${(h.x1 + h.x2) / 2}%`} y={`${(h.y1 + h.y2) / 2}%`} style={labelStyle}>
              {h.label}{value ? `: ${value}"` : ''}
            </text>
          )}
        </g>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center w-full">
      <p className={`text-xs mb-2 font-semibold text-center ${isPremium ? 'text-indigo-300' : 'text-slate-500'}`}>
        Click a field to see where to measure
      </p>
      <div className="relative w-full max-w-[160px] mx-auto">
        {/* Croqui image */}
        <img
          src={CROQUI_URL}
          alt="Fashion croqui mannequin"
          className="w-full h-auto select-none"
          style={{ filter: isPremium ? 'none' : 'grayscale(20%)' }}
          draggable={false}
        />
        {/* SVG overlay for highlight lines */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {Object.entries(HIGHLIGHTS).map(([key, h]) =>
            renderHighlight(key, h, activeField === key)
          )}
        </svg>
      </div>
    </div>
  );
}