import React from 'react';

interface DefaultSchoolLogoProps {
  className?: string;
  schoolName?: string;
}

export const DefaultSchoolLogo: React.FC<DefaultSchoolLogoProps> = ({
  className = 'w-28 h-28',
  schoolName = 'TK SINAR DUNIA',
}) => {
  return (
    <svg
      viewBox="0 0 220 220"
      className={className}
      role="img"
      aria-label={`Logo ${schoolName}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Pentagon */}
      <polygon
        points="110,10 206,80 169,198 51,198 14,80"
        fill="#1D4ED8"
        stroke="#FACC15"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {/* Inner White Trim Pentagon */}
      <polygon
        points="110,21 195,84 162,188 58,188 25,84"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Radiant Sun */}
      <circle cx="110" cy="84" r="24" fill="#FDE047" stroke="#FFFFFF" strokeWidth="2" />
      {/* Sun Rays */}
      <g stroke="#FDE047" strokeWidth="3" strokeLinecap="round">
        <line x1="110" y1="47" x2="110" y2="54" />
        <line x1="110" y1="114" x2="110" y2="121" />
        <line x1="73" y1="84" x2="80" y2="84" />
        <line x1="140" y1="84" x2="147" y2="84" />
        <line x1="84" y1="58" x2="89" y2="63" />
        <line x1="131" y1="105" x2="136" y2="110" />
        <line x1="136" y1="58" x2="131" y2="63" />
        <line x1="89" y1="105" x2="84" y2="110" />
      </g>
      {/* Open Book */}
      <path
        d="M68,125 C84,117 98,120 110,129 C122,120 136,117 152,125 L152,146 C136,139 122,141 110,149 C98,141 84,139 68,146 Z"
        fill="#FFFFFF"
        stroke="#1E3A8A"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <line x1="110" y1="129" x2="110" y2="149" stroke="#1E3A8A" strokeWidth="2" />
      {/* Ribbon / Banner Text */}
      <text
        x="110"
        y="168"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="14.5"
        fontWeight="700"
        fontFamily="Plus Jakarta Sans, Arial, sans-serif"
        letterSpacing="0.8"
      >
        TK SINAR DUNIA
      </text>
      <text
        x="110"
        y="183"
        textAnchor="middle"
        fill="#FDE047"
        fontSize="11.5"
        fontWeight="700"
        fontFamily="Plus Jakarta Sans, Arial, sans-serif"
        letterSpacing="1.6"
      >
        NGAJUM
      </text>
    </svg>
  );
};

interface SchoolLogoProps {
  logoDataUrl: string | null;
  schoolName?: string;
  className?: string;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  logoDataUrl,
  schoolName = 'TK SINAR DUNIA',
  className = 'w-28 h-28',
}) => {
  if (logoDataUrl) {
    return (
      <img
        src={logoDataUrl}
        alt={`Logo ${schoolName}`}
        referrerPolicy="no-referrer"
        className={`${className} object-contain`}
      />
    );
  }
  return <DefaultSchoolLogo className={className} schoolName={schoolName} />;
};
