// @ts-nocheck
// Use Deno.serve for unauthenticated access
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";
import nodemailer from "npm:nodemailer@6.9.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface RequestBody {
  email: string;
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Send unsubscribe confirmation email via SMTP
async function sendUnsubscribeEmail(email: string, token: string): Promise<void> {
  const smtpHost = Deno.env.get("SMTP_HOST") || "";
  const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
  const smtpUser = Deno.env.get("SMTP_USER") || "";
  const smtpPass = Deno.env.get("SMTP_PASS") || "";
  const smtpFrom = Deno.env.get("SMTP_FROM") || "";

  console.log("Creating nodemailer transport:", { host: smtpHost, port: smtpPort });

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: true,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  console.log("Sending email...");

  const confirmationBaseUrl = Deno.env.get("CONFIRMATION_BASE_URL") || "https://zfo.gg";
  const unsubscribeLink = `${confirmationBaseUrl}/email/unsubscribe/confirm?token=${token}`;

  await transporter.sendMail({
    from: smtpFrom,
    to: email,
    subject: "Confirm unsubscribe from zfo.gg",
    html: `
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Sorry to see you go</h1>
      <p>Click below to confirm you want to unsubscribe from zfo.gg updates.</p>
      <p style="margin-top: 30px;">
        <a href="${unsubscribeLink}" style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
          Confirm unsubscribe →
        </a>
      </p>
      <p style="margin-top: 30px; color: #999; font-size: 12px;">
        You received this because someone requested to unsubscribe this address on zfo.gg. If that wasn't you, you can ignore this email.
      </p>
    </div>
  </body>
</html>
    `.trim(),
  });

  console.log("Email sent successfully");
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body: RequestBody = await req.json();
    const { email } = body;

    if (!email || !isValidEmail(email)) {
      return new Response(JSON.stringify({ error: "Invalid email address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if email exists
    const { data: existing, error: queryError } = await supabase
      .from("email_signups")
      .select("id, email")
      .eq("email", email);

    if (queryError || !existing || existing.length === 0) {
      return new Response(JSON.stringify({ error: "Email not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate new unsubscribe token
    const token = crypto.randomUUID();

    // Update the token for unsubscribe
    const { error: dbError } = await supabase
      .from("email_signups")
      .update({ token })
      .eq("email", email);

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(JSON.stringify({ error: "Failed to process unsubscribe request" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      await sendUnsubscribeEmail(email, token);
      console.log("Unsubscribe email sent successfully to:", email);
    } catch (emailError) {
      console.error("Email error:", emailError);
      console.error("Error details:", JSON.stringify(emailError));
      return new Response(
        JSON.stringify({ error: "Failed to send unsubscribe email", details: String(emailError) }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

Deno.serve(handler);
