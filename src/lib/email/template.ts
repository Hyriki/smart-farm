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

export function getResetPasswordEmailHTML(resetLink: string, userName: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Reset Your Password, ${userName}</h1>
      <p>You requested to reset your password. Click the button below to proceed:</p>
      <a href="${resetLink}" 
         style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Reset Password
      </a>
      <p>This link will expire in 30 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
      <p>Or copy this link:</p>
      <p>${resetLink}</p>
    </div>
  `
}