import { Controller, Get, Delete, Param, UseGuards, HttpCode, HttpStatus, Patch, Req, Body, Post } from "@nestjs/common";
import { UserService } from "./user.service.js";
import { AdminGuard } from "../../../common/guards/admin.guard.js";
import { ApiOperation, ApiBearerAuth, ApiTags } from "@nestjs/swagger";

@ApiTags('Users')
@Controller("user")
export class UserController {
    constructor(private readonly userSvc: UserService) {}

    @Get()
    @UseGuards(AdminGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: "Lista todos los usuarios (Solo Admin)" })
    public async getUsers() {
        return await this.userSvc.getUsers();
    }

    @Patch(":id")
    @UseGuards(AdminGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: "Actualiza datos de un usuario (Solo Admin)" })
    public async updateUser(
        @Req() req: any,
        @Param("id") id: string,
        @Body() data: any
    ) {
        const adminId = req.user.id;
        return await this.userSvc.updateUser(Number(id), data, adminId);
    }

    @Post()
    @UseGuards(AdminGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: "Crea un nuevo usuario (Solo Admin)" })
    public async createUser(
        @Req() req: any,
        @Body() data: any
    ) {
        const adminId = req.user.id;
        return await this.userSvc.createUser(data, adminId);
    }

    @Patch(":id/role")
    @UseGuards(AdminGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: "Cambia el rol de un usuario (Solo Admin)" })
    public async updateRole(
        @Req() req: any, 
        @Param("id") id: string, 
        @Body("role") role: string
    ) {
        const adminId = req.user.id;
        return await this.userSvc.updateRole(Number(id), role, adminId);
    }

    @Delete(":id")
    @UseGuards(AdminGuard)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: "Elimina un usuario si no tiene tareas (Solo Admin)" })
    public async deleteUser(@Req() req: any, @Param("id") id: string) {
        const adminId = req.user.id;
        return await this.userSvc.deleteUser(Number(id), adminId);
    }
}
