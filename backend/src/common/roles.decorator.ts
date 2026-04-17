import { SetMetadata } from '@nestjs/common';

export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  MEMBER = 'MEMBER',
}

export enum Country {
  INDIA = 'INDIA',
  AMERICA = 'AMERICA',
}

export const ROLES_KEY = 'roles';

// Decorator: @Roles(Role.ADMIN, Role.MANAGER)
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
