"use server";

import { Resend } from "resend";
import { getVerificationEmailHTML } from "./template";

const localhost = "http://localhost:3000";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(apiKey);
}

export async function sendVerficationEmail(user: {id: number; email: string; name: string }) {
    const resend = getResendClient();
    const verificationLink = `${localhost}/utils/verifyEmail/${user.id}`;
    const emailResult = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: user.email,
        subject: 'Email Verification',
        html: getVerificationEmailHTML(verificationLink, user.name)
    });
    console.log("Email sent:", emailResult);
}

