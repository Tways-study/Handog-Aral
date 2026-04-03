export default function Mascot({ size = 48, className = "" }) {
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
