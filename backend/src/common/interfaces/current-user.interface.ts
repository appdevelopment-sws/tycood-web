export interface ICurrentUser {
  userId: string;
  email: string;
  roles: string[];
  permissions?: string[];
}

export class CurrentUserDto implements ICurrentUser {
  userId: string;
  email: string;
  roles: string[];
  permissions?: string[];
}
