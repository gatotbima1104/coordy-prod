import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { UserLogin } from "../interfaces/auth.interface";
import { JWT_SECRET_KEY, prisma, SUPABASE_JWT_SECRET } from "../configs/config";

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { authorization } = req.headers;
    const token = authorization?.split("Bearer ")[1];

    const decodedToken = verify(token as string, SUPABASE_JWT_SECRET) as {
      sub: string;
      email: string;
    };
    if (!decodedToken) throw new Error("Unauthorized");
    
    const user = await prisma.user.findUnique({
      where: { supabaseId: decodedToken.sub }
    });
    if(!user) throw new Error("User doesn't exist")
    const loginUser: UserLogin = {
      id: user.id,
      supabaseId: user.supabaseId,
      email: user.email as string,
    };
    req.user = loginUser;

    next();
  } catch (error) {
    next(error);
  }
};