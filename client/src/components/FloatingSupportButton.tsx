import { useState } from "react";
import { Facebook, Headphones } from "lucide-react";

export function FloatingSupportButton() {
  const [open, setOpen] = useState(false);
  const fbLink =
    "https://web.facebook.com/share/18n4kf3A4A/?mibextid=wwXIfr&_rdc=1&_rdr";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3">
      {/* Sub buttons */}
      <div
        className={`flex flex-col items-center gap-3 transition-all duration-300 ${
          open
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <a
          href={fbLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1877F2] shadow-lg transition hover:scale-110"
        >
          <Facebook className="h-6 w-6 text-white" />
        </a>
      </div>

      {/* Main button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Liên hệ hỗ trợ"
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#1a3a8f] shadow-[0_8px_24px_rgba(26,58,143,0.4)] transition-all duration-300 hover:scale-110 active:scale-95"
      >
        <span className="absolute inset-0 rounded-full bg-[#1a3a8f] opacity-25 animate-ping" />
        <Headphones className="h-7 w-7 text-white relative z-10" />
      </button>
    </div>
  );
}
