# Vercel KV Setup Guide

This guide explains how to set up Vercel KV for persistent data storage in MyDashboard.

## Why Vercel KV?

The application runs on Vercel Serverless Functions. Without persistent storage, data resets on every "cold start" (when a new function instance is created). Vercel KV provides Redis-based storage that persists data across all function invocations.

## Setup Instructions

### 1. Create a KV Store

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`my-dashboard`)
3. Click **Storage** in the top menu
4. Click **Create** and select **KV**
5. Give it a name (e.g., `my-dashboard-kv`)
6. Select a region close to your users
7. Click **Create & Continue**

### 2. Connect KV to Your Project

1. After creation, click **Connect to Project**
2. Select your `my-dashboard` project
3. The following environment variables will be added automatically:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### 3. Redeploy

After connecting, Vercel will automatically redeploy your project with the new environment variables.

If it doesn't, push a new commit or trigger a manual deployment:

```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

## Verification

After deployment, check that storage is working:

1. Open your app and make a change (add an app, edit a note, etc.)
2. Wait a few minutes for the serverless function to go cold
3. Refresh the page - your changes should persist!

You can also check the health endpoint:
```
GET /api/health
```

It should return `"mode": "vercel-kv"`.

## Admin Endpoints

### Reset Database

To reset the database to seed data:

```bash
curl -X POST https://your-app.vercel.app/api/admin/reset
```

**Warning:** This will delete all your data and restore the default seed data.

## Pricing

Vercel KV has a generous free tier:
- 256 MB storage
- 30,000 requests/month
- 100 concurrent connections

For most personal projects, this is more than enough.

## Troubleshooting

### Data still resets after deployment

1. Check that the KV environment variables are set in your Vercel project settings
2. Check the function logs in Vercel for any KV connection errors
3. Make sure the KV store is in the same region as your deployment

### "KV init error" in logs

This usually means the environment variables are not set. Make sure:
1. The KV store is connected to your project
2. You've redeployed after connecting

## Local Development

For local development, the app will fallback to in-memory storage if KV environment variables are not set. This is expected behavior.

To test with real KV locally:
1. Install Vercel CLI: `npm i -g vercel`
2. Link your project: `vercel link`
3. Pull environment variables: `vercel env pull .env.local`
4. Run with env vars: `vercel dev`
