import { Injectable, Logger } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailer: MailerService) {}

  async sendWelcome(to: string, name: string) {
    try {
      await this.mailer.sendMail({
        to,
        subject: "Chao mung ban den voi AI Closet!",
        html: this.welcomeTemplate(name),
      });
    } catch (err: any) {
      this.logger.error(`sendWelcome failed for ${to}: ${err?.message}`);
    }
  }

  async sendRentalConfirmation(params: {
    to: string;
    customerName: string;
    rentalId: number;
    startDate: string;
    endDate: string;
    totalDays: number;
    items: { name: string; size: string; quantity: number; subtotal: number }[];
    totalPrice: number;
    totalDeposit: number;
    shipAddress: string;
    paymentMethod: string;
  }) {
    try {
      await this.mailer.sendMail({
        to: params.to,
        subject: `Xac nhan don thue #${params.rentalId} - AI Closet`,
        html: this.rentalConfirmTemplate(params),
      });
    } catch (err: any) {
      this.logger.error(`sendRentalConfirmation failed for ${params.to}: ${err?.message}`);
    }
  }

  async sendReturnReminder(params: {
    to: string;
    customerName: string;
    rentalId: number;
    returnDate: string;
    items: { name: string; size: string; quantity: number }[];
  }) {
    try {
      await this.mailer.sendMail({
        to: params.to,
        subject: `Nhac nho: Don thue #${params.rentalId} het han HOM NAY - tra truoc 23:59`,
        html: this.returnReminderTemplate(params),
      });
    } catch (err: any) {
      this.logger.error(`sendReturnReminder failed for ${params.to}: ${err?.message}`);
    }
  }

  private welcomeTemplate(name: string): string {
    const year = new Date().getFullYear();
    const url = process.env.FRONTEND_URL || "http://localhost:5173";
    return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#1a1a1a;padding:32px 40px;text-align:center;">
  <h1 style="margin:0;color:#c9a96e;font-size:28px;letter-spacing:2px;font-weight:300;">AI CLOSET</h1>
</td></tr>
<tr><td style="padding:40px;">
  <h2 style="color:#1a1a1a;">Chao mung, ${name}!</h2>
  <p style="color:#555;line-height:1.7;">Tai khoan cua ban da duoc tao thanh cong tai <strong>AI Closet</strong>.</p>
  <p style="color:#555;line-height:1.7;">Kham pha bo suu tap, thu do ao bang AI, hoac de AI tu van phong cach phu hop voi ban.</p>
  <div style="text-align:center;margin-top:24px;">
    <a href="${url}/products" style="background:#c9a96e;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;">
      Kham pha bo suu tap
    </a>
  </div>
</td></tr>
<tr><td style="background:#f9f7f4;padding:20px 40px;text-align:center;">
  <p style="margin:0;color:#999;font-size:12px;">© ${year} AI Closet</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
  }

  private rentalConfirmTemplate(p: {
    customerName: string;
    rentalId: number;
    startDate: string;
    endDate: string;
    totalDays: number;
    items: { name: string; size: string; quantity: number; subtotal: number }[];
    totalPrice: number;
    totalDeposit: number;
    shipAddress: string;
    paymentMethod: string;
  }): string {
    const year = new Date().getFullYear();
    const fmt = (n: number) => n.toLocaleString("vi-VN") + "d";
    const methodLabel: Record<string, string> = {
      CASH: "Tien mat khi nhan hang",
      COD: "COD",
      BANK_TRANSFER: "Chuyen khoan ngan hang",
    };
    const rows = p.items
      .map(
        (it) =>
          `<tr>
            <td style="padding:8px 0;border-bottom:1px solid #eee;">${it.name} (Size ${it.size})</td>
            <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">x${it.quantity}</td>
            <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${fmt(it.subtotal)}</td>
          </tr>`,
      )
      .join("");

    return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#1a1a1a;padding:32px 40px;text-align:center;">
  <h1 style="margin:0;color:#c9a96e;font-size:28px;letter-spacing:2px;font-weight:300;">AI CLOSET</h1>
</td></tr>
<tr><td style="background:#f0faf4;padding:16px 40px;">
  <p style="margin:0;color:#2d6a4f;font-weight:500;">Don thue #${p.rentalId} da duoc xac nhan!</p>
</td></tr>
<tr><td style="padding:32px 40px;">
  <p style="color:#555;">Xin chao <strong>${p.customerName}</strong>, cam on ban da tin tuong AI Closet!</p>
  <p style="color:#555;">Thoi gian thue: <strong>${p.startDate} - ${p.endDate}</strong> (${p.totalDays} ngay)</p>
  <p style="color:#e65100;font-weight:500;">Vui long tra do truoc 22:30 ngay ${p.endDate}.</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
    <tr style="border-bottom:2px solid #eee;">
      <th style="padding:8px 0;text-align:left;color:#999;font-size:12px;">San pham</th>
      <th style="padding:8px 0;text-align:center;color:#999;font-size:12px;">SL</th>
      <th style="padding:8px 0;text-align:right;color:#999;font-size:12px;">Thanh tien</th>
    </tr>
    ${rows}
  </table>
  <p style="color:#555;">Tien thue: <strong>${fmt(p.totalPrice)}</strong></p>
  <p style="color:#555;">Tien coc (hoan lai): <strong>${fmt(p.totalDeposit)}</strong></p>
  <p style="color:#1a1a1a;font-size:16px;font-weight:600;">Tong thanh toan: <span style="color:#c9a96e;">${fmt(p.totalPrice + p.totalDeposit)}</span></p>
  <p style="color:#555;">Dia chi: ${p.shipAddress}</p>
  <p style="color:#555;">Thanh toan: ${methodLabel[p.paymentMethod] || p.paymentMethod}</p>
</td></tr>
<tr><td style="background:#f9f7f4;padding:20px 40px;text-align:center;">
  <p style="margin:0;color:#999;font-size:12px;">© ${year} AI Closet</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
  }

  private returnReminderTemplate(p: {
    customerName: string;
    rentalId: number;
    returnDate: string;
    items: { name: string; size: string; quantity: number }[];
  }): string {
    const year = new Date().getFullYear();
    const rows = p.items
      .map(
        (it) =>
          `<tr>
            <td style="padding:8px 0;border-bottom:1px solid #eee;">${it.name} (Size ${it.size})</td>
            <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">x${it.quantity}</td>
          </tr>`,
      )
      .join("");

    return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#1a1a1a;padding:32px 40px;text-align:center;">
  <h1 style="margin:0;color:#c9a96e;font-size:28px;letter-spacing:2px;font-weight:300;">AI CLOSET</h1>
</td></tr>
<tr><td style="background:#fff8e1;padding:16px 40px;">
  <p style="margin:0;color:#f57f17;font-weight:500;">Don thue #${p.rentalId} het han HOM NAY: <strong>${p.returnDate} - 22:30</strong></p>
</td></tr>
<tr><td style="padding:32px 40px;">
  <p style="color:#555;">Xin chao <strong>${p.customerName}</strong>,</p>
  <p style="color:#555;">Hom nay la ngay cuoi cua don thue. Vui long tra do truoc <strong>22:30 toi nay (${p.returnDate})</strong> de tranh phat sinh phi tre han.</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
    <tr style="border-bottom:2px solid #eee;">
      <th style="padding:8px 0;text-align:left;color:#999;font-size:12px;">San pham can tra</th>
      <th style="padding:8px 0;text-align:center;color:#999;font-size:12px;">SL</th>
    </tr>
    ${rows}
  </table>
  <div style="background:#fff3e0;border-left:4px solid #c9a96e;padding:16px;margin:16px 0;">
    <p style="margin:0;color:#e65100;font-weight:600;">Han tra: ${p.returnDate} - 22:30</p>
    <p style="margin:6px 0 0;color:#bf360c;font-size:13px;">Tra tre se phat sinh phi theo quy dinh cua AI Closet.</p>
  </div>
  <p style="color:#888;font-size:13px;">Neu muon gia han them, hay dang nhap va chon Gia han don thue ngay bay gio.</p>
</td></tr>
<tr><td style="background:#f9f7f4;padding:20px 40px;text-align:center;">
  <p style="margin:0;color:#999;font-size:12px;">© ${year} AI Closet</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
  }
}
