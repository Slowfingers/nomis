import * as React from 'react';

interface UzbekPatternProps {
  className?: string;
  opacity?: number;
}

export const UzbekPattern: React.FC<UzbekPatternProps> = ({ className = '', opacity = 0.06 }) => {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} style={{ opacity }}>
      <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Узбекский орнамент - повторяющийся паттерн */}
          <pattern id="uzbek-pattern" x="0" y="0" width="300" height="300" patternUnits="userSpaceOnUse">
            
            {/* Центральная мандала */}
            <g transform="translate(150, 150)">
              {/* Внешний круг с зубцами */}
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const x1 = Math.cos(rad) * 55;
                const y1 = Math.sin(rad) * 55;
                const x2 = Math.cos(rad) * 65;
                const y2 = Math.sin(rad) * 65;
                return (
                  <line 
                    key={`ray-${i}`}
                    x1={x1} 
                    y1={y1} 
                    x2={x2} 
                    y2={y2} 
                    stroke="#334155" 
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                );
              })}
              
              {/* Концентрические круги */}
              <circle cx="0" cy="0" r="60" fill="none" stroke="#334155" strokeWidth="2"/>
              <circle cx="0" cy="0" r="45" fill="none" stroke="#334155" strokeWidth="1.5"/>
              <circle cx="0" cy="0" r="30" fill="none" stroke="#334155" strokeWidth="1.5"/>
              
              {/* Внутренние лепестки */}
              {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const x = Math.cos(rad) * 38;
                const y = Math.sin(rad) * 38;
                return (
                  <g key={`inner-petal-${i}`}>
                    <path 
                      d={`M ${x} ${y} Q ${Math.cos(rad) * 48} ${Math.sin(rad) * 48} ${Math.cos((angle + 15) * Math.PI / 180) * 38} ${Math.sin((angle + 15) * Math.PI / 180) * 38}`}
                      fill="none" 
                      stroke="#334155" 
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}
              
              {/* Центральная звезда */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const x = Math.cos(rad) * 20;
                const y = Math.sin(rad) * 20;
                return (
                  <circle 
                    key={`center-dot-${i}`}
                    cx={x} 
                    cy={y} 
                    r="3" 
                    fill="#334155"
                  />
                );
              })}
              <circle cx="0" cy="0" r="8" fill="none" stroke="#334155" strokeWidth="2"/>
            </g>
            
            {/* Угловые элементы - ислими (вьющиеся растительные мотивы) */}
            <g transform="translate(30, 30)">
              <path d="M 0 20 Q 10 10 20 0" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round"/>
              <path d="M 5 20 Q 12 12 20 5" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="20" cy="0" r="4" fill="none" stroke="#334155" strokeWidth="1.5"/>
              <circle cx="0" cy="20" r="4" fill="none" stroke="#334155" strokeWidth="1.5"/>
              <path d="M 8 8 L 12 12" stroke="#334155" strokeWidth="1"/>
            </g>
            
            <g transform="translate(270, 30) scale(-1, 1)">
              <path d="M 0 20 Q 10 10 20 0" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round"/>
              <path d="M 5 20 Q 12 12 20 5" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="20" cy="0" r="4" fill="none" stroke="#334155" strokeWidth="1.5"/>
              <circle cx="0" cy="20" r="4" fill="none" stroke="#334155" strokeWidth="1.5"/>
              <path d="M 8 8 L 12 12" stroke="#334155" strokeWidth="1"/>
            </g>
            
            <g transform="translate(30, 270) scale(1, -1)">
              <path d="M 0 20 Q 10 10 20 0" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round"/>
              <path d="M 5 20 Q 12 12 20 5" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="20" cy="0" r="4" fill="none" stroke="#334155" strokeWidth="1.5"/>
              <circle cx="0" cy="20" r="4" fill="none" stroke="#334155" strokeWidth="1.5"/>
              <path d="M 8 8 L 12 12" stroke="#334155" strokeWidth="1"/>
            </g>
            
            <g transform="translate(270, 270) scale(-1, -1)">
              <path d="M 0 20 Q 10 10 20 0" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round"/>
              <path d="M 5 20 Q 12 12 20 5" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="20" cy="0" r="4" fill="none" stroke="#334155" strokeWidth="1.5"/>
              <circle cx="0" cy="20" r="4" fill="none" stroke="#334155" strokeWidth="1.5"/>
              <path d="M 8 8 L 12 12" stroke="#334155" strokeWidth="1"/>
            </g>
            
            {/* Боковые орнаменты - гирих (геометрические узоры) */}
            <g transform="translate(150, 30)">
              <path d="M -15 0 L 0 -10 L 15 0 L 0 10 Z" fill="none" stroke="#334155" strokeWidth="1.5"/>
              <path d="M -10 0 L 0 -7 L 10 0 L 0 7 Z" fill="none" stroke="#334155" strokeWidth="1"/>
            </g>
            
            <g transform="translate(150, 270)">
              <path d="M -15 0 L 0 -10 L 15 0 L 0 10 Z" fill="none" stroke="#334155" strokeWidth="1.5"/>
              <path d="M -10 0 L 0 -7 L 10 0 L 0 7 Z" fill="none" stroke="#334155" strokeWidth="1"/>
            </g>
            
            <g transform="translate(30, 150)">
              <path d="M 0 -15 L 10 0 L 0 15 L -10 0 Z" fill="none" stroke="#334155" strokeWidth="1.5"/>
              <path d="M 0 -10 L 7 0 L 0 10 L -7 0 Z" fill="none" stroke="#334155" strokeWidth="1"/>
            </g>
            
            <g transform="translate(270, 150)">
              <path d="M 0 -15 L 10 0 L 0 15 L -10 0 Z" fill="none" stroke="#334155" strokeWidth="1.5"/>
              <path d="M 0 -10 L 7 0 L 0 10 L -7 0 Z" fill="none" stroke="#334155" strokeWidth="1"/>
            </g>
            
            {/* Промежуточные декоративные элементы */}
            {[75, 225].map((x, i) => 
              [75, 225].map((y, j) => (
                <g key={`deco-${i}-${j}`} transform={`translate(${x}, ${y})`}>
                  <circle cx="0" cy="0" r="12" fill="none" stroke="#334155" strokeWidth="1.5"/>
                  <circle cx="0" cy="0" r="6" fill="none" stroke="#334155" strokeWidth="1"/>
                  <path d="M -8 0 L 8 0 M 0 -8 L 0 8" stroke="#334155" strokeWidth="1"/>
                </g>
              ))
            )}
            
          </pattern>
        </defs>
        
        {/* Применение паттерна */}
        <rect width="100%" height="100%" fill="url(#uzbek-pattern)"/>
      </svg>
    </div>
  );
};
