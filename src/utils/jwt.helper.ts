import jwt from "jsonwebtoken";
import { JWT_SECRET_KEY } from "../configs/config";

type Payload = {
  id?: string;
  appleId?: string;
  email?: string | null;
};

export const signToken = (payload: Payload) => {
  return jwt.sign(payload, JWT_SECRET_KEY, {
    expiresIn: "7d",
  });
};
