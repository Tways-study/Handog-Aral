import { useEffect } from "react";
import Mascot from "../components/Mascot";

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(160deg, #1A3C40 0%, #2EC4B6 50%, #FFD166 100%)",
      }}
    >
      <div className="animate-bounce mb-6">
        <Mascot size={80} />
      </div>

      <h1 className="font-heading text-5xl font-extrabold text-white mb-2 drop-shadow-lg">
        Handog Aral
      </h1>

      <p className="text-white/90 text-lg font-semibold mb-12">
        Ang Imo Gabay sa Pagbasa 📖
      </p>

      {/* Loading dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-white/80 animate-blink"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </div>
    </div>
  );
}
