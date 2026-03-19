# Email Signup Setup Guide

This guide walks you through setting up the email signup feature with Supabase and Migadu SMTP.

## Prerequisites

- Supabase account (free tier is fine)
- Migadu email credentials (SMTP)
- Supabase CLI (`supabase` command)

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key (you'll need these)

## Step 2: Create Database Table

In your Supabase project dashboard, go to SQL Editor and run:

```sql
create table email_signups (
  id         uuid        primary key default gen_random_uuid(),
  email      text        not null unique,
  token      uuid        not null default gen_random_uuid(),
  confirmed  boolean     not null default false,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

alter table email_signups enable row level security;
-- No public RLS policies — only service role key can access
```

## Step 3: Deploy Edge Functions

### Install Supabase CLI

```bash
npm install -g supabase
```

### Initialize Supabase in your project

```bash
cd /path/to/zfo.gg
supabase init
supabase login
```

### Link to your Supabase project

```bash
supabase link --project-id your_project_id
```

### Set Secrets

In your Supabase project, go to Project Settings → Secrets and add:

- `SMTP_HOST` → `smtp.migadu.com`
- `SMTP_PORT` → `587`
- `SMTP_USER` → Your Migadu username (email)
- `SMTP_PASS` → Your Migadu password
- `SMTP_FROM` → Your email address (e.g., `notifications@zfo.gg`)

Or via CLI:

```bash
supabase secrets set SMTP_HOST=smtp.migadu.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER=your_email@domain.com
supabase secrets set SMTP_PASS=your_password
supabase secrets set SMTP_FROM=notifications@zfo.gg
```

### Deploy Functions

```bash
supabase functions deploy email-signup
supabase functions deploy email-confirm
```

## Step 4: Frontend Environment Variables

Create `.env` in `client/`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

You can find these in Supabase Project Settings → API.

## Step 5: Test Locally

```bash
cd client
pnpm install  # if needed
pnpm dev
```

Visit `http://localhost:5173/email` and try signing up.

Check your Supabase dashboard's email_signups table — you should see an unconfirmed row.

Check your email for the confirmation link.

## Production Deployment

When deploying with Docker:

```bash
# Build with env vars
docker-compose build \
  --build-arg VITE_SUPABASE_URL=https://... \
  --build-arg VITE_SUPABASE_ANON_KEY=... \
  -f docker-compose.yml
```

Or add to `docker-compose.yml`:

```yaml
environment:
  VITE_SUPABASE_URL: https://...
  VITE_SUPABASE_ANON_KEY: ...
```

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

- `supabase/functions/email-signup/index.ts` — Signup Edge Function
- `supabase/functions/email-confirm/index.ts` — Confirmation Edge Function
