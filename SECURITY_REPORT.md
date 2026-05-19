# Security Audit Report

**Ngày:** 2026-05-19
**Stack:** NestJS (backend) + React/Vite (frontend) + MySQL/TypeORM + JWT Auth + Cloudinary + Nodemailer (Brevo)
**Tổng số lỗi:** Critical: 3 | High: 5 | Medium: 5 | Low: 4

---

## 🔴 CRITICAL

### 1. Secrets thật bị hardcode trong file `.env` commit vào repo
- **File:** `.env:15-55`, `client/.env:3`, `client/.env.local:2`
- **Vấn đề:** File `.env` chứa nhiều secret thật: `JWT_SECRET` (quá yếu), `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `MAIL_PASS` (Gmail App Password), `HF_TOKEN`, `GEMINI_API_KEY`. File `client/.env` và `client/.env.local` cũng chứa `VITE_GEMINI_API_KEY` với giá trị thật. Mặc dù các file này có trong `.gitignore`, nếu đã từng được push hoặc shared thì secret đã lộ.
- **Impact:** Attacker có thể dùng Cloudinary API để upload/xoá media, đọc toàn bộ email qua Gmail SMTP, spam HuggingFace/Gemini bằng quota của app. JWT Secret quá ngắn/yếu — có thể brute-force để forge token với bất kỳ `role: ADMIN`.
- **Fix:**
  1. Rotate toàn bộ các secret trên ngay lập tức (Cloudinary, Gmail, HF, Gemini).
  2. Đổi `JWT_SECRET` thành chuỗi random >= 32 ký tự: `openssl rand -base64 32`.
  3. `VITE_GEMINI_API_KEY` trong client là **public** — bất kỳ ai inspect bundle đều thấy. Chuyển toàn bộ lời gọi Gemini về backend.
  4. Dùng secret manager (Railway, Render Environment Variables) thay vì `.env` file local.

---

### 2. JWT Secret fallback về hardcoded value
- **File:** `src/modules/auth/auth.module.ts:14`, `src/modules/auth/strategies/jwt.strategy.ts:10`
- **Vấn đề:** `process.env.JWT_SECRET || "secret123"` — nếu biến môi trường bị thiếu (deploy sai, restart), hệ thống tự động dùng `secret123`. Attacker biết fallback này có thể forge JWT với `sub` và `role: ADMIN`.
- **Impact:** Full authentication bypass — forge token ADMIN mà không cần credentials.
- **Fix:**
  ```typescript
  // Thay vì fallback sang default:
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET env var is required');
  secret: process.env.JWT_SECRET,
  ```

---

### 3. `VITE_GEMINI_API_KEY` exposed client-side — API Key lộ trong JavaScript bundle
- **File:** `client/.env:3`, `client/.env.local:2`
- **Vấn đề:** Bất kỳ biến `VITE_*` nào đều được Vite nhúng thẳng vào JavaScript bundle, bất kỳ ai mở DevTools có thể thấy. `VITE_GEMINI_API_KEY=AIzaSyBsTDpkqEi1H3c-Axyr9bocVNnJDXyEinc` là Google Gemini API key thật — không phải key fake hay placeholder.
- **Impact:** Attacker dùng key này để gọi Gemini API tùy ý, tốn quota, tốn tiền (nếu billing enabled), vượt rate limit của app.
- **Fix:** Xoá `VITE_GEMINI_API_KEY` hoàn toàn. Mọi lời gọi Gemini phải qua backend endpoint (`/api/recommendations`). Backend đã có `GEMINI_API_KEY` trong env rồi — dùng đó.

---

## 🟠 HIGH

### 4. Không có Rate Limiting trên bất kỳ endpoint nào
- **File:** `src/main.ts` (toàn bộ file), không có `ThrottlerModule` trong `src/app.module.ts`
- **Vấn đề:** Không một endpoint nào có rate limit: `/api/auth/login`, `/api/auth/register`, `/api/auth/google`. Attacker có thể brute-force password mà không bị chặn. Ngoài ra `/api/tryon/fitdit` (gọi FASHN AI, tốn tiền) và `/api/recommendations` (gọi Gemini, tốn quota) cũng không có rate limit — bất kỳ ai cũng có thể spam.
- **Impact:** Brute-force login, account enumeration, credential stuffing, chi phí API tăng vô kiểm soát.
- **Fix:**
  ```typescript
  // app.module.ts
  import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
  ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
  // Áp dụng global guard + tùy chỉnh theo route (login: 5/min, register: 3/min)
  ```

---

### 5. Không có security headers (Helmet)
- **File:** `src/main.ts` (toàn bộ file)
- **Vấn đề:** Không sử dụng `helmet()`. Thiếu các header: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `X-XSS-Protection`, `Content-Security-Policy`.
- **Impact:** Clickjacking, MIME-type sniffing, các lớp tấn công browser-based dễ thực hiện hơn.
- **Fix:**
  ```typescript
  import helmet from 'helmet';
  app.use(helmet());
  ```

---

### 6. CORS mở hoàn toàn trong development — không check `NODE_ENV` đáng tin cậy
- **File:** `src/main.ts:23-25`
- **Vấn đề:** `if (process.env.NODE_ENV !== 'production') return callback(null, true)` — cho phép mọi origin trong dev. Nếu server production bị deploy với `NODE_ENV` thiếu hoặc sai (một lỗi ops thường gặp), CORS mở toàn bộ. Ngoài ra, kết hợp `credentials: true` với origin mở là cực kỳ nguy hiểm.
- **Impact:** Nếu `NODE_ENV` không được set đúng trên production, bất kỳ website nào cũng có thể gửi request kèm credentials đến API.
- **Fix:** Fail-safe thay vì fail-open: mặc định chặn tất cả, chỉ whitelist rõ ràng. Bỏ logic `NODE_ENV !== 'production'` hoặc đảo điều kiện thành phải explicit opt-in.

---

### 7. `GET /api/users/:id` — Bất kỳ user nào cũng đọc được profile của user khác (IDOR nhẹ)
- **File:** `src/modules/users/users.controller.ts:33-36`
- **Vấn đề:** Endpoint `GET /users/:id` không kiểm tra ownership. User A có thể đọc profile User B chỉ bằng cách biết `id` của B. Endpoint không có `@Roles(Role.ADMIN)` nhưng controller được bọc `JwtAuthGuard`, vậy bất kỳ authenticated user nào cũng đọc được.
- **Impact:** Lộ `name`, `email`, `phone`, `rentals` (danh sách lịch sử thuê) của user khác.
- **Fix:**
  ```typescript
  @Get(":id")
  findOne(@Param("id") id: string, @Request() req: any) {
    const isAdmin = req.user?.role === Role.ADMIN;
    if (!isAdmin && Number(id) !== Number(req.user.id)) {
      throw new ForbiddenException("Access denied");
    }
    return this.usersService.findOne(Number(id));
  }
  ```

---

### 8. xlsx library (HIGH severity — Prototype Pollution + ReDoS)
- **File:** `package.json:66`
- **Vấn đề:** `xlsx@0.18.5` có 2 lỗ hổng chưa có bản vá: Prototype Pollution (`GHSA-4r6h-8v6p-xvw6`) và ReDoS (`GHSA-5pgg-2g8v-p4x9`). Library này được dùng trong `importFromExcel` — endpoint admin import dữ liệu.
- **Impact:** Attacker upload file Excel crafted có thể gây Prototype Pollution ảnh hưởng runtime behavior, hoặc gây ReDoS làm API hang.
- **Fix:** Chuyển sang `exceljs` (maintained, không có known critical vulns). Không có `npm audit fix` cho xlsx vì không có bản vá.

---

## 🟡 MEDIUM

### 9. Role lấy từ JWT payload — không re-verify từ DB
- **File:** `src/modules/auth/strategies/jwt.strategy.ts:14-22`
- **Vấn đề:** `validate(payload)` trả về `role: payload.role` trực tiếp từ JWT token mà không query DB. Nếu role của user bị downgrade (ADMIN → USER) sau khi token được cấp, token cũ vẫn còn hiệu lực với role ADMIN trong 7 ngày (`expiresIn: "7d"`).
- **Impact:** Nếu revoke quyền admin, user vẫn có thể dùng token cũ để truy cập admin endpoint trong tối đa 7 ngày. Không phải escalation, nhưng là persistence issue.
- **Fix:** Hoặc giảm `expiresIn` xuống `15m` + dùng refresh token, hoặc thêm bước verify role từ DB trong `JwtStrategy.validate()`. Có thể thêm blacklist token khi revoke.

---

### 10. JWT Token lưu trong `localStorage` — dễ bị XSS đánh cắp
- **File:** `client/src/contexts/AuthContext.tsx:52-53`, `client/src/lib/api.ts:24`
- **Vấn đề:** `localStorage.setItem('auth_token', access_token)` — token lưu trong localStorage. Bất kỳ XSS nào (kể cả từ third-party script) đều đọc được token và gửi đi.
- **Impact:** Nếu có XSS (kể cả từ dependency), attacker đọc token, impersonate user hoàn toàn.
- **Fix:** Dùng `HttpOnly` cookie thay vì localStorage. Backend cần set `res.cookie('token', ..., { httpOnly: true, secure: true, sameSite: 'strict' })`.

---

### 11. `CreateUserDto` có field `role?: Role` nhưng không dùng trong register flow
- **File:** `src/modules/users/dto/create-user.dto.ts:20-22`
- **Vấn đề:** `CreateUserDto` có `@IsOptional() @IsEnum(Role) role?: Role` — field này có trong DTO validation schema. Mặc dù `AuthService.register()` override bằng `role: Role.USER`, field vẫn tồn tại và có thể confuse future developer hoặc bị dùng nhầm nếu có endpoint khác gọi `usersService.create(dto)` mà quên override role. Đây là một design smell dẫn đến mass assignment risk.
- **Impact:** Hiện tại không khai thác được vì `auth.service.ts` hardcode role, nhưng nếu thêm endpoint mới gọi trực tiếp `create(dto)` mà không override, user có thể tự set role ADMIN.
- **Fix:** Xoá `role` khỏi `CreateUserDto`. Role không bao giờ được set bởi client.

---

### 12. `/api/tryon/fitdit` không yêu cầu authentication
- **File:** `src/modules/tryon/tryon.controller.ts:40-53`
- **Vấn đề:** `@Controller("tryon")` không có `@UseGuards(JwtAuthGuard)`. Bất kỳ ai (kể cả anonymous) có thể POST ảnh và trigger FASHN AI job — tốn tiền và bandwidth Cloudinary.
- **Impact:** Attacker spam AI try-on, tốn toàn bộ quota FASHN API và Cloudinary của app.
- **Fix:** Thêm `@UseGuards(JwtAuthGuard)` cho controller hoặc route.

---

### 13. `/api/recommendations` không yêu cầu authentication
- **File:** `src/modules/recommendations/recommendations.controller.ts:6-13`
- **Vấn đề:** Endpoint POST `/recommendations` không có guard. Bất kỳ ai gọi API này không cần đăng nhập, sẽ trigger Gemini API call.
- **Impact:** Attacker spam Gemini API, vượt free tier quota, gây chi phí phát sinh.
- **Fix:** Thêm `@UseGuards(JwtAuthGuard)` hoặc ít nhất là rate limiting nghiêm ngặt.

---

## 🟢 LOW

### 14. `dangerouslySetInnerHTML` trong chart component — dữ liệu nội bộ, không từ user
- **File:** `client/src/components/ui/chart.tsx:70-85`
- **Vấn đề:** `dangerouslySetInnerHTML={{ __html: ... }}` được dùng để inject CSS động. Nội dung được tạo từ `config` object do component nhận vào — không phải trực tiếp từ user input.
- **Impact:** Cần verify rằng `config` object không bao giờ chứa giá trị từ user input (e.g. product name, user comment). Theo code hiện tại, `config` chứa CSS color values từ theme — không có XSS risk rõ ràng. Cần verify thêm.
- **Fix (cần verify):** Nếu bất kỳ giá trị nào trong `config` có thể đến từ user input, cần sanitize. Cân nhắc dùng `CSS.escape()` hoặc CSS custom properties thay vì inject raw string.

---

### 15. `DB_PASSWORD` trống trong `.env`
- **File:** `.env:5`
- **Vấn đề:** `DB_PASSWORD=` (trống). MySQL chạy không có password trên localhost — phù hợp cho dev, nhưng cần đảm bảo production có password mạnh.
- **Impact:** Nếu production deploy với DB không password (hoặc env không được set), attacker có network access vào DB sẽ đăng nhập được.
- **Fix:** Đảm bảo production DB có password mạnh và env `DB_PASSWORD` được set đúng trong môi trường production.

---

### 16. Error messages từ FASHN API lộ chi tiết nội bộ
- **File:** `src/modules/tryon/fitdit.service.ts:79`
- **Vấn đề:** `throw new BadRequestException(\`FASHN API error: ${body}\`)` — body response từ external API được trả thẳng về client. Có thể lộ thông tin về cấu trúc request, API key format, hoặc internal error messages.
- **Impact:** Low — information disclosure về external API internals.
- **Fix:** Log chi tiết server-side, trả về message chung chung cho client: `"Không thể xử lý ảnh. Vui lòng thử lại."`.

---

### 17. `NODE_ENV` không được check/enforce rõ ràng khi khởi động
- **File:** `src/main.ts:24`
- **Vấn đề:** Logic phân biệt production/development phụ thuộc vào `process.env.NODE_ENV` nhưng không có validation khi bootstrap. Server không throw error nếu biến này bị thiếu.
- **Impact:** Server có thể chạy production behavior với dev config mà không có cảnh báo.
- **Fix:** Thêm validation tại bootstrap:
  ```typescript
  if (!['production', 'development', 'test'].includes(process.env.NODE_ENV ?? '')) {
    console.warn('WARNING: NODE_ENV is not set!');
  }
  ```

---

## Tổng kết

### Top 3 cần fix ngay:

1. **Rotate tất cả secrets ngay lập tức** — Cloudinary, Gmail App Password, HuggingFace token, Gemini API key đang bị lộ trong `.env`. Nếu repo đã từng được push public, coi như tất cả đã bị compromise.

2. **Đổi JWT_SECRET và loại bỏ fallback `"secret123"`** — JWT secret yếu (`ajwtsecret`) kết hợp với fallback hardcode (`secret123`) có thể bị brute-force để forge admin token. Đây là authentication bypass hoàn toàn.

3. **Thêm Rate Limiting cho auth endpoints và AI endpoints** — Không có rate limit trên `/auth/login` cho phép brute-force. Không có rate limit trên `/tryon/fitdit` và `/recommendations` cho phép spam tốn tiền.

### Pattern lặp lại:

- **Không có authentication guard** trên các endpoint tốn tài nguyên (`/tryon/fitdit`, `/recommendations`) — pattern này nếu tiếp tục với các feature AI mới sẽ là security debt lớn.
- **Secret management yếu** — secrets được hardcode trong file text thay vì environment injection đúng cách.
- **Thiếu defensive programming** — fallback về giá trị insecure thay vì fail loudly khi thiếu config.

### Đề xuất bước tiếp theo:

1. **Ngay hôm nay:** Rotate tất cả API keys/secrets bị lộ, đổi JWT secret.
2. **Tuần này:** Thêm `helmet()` và `ThrottlerModule` vào main.ts.
3. **Tuần này:** Thêm `@UseGuards(JwtAuthGuard)` cho `/tryon` và `/recommendations` controllers.
4. **Tháng này:** Chuyển token storage từ `localStorage` sang `HttpOnly` cookie để chống XSS đánh cắp token.
5. **Tháng này:** Thay thế `xlsx` library bằng `exceljs` (không có known vulns chưa được vá).
6. **Tháng này:** Xoá `role` khỏi `CreateUserDto` và `VITE_GEMINI_API_KEY` khỏi client env.
7. **Chạy `npm audit fix`** cho cả backend và frontend để giải quyết các vuln có bản vá.

---

## Phụ lục: npm audit summary

| Môi trường | Critical | High | Moderate | Low |
|---|---|---|---|---|
| Backend (`/`) | 1 (handlebars - build dep) | 14 | 21 | 3 |
| Frontend (`/client`) | 0 | 14 | 7 | 0 |

**Lưu ý:** Critical trong backend là `handlebars` — nằm trong `@nestjs/cli` (dev dependency, không chạy trên production). Vẫn nên `npm audit fix` để giữ sạch. `xlsx` HIGH severity không có bản vá.
