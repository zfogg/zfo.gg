// @ts-nocheck
// Shared utilities for email functions
import nodemailer from "npm:nodemailer@6.9.7";

export function createTransporter() {
  const smtpHost = Deno.env.get("SMTP_HOST") || "";
  const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
  const smtpUser = Deno.env.get("SMTP_USER") || "";
  const smtpPass = Deno.env.get("SMTP_PASS") || "";

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: true,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export async function sendNotification(action: string, email: string): Promise<void> {
  const notificationEmail = Deno.env.get("NOTIFICATION_EMAIL");
  if (!notificationEmail) {
    console.log("NOTIFICATION_EMAIL not configured, skipping notification");
    return;
  }

  try {
    const transporter = createTransporter();
    const smtpFrom = Deno.env.get("SMTP_FROM") || "";

    await transporter.sendMail({
      from: smtpFrom,
      to: notificationEmail,
      subject: `zfo.gg email notification: ${action}`,
      html: `
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>${action}</h2>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
    </div>
  </body>
</html>
      `.trim(),
    });

    console.log("Notification sent successfully");
  } catch (error) {
    console.error("Failed to send notification:", error);
    // Don't throw - notification failure shouldn't block the main flow
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
