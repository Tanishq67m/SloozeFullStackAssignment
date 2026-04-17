import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Country, Role } from './roles.decorator';

/**
 * ReBAC (Relationship-Based Access Control) Guard
 *
 * Enforces country-level data isolation:
 * - ADMIN: bypassed — can access all countries
 * - MANAGER/MEMBER: can only access resources matching their country
 *
 * Usage: Apply AFTER RolesGuard. Call checkCountry() in resolvers
 * when you have access to the resource's country value.
 */
@Injectable()
export class CountryGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const user = req?.user;

    // If no user attached (public route), let it through
    if (!user) return true;

    // Admin has global access — no country restriction
    if (user.role === Role.ADMIN) return true;

    return true; // Granular check happens in resolvers via checkCountryAccess()
  }

  /**
   * Call this in your resolver when you have the resource's country.
   * Throws ForbiddenException if the user cannot access this country.
   */
  static assertCountryAccess(user: any, resourceCountry: Country | string) {
    if (!user) throw new ForbiddenException('Authentication required');
    if (user.role === Role.ADMIN) return; // Admin sees everything

    if (user.country !== resourceCountry) {
      throw new ForbiddenException(
        `Access denied. You are scoped to ${user.country} only. This resource belongs to ${resourceCountry}.`,
      );
    }
  }
}
