import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? "change-me-in-production";

export interface JwtPayload {
  userId: string;
  role: "USER" | "ADMIN";
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}
