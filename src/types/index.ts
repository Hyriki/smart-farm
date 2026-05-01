export type UnverifiedEmail = string & { __brand: "UnverifiedEmail" };
export type VerifiedEmail = string & { __brand: "VerifiedEmail" };
export type HashedPassword = string & { __brand: "HashedPassword" };

export type CreateUserInput = {
  name: string;
  email: UnverifiedEmail;
  password: HashedPassword;
  role?: string;
  verificationToken?: string;
  verificationTokenExpires?: Date;
};

export type ResponseUser = {
  id: number;
  name: string;
  email: string;
  isVerified: boolean;
  role: string;
};