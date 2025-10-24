import { SetMetadata } from '@nestjs/common';
import { User } from '../../database/entities/user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
