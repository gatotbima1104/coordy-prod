import jwt from "jsonwebtoken";
import { SUPABASE_JWT_SECRET } from "../configs/config";

export function verifySupabaseToken(token: string) {
  return jwt.verify(token, SUPABASE_JWT_SECRET, {
    algorithms: ["HS256"],
  });
}
