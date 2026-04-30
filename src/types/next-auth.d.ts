import { UserRole } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      emailVerified: Date | null;
      isActive: boolean;
    };
  }

  interface User {
    role?: UserRole;
    emailVerified?: Date | null;
    isActive?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    emailVerified?: string | null;
    isActive?: boolean;
    dbCheckedAt?: number;
    issuedAt?: number;
  }
}
