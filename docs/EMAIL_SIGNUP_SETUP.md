# Email Signup Setup Guide

This guide walks you through setting up the email signup feature with Supabase and Migadu SMTP.

## Prerequisites

- Supabase account (free tier is fine)
- Migadu email credentials (SMTP)
- Supabase CLI (`supabase` command)

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key (you'll need these)

## Step 2: Deploy Edge Functions & Database Migration

The database schema is committed at `supabase/migrations/20260319000000_create_email_signups.sql`. It will run automatically when you deploy.

### Quick Setup (Automated)

```bash
chmod +x DEPLOY_SUPABASE.sh
./DEPLOY_SUPABASE.sh
```

This script will:

1. Link to your Supabase project (requires project ID)
2. Prompt for Migadu SMTP credentials
3. Save them as Supabase secrets
4. Deploy the Edge Functions
5. Run the database migration

### Manual Setup

If you prefer to do it manually:

```bash
# Install CLI
npm install -g supabase

# Initialize and authenticate
supabase init
supabase login

# Link to your project
supabase link --project-id your_project_id

# Set SMTP secrets
supabase secrets set SMTP_HOST=smtp.migadu.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER=your_migadu_email@domain.com
supabase secrets set SMTP_PASS=your_migadu_password
supabase secrets set SMTP_FROM=notifications@zfo.gg

# Deploy Edge Functions
supabase functions deploy email-signup
supabase functions deploy email-confirm
```

## Step 3: Frontend Environment Variables

The frontend needs these environment variables (prefixed with `VITE_` for Vite):

- `VITE_SUPABASE_URL` — Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Your Supabase anonymous (public) key

You can find these in Supabase Project Settings → API.

### Local Testing

Create `client/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Then test:

```bash
cd client
pnpm install  # if needed
pnpm dev
```

Visit `http://localhost:5173/email` and try signing up.

### Production Deployment (Coolify)

Set these environment variables in Coolify (or your deployment platform):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

These will be injected at build time via Vite's `define` option.

## Troubleshooting

### Email not sending

- Check Supabase function logs: `supabase functions list` → View logs
- Verify SMTP credentials in Supabase secrets
- Check Migadu account has sending enabled

### Token not confirming

- Check browser network tab for the confirm request
- Verify token is being passed correctly in URL
- Check Supabase logs for database errors

### CORS errors

- Edge Functions have CORS headers enabled — if you see CORS errors, check browser console for details
- Ensure `VITE_SUPABASE_URL` is correct and accessible

## Next Steps

Once emails are confirming successfully, you can:

1. Export the email list from Supabase
2. Use your email service to send newsletters to confirmed emails
3. Track unsubscribes by adding an `unsubscribed` column to the table

## Files Modified

- `client/src/pages/Email.jsx` — Signup form
- `client/src/pages/EmailConfirm.jsx` — Confirmation page
- `client/src/App.jsx` — Routes
- `client/src/components/Footer.jsx` — Email icon link
- `client/Caddyfile` — SPA routing

## Files Created

- `supabase/migrations/20260319000000_create_email_signups.sql` — Database schema migration
- `supabase/functions/email-signup/index.ts` — Signup Edge Function
- `supabase/functions/email-confirm/index.ts` — Confirmation Edge Function
- `DEPLOY_SUPABASE.sh` — Automated deployment script
