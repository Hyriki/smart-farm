// src/lib/email/templates.ts
export function getVerificationEmailHTML(verificationLink: string, userName: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Welcome, ${userName}!</h1>
      <p>Please verify your email to get started:</p>
      <a href="${verificationLink}" 
         style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Verify Email
      </a>
      <p>Or copy this link:</p>
      <p>${verificationLink}</p>
    </div>
  `
}