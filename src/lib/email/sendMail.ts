"use server";

import nodemailer from "nodemailer";
import { getVerificationEmailHTML, getResetPasswordEmailHTML } from "./template";

const localhost = "http://localhost:3000";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
})

export async function sendVerficationEmail(user: { email: string; name: string; token: string }) {
    const verificationLink = `${localhost}/api/auth/verify?token=${user.token}`;
    const emailResult = await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: user.email,
        subject: 'Email Verification',
        html: getVerificationEmailHTML(verificationLink, user.name)
    });
    console.log("Verification email sent:", emailResult);
}

export async function sendResetPasswordEmail(user: { email: string; name: string; token: string }) {
    const resetLink = `${localhost}/reset-password?token=${user.token}`;
    const emailResult = await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: user.email,
        subject: 'Reset Password',
        html: getResetPasswordEmailHTML(resetLink, user.name)
    });
    console.log("Reset password email sent:", emailResult);
}

