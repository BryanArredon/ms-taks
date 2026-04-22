import { Module } from "@nestjs/common";
import { UserController } from "./user.controller.js";
import { UserService } from "./user.service.js";
import { PrismaService } from "../../../common/services/prisma.service.js";
import { AuthModule } from "../../auth/interfaces/auth.module.js";

@Module({
    imports: [AuthModule],
    controllers: [UserController],
    providers: [UserService, PrismaService],
    exports: [UserService]
})
export class UserModule {}
