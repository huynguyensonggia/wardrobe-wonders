import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe (rất tốt)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true, // chặn field thừa trong DTO
    }),
  );

  // Global prefix cho toàn bộ API (bao gồm cả admin vì bạn đã thêm 'admin/' trong controller)
  app.setGlobalPrefix("api");

  // CORS cho frontend React/Vite
  app.enableCors({
    origin: [
      "http://localhost:8080",
      "http://192.168.1.212:8080",
      "https://wardrobe-wonders.pages.dev",
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  });


  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, "0.0.0.0");

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
