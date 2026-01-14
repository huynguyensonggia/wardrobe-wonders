import { DynamicModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

export default (): Promise<DynamicModule> =>
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: [".env", ".env.local"],
  });
