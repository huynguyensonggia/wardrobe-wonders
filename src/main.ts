import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";

async function bootstrap() {
  if (!['production', 'development', 'test'].includes(process.env.NODE_ENV ?? '')) {
    console.warn('WARNING: NODE_ENV is not set or invalid! Defaulting to insecure dev behavior.');
  }

  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix("api");

  // CORS — fail-safe: chặn mặc định, chỉ whitelist rõ ràng
  const DEV_ORIGINS = ["http://localhost:8080", "http://localhost:5173"];
  const PROD_ORIGINS = [
    "https://wardrobe-wonders.pages.dev",
    "https://wardrobe-wonders-client.pages.dev",
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (origin, callback) => {
      // Requests không có origin (curl, Postman, server-to-server) — cho phép
      if (!origin) return callback(null, true);

      const isProd = process.env.NODE_ENV === 'production';
      const allowedOrigins = isProd ? PROD_ORIGINS : [...DEV_ORIGINS, ...PROD_ORIGINS];

      const isAllowedSubdomain =
        origin.endsWith(".wardrobe-wonders.pages.dev") ||
        origin.endsWith(".wardrobe-wonders-client.pages.dev");

      if (allowedOrigins.includes(origin) || isAllowedSubdomain) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  });


  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, "0.0.0.0");

  // Health check endpoint — dùng để keep-alive ping (tránh Render cold start)
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get("/health", (_req: any, res: any) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  console.log(`Server is running on: http://0.0.0.0:${port}`);
  console.log(`API base: http://localhost:${port}/api`);
  console.log(
    `Admin endpoints example: http://localhost:${port}/api/admin/products`,
  );
}

bootstrap().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
