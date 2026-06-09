import { SetMetadata } from '@nestjs/common';
import { PlatformRole } from '../constants/roles.constant';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: PlatformRole[]) => SetMetadata(ROLES_KEY, roles);
