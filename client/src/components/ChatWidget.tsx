import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, ShoppingBag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { chatApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { getLocalizedProductName } from "@/utils/i18n";
import { Link } from "react-router-dom";

interface Message {
  role: "user" | "assistant";
  content: string;
  products?: any[];
}

const WELCOME: Record<string, string> = {
  vi: "Xin chào! Tôi có thể giúp bạn tìm trang phục phù hợp hoặc giải đáp thắc mắc về dịch vụ thuê đồ. Bạn cần hỗ trợ gì?",
  en: "Hello! I can help you find the perfect outfit or answer questions about our rental service. How can I help?",
  ja: "こんにちは！お召し物選びのご相談や、レンタルサービスに関するご質問にお答えします。何かお手伝いできますか？",
};

const PLACEHOLDER: Record<string, string> = {
  vi: "Nhập tin nhắn...",
  en: "Type a message...",
  ja: "メッセージを入力...",
};

const LOGIN_MSG: Record<string, string> = {
  vi: "Vui lòng đăng nhập để sử dụng trợ lý AI.",
  en: "Please log in to use the AI assistant.",
  ja: "AIアシスタントを使用するにはログインしてください。",
};

export function ChatWidget() {
  const { i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const lang = i18n.language;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: WELCOME[lang] ?? WELCOME.vi },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Update welcome message when language changes
  useEffect(() => {
    setMessages([{ role: "assistant", content: WELCOME[lang] ?? WELCOME.vi }]);
  }, [lang]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const history = next.map((m) => ({ role: m.role, content: m.content }));
      const res = await chatApi.send(history, lang);
      setMessages([...next, { role: "assistant", content: res.message, products: res.products }]);
    } catch {
      const errMsg: Record<string, string> = {
        vi: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.",
        en: "Sorry, something went wrong. Please try again.",
        ja: "エラーが発生しました。もう一度お試しください。",
      };
      setMessages([...next, { role: "assistant", content: errMsg[lang] ?? errMsg.vi }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-3">
      {/* Chat window */}
      {open && (
        <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          style={{ height: "480px" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#1a3a8f] text-white">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold text-sm">
                {lang === "ja" ? "ファッション相談" : lang === "en" ? "Style Assistant" : "Trợ lý thời trang"}
              </span>
            </div>
            <button onClick={() => setOpen(false)} className="hover:opacity-70 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {!isAuthenticated ? (
              <div className="text-center text-sm text-muted-foreground mt-8 px-2">
                {LOGIN_MSG[lang] ?? LOGIN_MSG.vi}
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap
                    ${msg.role === "user"
                      ? "bg-[#1a3a8f] text-white rounded-br-sm"
                      : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm"
                    }`}>
                    {msg.content}

                    {/* Product suggestions */}
                    {msg.products && msg.products.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.products.map((p) => (
                          <Link
                            key={p.id}
                            to={`/products/${p.id}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2 bg-gray-50 rounded-xl p-2 hover:bg-gray-100 transition border border-gray-200"
                          >
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                <ShoppingBag className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-gray-800 truncate">
                                {getLocalizedProductName(p, lang, p.name)}
                              </p>
                              <p className="text-xs text-[#1a3a8f]">
                                {p.rentPricePerDay?.toLocaleString("vi-VN")}đ/ngày
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm border border-gray-100">
                  <Loader2 className="w-4 h-4 animate-spin text-[#1a3a8f]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {isAuthenticated && (
            <div className="px-3 py-2 border-t bg-white flex items-center gap-2">
              <input
                className="flex-1 text-sm outline-none px-3 py-2 rounded-xl bg-gray-100 placeholder:text-gray-400"
                placeholder={PLACEHOLDER[lang] ?? PLACEHOLDER.vi}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                disabled={loading}
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#1a3a8f] flex items-center justify-center text-white disabled:opacity-40 hover:bg-[#15307a] transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Chat với trợ lý AI"
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#1a3a8f] shadow-[0_8px_24px_rgba(26,58,143,0.4)] transition-all duration-300 hover:scale-110 active:scale-95"
      >
        <span className="absolute inset-0 rounded-full bg-[#1a3a8f] opacity-25 animate-ping" />
        {open
          ? <X className="h-6 w-6 text-white relative z-10" />
          : <MessageCircle className="h-7 w-7 text-white relative z-10" />
        }
      </button>
    </div>
  );
}
