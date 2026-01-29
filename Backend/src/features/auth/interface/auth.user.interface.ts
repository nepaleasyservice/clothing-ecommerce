import { RolesEnum } from '../../../common/enums/role.enum';

export interface AuthUser {
  username: string;
  email: string;
  roles: RolesEnum[];
}