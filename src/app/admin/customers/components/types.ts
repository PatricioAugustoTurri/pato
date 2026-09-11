export type UserRole = "customer" | "admin";

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};
