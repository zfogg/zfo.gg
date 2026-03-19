// @ts-nocheck
// Use Deno.serve for unauthenticated access
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";
import { createTransporter, sendNotification, isValidEmail } from "../email-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface RequestBody {
  email: string;
}

// Send email via SMTP
async function sendConfirmationEmail(email: string, token: string): Promise<void> {
  console.log("Creating nodemailer transport");

  const transporter = createTransporter();
  const smtpFrom = Deno.env.get("SMTP_FROM") || "";

  console.log("Sending email...");

  const confirmationBaseUrl = Deno.env.get("CONFIRMATION_BASE_URL") || "https://zfo.gg";
  const confirmationLink = `${confirmationBaseUrl}/email/confirm?token=${token}`;

  await transporter.sendMail({
    from: smtpFrom,
    to: email,
    subject: "Confirm your subscription to zfo.gg",
    html: `
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Hey!</h1>
      <p>Click below to confirm your email address and get updates from zfo.gg.</p>
      <p style="margin-top: 30px;">
        <a href="${confirmationLink}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
          Confirm my email →
        </a>
      </p>
      <p style="margin-top: 30px; color: #999; font-size: 12px;">
        You received this because someone entered this address on zfo.gg. If that wasn't you, you can ignore this email.
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

    const { data: existing } = await supabase
      .from("email_signups")
      .select("id, confirmed")
      .eq("email", email);

    if (existing && existing.length > 0 && existing[0].confirmed) {
      return new Response(JSON.stringify({ error: "Email already confirmed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = crypto.randomUUID();

    const { error: dbError } = await supabase
      .from("email_signups")
      .upsert({ email, token, confirmed: false }, { onConflict: "email" });

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(JSON.stringify({ error: "Failed to save email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      await sendConfirmationEmail(email, token);
      console.log("Email sent successfully to:", email);
      await sendNotification("Email signup requested", email);
    } catch (emailError) {
      console.error("Email error:", emailError);
      console.error("Error details:", JSON.stringify(emailError));
      return new Response(
        JSON.stringify({ error: "Failed to send confirmation email", details: String(emailError) }),
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
