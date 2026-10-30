import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: (Role | 'super_admin' | 'business_owner')[]) =>
  SetMetadata(ROLES_KEY, roles);
