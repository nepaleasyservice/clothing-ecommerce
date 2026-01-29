import { SetMetadata } from '@nestjs/common';

export const PROTECT_KEY = 'protect';
export const ROLES_KEY = 'roles';
export const PERMS_KEY = 'permissions';

export const JwtProtect = () => SetMetadata(PROTECT_KEY, true);
export const RolesProtect = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
export const PermissionProtect = (...perms: string[]) => SetMetadata(PERMS_KEY, perms);