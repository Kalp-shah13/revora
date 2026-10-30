import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return null;
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      return null;
    }

    return user;
  }

  async login(loginDto: LoginDto, res: Response) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    // Set HTTP-only cookie
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    const userProfile = {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      role: user.role.toLowerCase(),
      created_at: user.createdAt,
    };

    return {
      data: {
        user: userProfile,
        profile: userProfile,
        access_token: token,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: registerDto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const fullName = registerDto.fullName || registerDto.full_name || null;
    const role = Role.BUSINESS_OWNER;

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email.toLowerCase(),
        passwordHash: hashedPassword,
        fullName,
        role,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.fullName,
          role: user.role.toLowerCase(),
          created_at: user.createdAt,
        },
      },
    };
  }

  async logout(res: Response) {
    res.clearCookie('access_token', { path: '/' });
    return { data: { success: true } };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const userProfile = {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      role: user.role.toLowerCase(),
      created_at: user.createdAt,
    };

    return {
      data: {
        user: userProfile,
        profile: userProfile,
      },
    };
  }
}
