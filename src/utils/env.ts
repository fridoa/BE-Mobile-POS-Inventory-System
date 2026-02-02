import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || "3000", 10),
  BACKEND_URL: process.env.BACKEND_URL || "http://localhost:3000",
  DATABASE_URL_PROD: process.env.DATABASE_URL_PROD || "",
  DATABASE_URL_DEMO: process.env.DATABASE_URL_DEMO || "",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "",
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY || "",
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY || "",
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT || "",

  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "",
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || "",
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || "",

  EMAIL_SMTP_PASS: process.env.EMAIL_SMTP_PASS || "",
  EMAIL_SMTP_SECURE: process.env.EMAIL_SMTP_SECURE === "true",
  EMAIL_SMTP_USER: process.env.EMAIL_SMTP_USER || "",
  EMAIL_SMTP_PORT: parseInt(process.env.EMAIL_SMTP_PORT || "465", 10),
  EMAIL_SMTP_HOST: process.env.EMAIL_SMTP_HOST || "",
  EMAIL_SMTP_SERVICE_NAME: process.env.EMAIL_SMTP_SERVICE_NAME || "",
};
