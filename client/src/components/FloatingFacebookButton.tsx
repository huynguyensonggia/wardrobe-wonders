import { Facebook } from "lucide-react";

export function FloatingFacebookButton() {
  const fbLink = "https://www.facebook.com/huonhuonv";

  return (
    <a
      href={fbLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 right-6 z-50"
      aria-label="Facebook"
    >
      <div className="relative flex items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-[#1877F2]/30 animate-ping" />
        <span className="absolute -inset-2 rounded-full bg-[#1877F2]/15 animate-pulse" />

        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#1877F2] shadow-[0_10px_30px_rgba(24,119,242,0.35)] transition hover:scale-110">
          <Facebook className="h-8 w-8 text-white" />
        </div>
      </div>
    </a>
  );
}