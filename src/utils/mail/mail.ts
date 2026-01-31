import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import { env } from "../env";
import { ISendMail } from "../interfaces";

const transporter = nodemailer.createTransport({
  service: env.EMAIL_SMTP_SERVICE_NAME,
  host: env.EMAIL_SMTP_HOST,
  port: env.EMAIL_SMTP_PORT,
  secure: env.EMAIL_SMTP_SECURE,
  auth: {
    user: env.EMAIL_SMTP_USER,
    pass: env.EMAIL_SMTP_PASS,
  },
  requireTLS: true,
});

export const sendMail = async (option: ISendMail) => {
  return await transporter.sendMail({
    from: `"Toko Intan Support" <${env.EMAIL_SMTP_USER}>`,
    ...option,
  });
};

export const renderMail = async (template: string, data: any): Promise<string> => {
  const content = path.join(__dirname, `./templates/${template}`);
  return await ejs.renderFile(content, data);
};

export async function sendForgotPasswordEmail(to: string, username: string, token: string) {
  const baseUrl = env.BACKEND_URL || "http://localhost:3000";

  const resetLink = `${baseUrl}/auth/reset-redirect?token=${token}`;

  const emailHtml = await renderMail("forgot-password.ejs", {
    username,
    resetLink,
  });

  await sendMail({
    to,
    subject: "Permintaan Reset Password - Toko Intan",
    html: emailHtml,
  });
}
