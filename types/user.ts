// Shared User types used across the app
export type UserRole =
  | "super_admin"
  | "admin"
  | "org_employee"
  | "instructor"
  | "student"
  | string
  | null;

export interface User {
  id: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  // convenience full name
  name?: string | null;
  role?: UserRole;
  profile_picture_url?: string | null;
  organization_id?: string | null;
  gender?: string | null;
  is_verified?: boolean;
  deleted_at?: string | null;
  created_at?: string | null;
  [key: string]: any;
}

export default User;
