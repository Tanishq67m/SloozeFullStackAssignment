import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Embed role AND country in the JWT payload
    // This is the key to making RBAC + ReBAC work without extra DB lookups
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      country: user.country, // null for ADMIN
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        country: user.country,
      },
    };
  }

  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
