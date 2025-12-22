import * as React from 'react';

interface UzbekPatternProps {
  className?: string;
  opacity?: number;
}

export const UzbekPattern: React.FC<UzbekPatternProps> = ({ className = '', opacity = 0.03 }) => {
  return (
    <div 
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} 
      style={{ 
        opacity,
        backgroundImage: 'url(/1270666.svg)',
        backgroundRepeat: 'repeat',
        backgroundSize: '400px 400px'
      }}
    />
  );
};
