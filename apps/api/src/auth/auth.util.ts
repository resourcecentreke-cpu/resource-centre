import type { AuthUser } from '@rc/types';

interface UserLike {
  id: string;
  email: string;
  phone: string | null;
  locale: string;
  isVerified: boolean;
  passwordHash?: string;
  hashedRefreshToken?: string | null;
}

/** Strip all secrets — only ever return this shape to clients. */
export function toAuthUser(u: UserLike): AuthUser {
  return {
    id: u.id,
    email: u.email,
    phone: u.phone ?? null,
    locale: u.locale,
    isVerified: u.isVerified,
  };
}
