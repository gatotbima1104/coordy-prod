import { Router } from "express";
import { AuthContoller } from "../controllers/auth.controller";
import { verifyToken } from "../middlewares/auth.middleware";

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints (Apple Sign-In)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AppleSignInRequest:
 *       type: object
 *       required:
 *         - identityToken
 *       properties:
 *         identityToken:
 *           type: string
 *           description: The Apple identity token (JWT) from client
 *         email:
 *           type: string
 *           description: The user's email (optional, provided during first login)
 *         fullName:
 *           type: string
 *           description: The user's full name (optional)
 *       example:
 *         identityToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         email: "john@example.com"
 *         fullName: "John Doe"
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: JWT token to authenticate subsequent requests
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             appleId:
 *               type: string
 *             email:
 *               type: string
 *       example:
 *         token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         user:
 *           id: "9cfaef20-1df5-4e42-bb6b-27a6a501f93c"
 *           appleId: "000123.5b4d2e19e8a04aaf90aa2f53a6e5a8b3.1234"
 *           email: "john@example.com"
 */

export const authRouter = () => {
  const router = Router();
  const authContoller = new AuthContoller();

  /**
   * @swagger
   * /signin/apple:
   *   post:
   *     summary: Sign in or register user using Apple ID
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AppleSignInRequest'
   *     responses:
   *       200:
   *         description: Successfully signed in with Apple
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *       400:
   *         description: Invalid Apple identity token or missing fields
   *       500:
   *         description: Internal server error
   */
  // router.post("/apple", authContoller.signInWithApple);
  router.post("/sync-user", authContoller.syncUser);
  router.delete("/account-delete", verifyToken, authContoller.deleteAccount);

  return router;
};
