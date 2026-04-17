import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { ROLES_KEY, Role } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator — route is public
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const ctx = GqlExecutionContext.create(context);
    const { req, connectionParams } = ctx.getContext();

    // Support both HTTP (Authorization header) and WS (connectionParams)
    const authHeader =
      req?.headers?.authorization ??
      connectionParams?.Authorization ??
      connectionParams?.authorization;

    if (!authHeader) {
      throw new ForbiddenException('No authorization token provided');
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      // Attach user to request for downstream guards and resolvers
      if (req) req.user = payload;

      if (!requiredRoles.includes(payload.role)) {
        throw new ForbiddenException(
          `Access denied. Required: ${requiredRoles.join(' or ')}. Your role: ${payload.role}`,
        );
      }

      return true;
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      throw new ForbiddenException('Invalid or expired token');
    }
  }
}
