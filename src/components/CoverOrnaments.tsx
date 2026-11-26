import React from 'react';

interface CornerProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  color?: string;
}

const ROTATION: Record<CornerProps['position'], string> = {
  'top-left': 'rotate(0)',
  'top-right': 'scale(-1, 1)',
  'bottom-left': 'scale(1, -1)',
  'bottom-right': 'scale(-1, -1)',
};

export const CornerOrnament: React.FC<CornerProps> = ({
  position,
  color = '#6B21A8',
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-20 h-20 pointer-events-none select-none"
      style={{ transform: ROTATION[position] }}
      aria-hidden="true"
    >
      {/* Classic L-frame outer & inner lines */}
      <path
        d="M6,94 L6,6 L94,6"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="square"
      />
      <path
        d="M14,94 L14,14 L94,14"
        fill="none"
        stroke={color}
        strokeWidth="1.25"
        strokeLinecap="square"
      />
      {/* Corner rosette & classic scroll filigree */}
      <circle cx="22" cy="22" r="6" fill="none" stroke={color} strokeWidth="1.5" />
      <circle cx="22" cy="22" r="2.2" fill={color} />
      <path
        d="M28,22 C44,22 48,14 62,14 C70,14 75,20 68,26 C62,31 54,25 58,20"
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M22,28 C22,44 14,48 14,62 C14,70 20,75 26,68 C31,62 25,54 20,58"
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M28,28 C38,34 38,44 30,48 C24,51 20,44 26,40"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M28,28 C34,38 44,38 48,30 C51,24 44,20 40,26"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
};
