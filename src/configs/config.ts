import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { resolve } from "path";

// export const NODE_ENV = process.env.NODE_ENV || "development";
// const envFile = NODE_ENV === "development" ? ".env.local" : ".env";
const envFile: string = ".env"

config({ path: resolve(__dirname, `../${envFile}`), override: true });

export const prisma = new PrismaClient()
export const PORT = process.env.PORT || 8000;
export const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || ""
export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || ""
export const DOMAIN_NAME = process.env.DOMAIN_NAME || ""
export const SUMOPOD_API_KEY = process.env.SUMOPOD_API_KEY || ""
export const SUMOPOD_API_URL = process.env.SUMOPOD_API_URL || ""

// APNs configuration
export const APN_KEY_ID = process.env.APN_KEY_ID || "";
export const APN_TEAM_ID = process.env.APN_TEAM_ID || "";
export const APN_PRIVATE_KEY = process.env.APN_PRIVATE_KEY || "";
export const APN_BUNDLE_ID = process.env.APN_BUNDLE_ID || "";
export const APN_HOST = process.env.APN_HOST || "";