import Image from "next/image";
import React from "react";

type LogoPosition = "left" | "right" | "top" | "bottom";

interface LogoProps {
  src?: string;
  width?: number;
  height?: number;
  text?: string;
  textPosition?: LogoPosition;
  gap?: number;
  className?: string;
  textClassName?: string;
}

export default function Logo({
  src = "/logo.png",
  width = 40,
  height = 40,
  text = "CourseSphere",
  textPosition = "right",
  gap = 10,
  className = "",
  textClassName = "text-3xl text-foreground",
}: LogoProps) {
  // Flex direction based on text position
  const direction =
    textPosition === "top"
      ? "flex-col-reverse"
      : textPosition === "bottom"
      ? "flex-col"
      : textPosition === "left"
      ? "flex-row-reverse"
      : "flex-row"; // right (default)

  return (
    <div
      className={`flex items-center ${direction} ${className}`}
      style={{ gap }}
    >
      <Image src={src} alt="Logo" width={width} height={height} />
      {text && (
        <p className={`font-bold tracking-tight ${textClassName}`}>{text}</p>
      )}
    </div>
  );
}
