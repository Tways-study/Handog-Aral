"use client";

export default function Mascot({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-block animate-floatOwl select-none ${className}`}
      style={{ fontSize: size }}
      role="img"
      aria-label="Owl mascot"
    >
      🦉
    </span>
  );
}
