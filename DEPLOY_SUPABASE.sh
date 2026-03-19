#!/bin/bash
set -e

# Deploy Supabase Edge Functions and set up migrations
# Run this after setting up your Supabase project

PROJECT_ID="meheipmykrybyfbxudim"

echo "🔗 Linking to Supabase project..."
supabase link --project-id "$PROJECT_ID"

echo "📧 Setting SMTP secrets..."
read -p "Enter Migadu email: " SMTP_USER
read -sp "Enter Migadu password: " SMTP_PASS
echo
read -p "Enter from email address (e.g. notifications@zfo.gg): " SMTP_FROM

supabase secrets set SMTP_HOST=smtp.migadu.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER="$SMTP_USER"
supabase secrets set SMTP_PASS="$SMTP_PASS"
supabase secrets set SMTP_FROM="$SMTP_FROM"

echo "🚀 Deploying Edge Functions..."
supabase functions deploy email-signup
supabase functions deploy email-confirm

echo "✅ Supabase setup complete!"
echo "Migration will run automatically on first deploy."
