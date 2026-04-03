export default function StarProgress({ stars = 0, max = 5 }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`text-xl transition-all duration-300 ${
            i < stars ? "scale-110" : "grayscale opacity-30"
          }`}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}
