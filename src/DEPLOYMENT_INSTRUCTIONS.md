# Deployment Instructions

## Issue: "Failed to exit group: 404 404 Not Found"

This error occurs because the Supabase Edge Function hasn't been deployed with the latest code that includes the "leave group" endpoint.

## Solution: Deploy the Edge Function

You need to deploy the server code to Supabase. Here's how:

### Option 1: Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_ID
   ```
   Replace `YOUR_PROJECT_ID` with your actual Supabase project ID.

4. **Deploy the Edge Function**:
   ```bash
   supabase functions deploy server
   ```
   
   Or if you're using npx:
   ```bash
   npx supabase functions deploy server
   ```

5. **Verify deployment**:
   - Go to your Supabase Dashboard
   - Navigate to Edge Functions
   - Check that `server` is listed and shows a recent deployment time
   - Test the health endpoint: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-88ccad03/health`

### Option 2: Using Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions**
3. Click on the **server** function (or create it if it doesn't exist)
4. Click **Deploy new version**
5. Copy the contents of `/supabase/functions/server/index.tsx`
6. Paste into the editor
7. Click **Deploy**

## Verifying the Fix

After deployment:

1. Go to the Super Saver page
2. Join a group
3. Click "Exit Group"
4. The button should change back to "Join Group" without any errors

## Additional Notes

- The Edge Function needs to be redeployed whenever you make changes to the server code
- You can check the logs in the Supabase Dashboard under Edge Functions > Logs
- The health check endpoint provides information about available routes

## Troubleshooting

If you still get 404 errors after deployment:

1. **Check the logs**:
   ```bash
   supabase functions logs server
   ```

2. **Test the health endpoint**:
   ```bash
   curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-88ccad03/health
   ```

3. **Verify the route**:
   The leave endpoint should be at:
   `POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-88ccad03/groups/:productId/leave`

4. **Check authentication**:
   Make sure you're signed in and your access token is valid

## Google Sign-In Issue

For the Google sign-in error "provider is not enabled":

1. Go to Supabase Dashboard
2. Navigate to **Authentication** > **Providers**
3. Enable **Google** provider
4. Add your Google OAuth credentials:
   - Get Client ID and Client Secret from [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
5. Save the configuration

For now, users can sign in using email/password authentication.
