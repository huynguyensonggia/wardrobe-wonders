import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Chỉ hiện nếu chưa dismiss trước đó
      const dismissed = localStorage.getItem("pwa-prompt-dismissed");
      if (!dismissed) setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("pwa-prompt-dismissed", "1");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <div className="bg-background border rounded-xl shadow-lg p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Cài AI Closet về máy</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Truy cập nhanh hơn, dùng như app thật
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="h-7 text-xs" onClick={handleInstall}>
              Cài ngay
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleDismiss}>
              Để sau
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
