export interface GoogleClaims {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
  iss: string;
  aud: string;
  exp: string;
  iat: string;
}