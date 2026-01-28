import { UserRoles } from '../../../common/enums/users.enum';

export interface AuthUser {
  username: string;
  email: string;
  roles: UserRoles[];
}