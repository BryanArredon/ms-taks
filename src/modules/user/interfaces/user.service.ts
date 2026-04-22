import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../common/services/prisma.service.js";
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    private getRoleId(roleName: string): number {
        const mapping: any = { 'admin': 1, 'user': 2 };
        return mapping[roleName] || 2;
    }

    public async createUser(data: any, adminId: number) {
        const existingUser = await this.prisma.user.findFirst({
            where: { username: data.username }
        });

        if (existingUser) {
            throw new ConflictException("El nombre de usuario ya está en uso");
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const newUser = await this.prisma.user.create({
            data: {
                username: data.username,
                name: data.name,
                lastname: data.lastname || '',
                password: hashedPassword,
                roleId: this.getRoleId(data.role)
            },
            include: { role: true }
        });

        // Audit log
        await this.prisma.logs.create({
            data: {
                statusCode: 201,
                timestamp: new Date(),
                path: '/user',
                type: 'CRITICAL',
                description: `CREACIÓN DE USUARIO: El administrador (ID: ${adminId}) creó al usuario "${data.username}" con rol "${data.role}"`,
                error: '',
                errorCode: '',
                session_id: adminId
            }
        });

        return newUser;
    }

    public async updateUser(id: number, data: any, adminId: number) {
        // Verificar si existe
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException("Usuario no encontrado");

        // Si cambia username, verificar unicidad
        if (data.username && data.username !== user.username) {
            const existing = await this.prisma.user.findFirst({
                where: { username: data.username }
            });
            if (existing) throw new ConflictException("El nombre de usuario ya está en uso");
        }

        const updateData: any = {
            username: data.username,
            name: data.name,
            lastname: data.lastname
        };

        if (data.role) {
            updateData.roleId = this.getRoleId(data.role);
        }

        // Si se provee una nueva contraseña
        if (data.password && data.password.trim() !== '') {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        const updated = await this.prisma.user.update({
            where: { id },
            data: updateData,
            include: { role: true }
        });

        // Audit log
        await this.prisma.logs.create({
            data: {
                statusCode: 200,
                timestamp: new Date(),
                path: `/user/${id}`,
                type: 'CRITICAL',
                description: `EDICIÓN DE USUARIO: El administrador (ID: ${adminId}) modificó los datos del usuario (ID: ${id})`,
                error: '',
                errorCode: '',
                session_id: adminId
            }
        });

        return updated;
    }

    public async getUsers() {
        const users = await this.prisma.user.findMany({
            include: {
                role: true,
                _count: {
                    select: { tasks: true }
                }
            }
        });

        return users.map(user => ({
            ...user,
            role: user.role.name // Flatten for frontend
        }));
    }

    public async updateRole(id: number, newRole: string, adminId: number) {
        const updated = await this.prisma.user.update({
            where: { id },
            data: { roleId: this.getRoleId(newRole) },
            include: { role: true }
        });

        // Audit log
        await this.prisma.logs.create({
            data: {
                statusCode: 200,
                timestamp: new Date(),
                path: `/user/${id}/role`,
                type: 'CRITICAL',
                description: `CAMBIO DE ROL: El administrador (ID: ${adminId}) cambió el rol del usuario (ID: ${id}) a "${newRole}"`,
                error: '',
                errorCode: '',
                session_id: adminId
            }
        });

        return { ...updated, role: updated.role.name };
    }

    public async deleteUser(id: number) {
        // Verificar si tiene tareas
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { tasks: true }
                }
            }
        });

        if (!user) {
            throw new Error("Usuario no encontrado");
        }

        if (user._count.tasks > 0) {
            throw new ConflictException("No se puede eliminar un usuario con tareas asociadas");
        }

        await this.prisma.user.delete({
            where: { id }
        });

        return { message: "Usuario eliminado con éxito" };
    }
}
