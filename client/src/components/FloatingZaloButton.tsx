import { useState } from "react";
import { X } from "lucide-react";

export function FloatingZaloButton() {
    const [open, setOpen] = useState(false);
    const zaloLink = "https://zalo.me/0963931349";

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {open && (
                <div className="mb-4 w-[320px] overflow-hidden rounded-[28px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                    <div className="relative bg-[linear-gradient(180deg,#0A68FF_0%,#2892FF_100%)] px-5 pb-6 pt-8">
                        <button
                            onClick={() => setOpen(false)}
                            className="absolute right-4 top-4 rounded-full bg-white/20 p-1 text-white transition hover:bg-white/30"
                            aria-label="Đóng"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="mt-10 rounded-[28px] bg-white px-6 pb-6 pt-14 text-center relative">
                            <img
                                src="/zalo-avatar.png"
                                alt="Avatar Zalo"
                                className="absolute left-1/2 top-0 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white object-cover shadow-md"
                            />

                            <h3 className="text-[20px] font-semibold text-gray-900">
                                Trần Nguyễn Mai Hương
                            </h3>

                            <p className="mt-1 text-[15px] text-gray-400">Liên hệ Zalo</p>

                            <img
                                src="/zalo-qr.png"
                                alt="QR Zalo"
                                className="mx-auto mt-5 w-[210px] max-w-full rounded-xl"
                            />

                            <p className="mt-5 text-sm leading-6 text-gray-500">
                                Mở Zalo, bấm nút quét QR để quét kết bạn
                            </p>

                            <a
                                href={zaloLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-5 block rounded-2xl bg-[#0A68FF] px-4 py-3 text-center font-medium text-white transition hover:brightness-110"
                            >
                                Nhắn tin qua Zalo
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative">
                <span className="absolute inset-0 rounded-full bg-[#0A68FF]/30 animate-ping" />
                <span className="absolute -inset-2 rounded-full bg-[#0A68FF]/15 animate-pulse" />

                <button
                    onClick={() => setOpen((prev) => !prev)}
                    aria-label="Mở liên hệ Zalo"
                    className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#0A68FF] shadow-[0_10px_30px_rgba(10,104,255,0.35)] transition-all duration-300 hover:scale-110 active:scale-95"
                >
                    <img
                        src="/zalo-avatar.png"
                        alt="Zalo"
                        className="h-10 w-10 rounded-full object-cover border-2 border-white"
                    />
                </button>
            </div>
        </div>
    );
}