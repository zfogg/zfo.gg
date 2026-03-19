// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";
import nodemailer from "npm:nodemailer@6.9.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface RequestBody {
  token: string;
}

interface ResponseData {
  ok?: boolean;
  error?: string;
}

// Create SMTP transporter
function createTransporter() {
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

// Send notification to admin
async function sendNotification(action: string, email: string): Promise<void> {
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

serve(async (req: Request): Promise<Response> => {
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
    const { token } = body;

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the email by token
    const { data: email_signup, error: queryError } = await supabase
      .from("email_signups")
      .select("id, email, confirmed")
      .eq("token", token)
      .single();

    if (queryError || !email_signup) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (email_signup.confirmed) {
      return new Response(JSON.stringify({ error: "Email already confirmed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as confirmed
    const { error: updateError } = await supabase
      .from("email_signups")
      .update({ confirmed: true, confirmed_at: new Date().toISOString() })
      .eq("id", email_signup.id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to confirm email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await sendNotification("Email confirmed", email_signup.email);

    const response: ResponseData = { ok: true };
    return new Response(JSON.stringify(response), {
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
});
