import React from "react";

interface BachelorPointLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "full-responsive";
  theme?: "light" | "dark";
}

export function BachelorPointLogo({
  className = "",
  size = "md",
  variant = "full",
  theme = "dark"
}: BachelorPointLogoProps) {
  // Compute dimensions based on size presets
  const sizeMap = {
    sm: { width: 48, height: 48, iconSize: 40, titleText: "text-sm", subText: "text-[9px]" },
    md: { width: 80, height: 80, iconSize: 72, titleText: "text-base", subText: "text-[10px]" },
    lg: { width: 140, height: 140, iconSize: 120, titleText: "text-lg", subText: "text-xs" },
    xl: { width: 220, height: 220, iconSize: 180, titleText: "text-xl", subText: "text-xs" }
  };

  const selectedSize = sizeMap[size];

  // Colors based on theme choice
  const textTitleColor = theme === "dark" ? "text-white" : "text-emerald-950";
  const textSubColor = theme === "dark" ? "text-amber-400" : "text-amber-650";
  const taglineColor = theme === "dark" ? "text-emerald-300/80" : "text-slate-500 font-medium";

  // The actual beautiful SVG representation of the official Bachelor Point Hostel Emblem
  const renderSVGIcon = (iconSize: number) => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 400 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      {/* Outer Compass Circle */}
      <circle cx="200" cy="160" r="145" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.4" />
      <circle cx="200" cy="160" r="150" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.35" />

      {/* Compass direction pointer ticks */}
      <text x="193" y="28" fill="#1e293b" className="font-sans font-black text-xs text-[18px]">N</text>

      {/* Star/Compass Rose rays behind house (Sunburst/Compass vectors) */}
      <g stroke="#f59e0b" strokeWidth="2" strokeOpacity="0.8">
        <line x1="200" y1="40" x2="200" y2="70" />
        <line x1="200" y1="250" x2="200" y2="280" />
        <line x1="80" y1="160" x2="110" y2="160" />
        <line x1="290" y1="160" x2="320" y2="160" />
      </g>

      {/* Starburst rays (diagonals) */}
      <polygon points="200,60 216,110 260,110 218,135 235,180 200,150 165,180 182,135 140,110 184,110" fill="#0f766e" />
      <polygon points="200,50 208,125 285,125 220,150 250,225 200,175 150,225 180,150 115,125 192,125" fill="#115e59" stroke="#f59e0b" strokeWidth="1.5" />

      {/* Main Stylized Bachelor Point Hostel building (arched, dual color, layered) */}
      {/* Left green wing */}
      <polygon points="150,140 180,120 180,245 150,245" fill="#0d9488" />
      <polygon points="150,140 160,140 180,123 180,120" fill="#f59e0b" />
      {/* Right blue-green wing */}
      <polygon points="220,110 280,140 280,245 220,245" fill="#114b5f" />
      <polygon points="220,110 220,115 265,138 280,140" fill="#f59e0b" strokeWidth="1" />
      {/* Center White/Clean main structure */}
      <polygon points="175,120 225,95 225,245 175,245" fill="#ffffff" stroke="#114b5f" strokeWidth="2" />
      
      {/* Arched main entrance doors & windows */}
      {/* Entrance doorway */}
      <path d="M190,245 V215 A10,10 0 0,1 210,215 V245 Z" fill="#f59e0b" />
      {/* Left side arch window */}
      <path d="M158,245 V225 A6,6 0 0,1 172,225 V245 Z" fill="#d97706" />

      {/* Right wing side window panes */}
      <rect x="234" y="160" width="14" height="20" rx="2" fill="#f59e0b" />
      <rect x="256" y="160" width="14" height="20" rx="2" fill="#f59e0b" />
      <rect x="234" y="190" width="14" height="20" rx="2" fill="#f59e0b" />
      <rect x="256" y="190" width="14" height="20" rx="2" fill="#f59e0b" />

      {/* Center tall column windows */}
      <rect x="185" y="145" width="10" height="30" rx="1" fill="#114b5f" />
      <rect x="205" y="145" width="10" height="30" rx="1" fill="#114b5f" />

      {/* Stylized Location Map Pin Pin Center on Structure */}
      <g filter="url(#shadow-filter)">
        {/* Map Pin body */}
        <path
          d="M200,105 C185,105 175,115 175,130 C175,150 200,175 200,175 C200,175 225,150 225,130 C225,115 215,105 200,105 Z"
          fill="#ea580c"
          stroke="#ffffff"
          strokeWidth="1.5"
        />
        {/* Pin inner circle hole */}
        <circle cx="200" cy="126" r="6" fill="#ffffff" />
      </g>

      <defs>
        <filter id="shadow-filter" x="160" y="95" width="80" height="100" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.3" />
        </filter>
      </defs>
    </svg>
  );

  if (variant === "icon") {
    return <div className={`inline-flex ${className}`}>{renderSVGIcon(selectedSize.iconSize)}</div>;
  }

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {/* Emblem Graphic Icon */}
      {renderSVGIcon(selectedSize.iconSize)}

      {/* Emblem Typography Labels (Bangla and English) */}
      <div className="mt-3 space-y-1">
        <h2 className={`${selectedSize.titleText} font-black tracking-tight ${textTitleColor} font-sans`}>
          ব্যাচেলর পয়েন্ট হোস্টেল
        </h2>
        <h3 className={`${selectedSize.subText} font-extrabold tracking-widest uppercase ${textSubColor} font-sans`}>
          Bachelor Point Hostel
        </h3>
        {size !== "sm" && (
          <div className="pt-1.5 flex flex-col gap-0.5 border-t border-slate-200/20 mt-1 max-w-[280px]">
            <span className={`${taglineColor} text-[10px] font-bold tracking-normal font-sans`}>
              A PLACE TO CALL HOME | ঢাকা
            </span>
            <span className={`${taglineColor} text-[9px] font-sans opacity-90`}>
              ঘর থেকে দূরে ঘর | DHAKA
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
