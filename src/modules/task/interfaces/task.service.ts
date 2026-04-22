import { Injectable } from "@nestjs/common";
import { PrismaService } from '../../../common/services/prisma.service.js';
import { LogsService } from "../../logs/logs.service.js";
import { CreateTaskDto } from "../dto/create-task.dto.js";

// Custom mapper so frontend doesn't break
function mapPrismaTaskToDto(prismaTask: any) {
  return {
    id: prismaTask.id,
    name: prismaTask.title,
    description: prismaTask.content || "",
    priority: prismaTask.published || false,
    userId: prismaTask.authorId,
    user: prismaTask.author ? {
        id: prismaTask.author.id,
        name: prismaTask.author.name
    } : undefined
  };
}

@Injectable()
export class TaskService {
    constructor(
        private prisma: PrismaService,
        private logsSvc: LogsService
    ) {}

    public async getTasks(userId: number) {
        const tasks = await this.prisma.task.findMany({
            where: { authorId: userId },
            include: { author: true },
            orderBy: { id: "desc" }
        });
        return tasks.map(mapPrismaTaskToDto);
    }

    public async getTaskById(id: number, userId: number) {
        const task = await this.prisma.task.findFirst({
            where: { 
                id,
                authorId: userId
            },
            include: { author: true }
        });
        if (!task) {
            throw new Error('Task not found or access denied');
        }
        return mapPrismaTaskToDto(task);
    }

    public async createTask(task: CreateTaskDto, userId: number) {
        const newTask = await this.prisma.task.create({
            data: {
                title: task.name,
                content: task.description,
                published: task.priority || false,
                authorId: userId
            },
            include: { author: true }
        });

        await this.logsSvc.createLog({
            statusCode: 201,
            path: '/api/task',
            type: 'ACTIVITY',
            description: `Nueva tarea creada: "${newTask.title}" por el usuario ID: ${userId}`,
            session_id: userId
        });

        return mapPrismaTaskToDto(newTask);
    }

    public async updateTask(id: number, userId: number, task: Partial<CreateTaskDto>) {
        // Primero verificamos propiedad
        const existing = await this.prisma.task.findFirst({
            where: { id, authorId: userId }
        });

        if (!existing) {
            throw new Error('Task not found or access denied');
        }

        const updateData: any = {};
        if (task.name !== undefined) updateData.title = task.name;
        if (task.description !== undefined) updateData.content = task.description;
        if (task.priority !== undefined) updateData.published = task.priority;

        const updated = await this.prisma.task.update({
            where: { id },
            data: updateData,
            include: { author: true }
        });
        return mapPrismaTaskToDto(updated);
    }
        
    public async deleteTask(id: number, userId: number): Promise<boolean> {
        // Primero verificamos propiedad
        const existing = await this.prisma.task.findFirst({
            where: { id, authorId: userId }
        });

        if (!existing) {
            throw new Error('Task not found or access denied');
        }

        await this.prisma.task.delete({
            where: { id }
        });

        await this.logsSvc.createLog({
            statusCode: 200,
            path: `/api/task/${id}`,
            type: 'ACTIVITY',
            description: `Tarea eliminada (ID: ${id}) por el usuario ID: ${userId}`,
            session_id: userId
        });

        return true;  
    }
}