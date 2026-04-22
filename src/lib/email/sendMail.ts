"use server";

import nodemailer from "nodemailer";
import { getVerificationEmailHTML } from "./template";

const localhost = "http://localhost:3000";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
})

export async function sendVerficationEmail(user: {id: number; email: string; name: string }) {
    const verificationLink = `${localhost}/utils/verifyEmail/${user.id}`;
    const emailResult = await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: user.email,
        subject: 'Email Verification',
        html: getVerificationEmailHTML(verificationLink, user.name)
    });
    console.log("Email sent:", emailResult);
}

