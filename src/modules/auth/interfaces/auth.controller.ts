import { Body, Controller, Get, HttpCode, HttpStatus, Post, UnauthorizedException, UseGuards, Req, Param, Patch } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { ApiOperation, ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthDto } from "../dto/auth.dto.js";
import { RegisterDto } from "../dto/register.dto.js";
import { UpdateProfileDto } from "../dto/update-profile.dto.js";
import { JwtService } from "@nestjs/jwt";
import { UtilService } from "../../../common/services/util.service.js";
import { AppException } from "../../../common/exceptions/app.exception.js";
import { request } from "node:http";
import { AuthGuard } from "../../../common/guards/auth.guard.js";
import * as bcrypt from 'bcryptjs';

@ApiTags('Auth')
@Controller("auth")
export class AuthController {

  constructor(
    private readonly authSvc: AuthService,
    private readonly utilSvc: UtilService
  ) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Registra un nuevo usuario en la base de datos" })
  public async register(@Body() registerDto: RegisterDto): Promise<any> {
    const user = await this.authSvc.register(registerDto);
    return {
      message: "Usuario registrado con éxito",
      userId: user.id
    };
  }

  @Get("check/:username")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verifica si un nombre de usuario está disponible" })
  public async checkUsername(@Param("username") username: string) {
    const user = await this.authSvc.getUserByUsername(username);
    return { available: !user };
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verifica las credenciales y genera un JWT" })
  public async login(@Body() auth: AuthDto): Promise<any> {

    const user = await this.authSvc.getUserByUsername(auth.username);

    let isPasswordValid = false;
    if (user) {
      if (user.password === auth.password) {
          isPasswordValid = true;
      } else {
          try {
              isPasswordValid = await bcrypt.compare(auth.password, user.password);
          } catch (e) {
              isPasswordValid = false;
          }
      }
    }

    if (user && isPasswordValid) {

      const payload = {
        id: user.id,
        username: user.username,
        role: user.role,
      };


      //Generar refresh token por 7d 
      const refresh = await this.utilSvc.generateJWT(payload, '7d');
      const hashRT = await this.utilSvc.hash(refresh);

      await this.authSvc.updateHash(payload.id, hashRT)

      //Generar token de acceso por 1h
      const jwt = await this.utilSvc.generateJWT(payload,'1h');

      return {
        access_token: jwt,
        refresh_token: refresh,
      };

    } else {
      throw new UnauthorizedException('El usuario y/o contrasena es incorrecta');
    }
  }

  @Get("me")
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "Extrae el ID del usuario desde el token y busca la informacion completa" })
  public async getProfile(@Req() request: any) {
    const session = request['user'];
    const user = await this.authSvc.getUserById(session.id);
    
    if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
    }

    // No devolver password ni hash de sesion
    const { password, hash, ...safeUser } = user;
    return safeUser;
  }

  @Patch("me")
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "Actualiza la informacion del perfil del usuario logueado" })
  public async updateProfile(@Req() request: any, @Body() updateDto: UpdateProfileDto) {
    const session = request['user'];
    const updatedUser = await this.authSvc.updateUser(session.id, updateDto);
    
    const { password, hash, ...safeUser } = updatedUser;
    return safeUser;
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Genera un nuevo JWT usando un Refresh Token válido" })
  public async refreshToken(@Body('refresh_token') refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      // 1. Verificar el token
      const payload = await this.utilSvc.getPayload(refreshToken);
      
      // 2. Buscar al usuario
      const user = await this.authSvc.getUserById(payload.id);
      if (!user || !user.hash) {
        throw new UnauthorizedException('User not found or session invalidated');
      }

      // 3. Comparar el hash (refresh token)
      const isMatch = await bcrypt.compare(refreshToken, user.hash);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // 4. Generar nuevos tokens
      const newPayload = { 
        id: user.id, 
        username: user.username,
        role: user.role,
      };
      
      const newAccessToken = await this.utilSvc.generateJWT(newPayload, '1h');
      const newRefreshToken = await this.utilSvc.generateJWT(newPayload, '7d');
      const newHash = await this.utilSvc.hash(newRefreshToken);

      await this.authSvc.updateHash(user.id, newHash);

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "Invalida el token actual (simulado)" })
  public async logout(@Req() request: any) {
    const sesion = request['user'];
    const user = await this.authSvc.updateHash(sesion.id, null);
    return user;
  }
}