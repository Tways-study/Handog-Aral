export default function StarProgress({ stars = 0, max = 5, compact = false }) {
  const size = compact ? "text-base" : "text-xl";
  return (
    <div className={`flex items-center ${compact ? "gap-0.5" : "gap-1"}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`${size} transition-all duration-300 ${
            i < stars ? "scale-110" : "grayscale opacity-30"
          }`}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}
