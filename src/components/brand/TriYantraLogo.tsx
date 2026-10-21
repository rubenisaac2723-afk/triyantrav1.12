import React from "react";
import Image from "next/image";

interface TriYantraLogoProps {
  className?: string;
  id?: string;
  style?: React.CSSProperties;
  priority?: boolean;
}

export const TriYantraLogo: React.FC<TriYantraLogoProps> = ({
  className = "",
  id,
  style,
  priority = false,
}) => {
  return (
    <div
      id={id}
      style={style}
      className={`triyantra-logo-container ${className}`.trim()}
    >
      <Image
        src="/triyantra-logo.png"
        alt="TriYantra - EMPOWER. OPTIMIZE. ELEVATE."
        width={540}
        height={180}
        priority={priority}
        className="triyantra-logo-image"
      />
    </div>
  );
};
