// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

interface RequestBody {
  email: string;
}

interface ResponseData {
  ok?: boolean;
  error?: string;
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Send email via SMTP
async function sendConfirmationEmail(email: string, token: string): Promise<void> {
  // Deno doesn't have built-in SMTP, but we can use nodemailer via npm
  // For now, we'll use a simple HTTP approach or create a custom SMTP client

  // Using a simple approach with a Deno SMTP library
  const SMTPClient = await import("npm:smtp-client@0.12.1");

  const client = new SMTPClient.SMTPClient({
    hostname: Deno.env.get("SMTP_HOST") || "",
    port: parseInt(Deno.env.get("SMTP_PORT") || "587"),
    username: Deno.env.get("SMTP_USER") || "",
    password: Deno.env.get("SMTP_PASS") || "",
  });

  try {
    await client.connect();
    await client.send({
      from: Deno.env.get("SMTP_FROM") || "",
      to: email,
      subject: "Confirm your subscription to zfo.gg",
      content: `
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Hey!</h1>
      <p>Click below to confirm your email address and get updates from zfo.gg.</p>
      <p style="margin-top: 30px;">
        <a href="https://zfo.gg/email/confirm?token=${token}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
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
  } finally {
    await client.close();
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
    const { email } = body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return new Response(JSON.stringify({ error: "Invalid email address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if email already confirmed
    const { data: existing } = await supabase
      .from("email_signups")
      .select("id, confirmed")
      .eq("email", email)
      .single();

    if (existing?.confirmed) {
      return new Response(JSON.stringify({ error: "Email already confirmed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate new token
    const token = crypto.randomUUID();

    // Upsert email (if exists and not confirmed, update token; if new, insert)
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

    // Send confirmation email
    try {
      await sendConfirmationEmail(email, token);
    } catch (emailError) {
      console.error("Email error:", emailError);
      // Don't fail the request if email sending fails - the user can retry
    }

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
