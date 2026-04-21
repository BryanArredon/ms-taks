import { Injectable, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../../common/services/prisma.service.js";
import { User } from "@prisma/client";
import { RegisterDto } from "../dto/register.dto.js";
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {

    constructor(private readonly prisma: PrismaService ) {}
    
    public async getUserByUsername(username: string): Promise<User | null> {
        return await this.prisma.user.findFirst({
            where: { username }
        });
    }

    public async getUserById(id: number): Promise<User | null> {
        return await this.prisma.user.findFirst({
            where: { id }
        });
    }

    public async register(data: RegisterDto): Promise<User> {
        const existingUser = await this.getUserByUsername(data.username);
        if (existingUser) {
            throw new ConflictException("El nombre de usuario ya está en uso");
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        return await this.prisma.user.create({
            data: {
                name: data.name,
                lastname: data.lastname,
                username: data.username,
                password: hashedPassword,
            }
        });
    }

    public async updateHash(user_id: number, hash:string | null){
        return await this.prisma.user.update({
            where: {id: user_id},
            data: {hash}
        });
    }

    public async updateUser(id: number, data: Partial<User>) {
        // Si intenta cambiar el nombre de usuario, verificar disponibilidad
        if (data.username) {
            const existingUser = await this.prisma.user.findFirst({
                where: { 
                    username: data.username,
                    NOT: { id: id }
                }
            });

            if (existingUser) {
                throw new ConflictException("Este nombre de usuario ya está siendo utilizado.");
            }
        }

        return await this.prisma.user.update({
            where: { id },
            data: {
                name: data.name,
                lastname: data.lastname,
                username: data.username
            }
        });
    }

    public logIn(): string {
        return "Sesion exitosa"; 
    }
}