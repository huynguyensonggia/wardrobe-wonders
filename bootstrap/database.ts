import { DynamicModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { databaseConfig } from "../ormconfig";

export default (): DynamicModule => TypeOrmModule.forRoot(databaseConfig);
