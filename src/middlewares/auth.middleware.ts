import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { UserLogin } from "../interfaces/auth.interface";
import { JWT_SECRET_KEY, prisma } from "../configs/config";

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { authorization } = req.headers;
    const token = authorization?.split("Bearer ")[1];

    const decodedToken = verify(token as string, JWT_SECRET_KEY) as {
      id: string;
      email: string;
    };
    if (!decodedToken) throw new Error("Unauthorized");
    
    const user = await prisma.user.findUnique({ where: { id: decodedToken.id }})
    if(!user) throw new Error("User doesn't exist")
    req.user = decodedToken as UserLogin;

    next();
  } catch (error) {
    next(error);
  }
};