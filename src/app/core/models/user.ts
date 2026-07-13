export enum UserRole {
  ADMIN = 'admin',
  DISPATCHER = 'dispatcher',
  DRIVER = 'driver',
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  hospitalId: string | null;
}
