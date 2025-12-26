# LuminaIQ Deployment Guide to Render

## Quick Start - Deploy in 3 Steps

### Step 1: Push to GitHub

```bash
# Initialize git if not already done
cd d:\LuminaIQ
git init
git add .
git commit -m "Initial commit for deployment"

# Create GitHub repository and push
# Go to https://github.com/new
# Then run:
git remote add origin https://github.com/YOUR_USERNAME/luminaiq.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Backend to Render

1. **Go to** https://render.com and sign up/login
2. **Click** "New +" → "Web Service"
3. **Connect** your GitHub repository
4. **Configure**:
   - **Name**: `luminaiq-api`
   - **Root Directory**: `pdfprocess`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   
5. **Add Environment Variables**:
   ```
   SUPABASE_URL=https://ndvrjhenillhgpyubruh.supabase.co
   SUPABASE_SERVICE_KEY=<your-service-key-here>
   MAIN_API_WEBHOOK_URL=https://temp-lumina-backend-demo.onrender.com/api/v1/webhook/document-ready
   MAIN_API_WEBHOOK_SECRET=supersecretwebhook
   ENVIRONMENT=production
   CHUNK_SIZE=500
   CHUNK_OVERLAP=50
   MAX_FILE_SIZE=10485760
   BACKEND_CORS_ORIGINS=["https://luminaiq.onrender.com"]
   ```

6. **Click** "Create Web Service"

**Result**: Backend will be deployed at `https://luminaiq-api.onrender.com`

### Step 3: Deploy Frontend to Render

1. **Click** "New +" → "Static Site"
2. **Connect** same GitHub repository
3. **Configure**:
   - **Name**: `luminaiq`
   - **Root Directory**: `index`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   
4. **Add Environment Variables**:
   ```
   VITE_SUPABASE_URL=https://ndvrjhenillhgpyubruh.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key-here>
   VITE_PDF_SERVICE_URL=https://luminaiq-api.onrender.com
   VITE_BACKEND_API_URL=https://temp-lumina-backend-demo.onrender.com/api/v1
   ```

5. **Click** "Create Static Site"

**Result**: Frontend will be deployed at `https://luminaiq.onrender.com`

---

## Step 4: Update CORS Settings

After frontend is deployed:

1. Go to backend service on Render
2. Update `BACKEND_CORS_ORIGINS` environment variable:
   ```
   ["https://luminaiq.onrender.com","http://localhost:5173"]
   ```
3. Save changes (service will auto-redeploy)

---

## Step 5: Test Your Deployment

1. **Visit**: `https://luminaiq.onrender.com`
2. **Sign up** for account
3. **Create project** and upload a PDF
4. **Test features**: Chat, Quiz, Notes

---

## Alternative: Deploy Frontend to Vercel (Faster)

If you prefer Vercel for the frontend:

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend
cd d:\LuminaIQ\index

# Deploy
vercel --prod

# When prompted, set environment variables:
# VITE_SUPABASE_URL=https://ndvrjhenillhgpyubruh.supabase.co
# VITE_SUPABASE_ANON_KEY=<your-key>
# VITE_PDF_SERVICE_URL=https://luminaiq-api.onrender.com
# VITE_BACKEND_API_URL=https://temp-lumina-backend-demo.onrender.com/api/v1
```

---

## Important Notes

### Free Tier Limitations
- **Render Free**: Services sleep after 15 minutes of inactivity
- **First request**: May take 30-60 seconds to wake up
- **Solution**: Upgrade to paid plan ($7/month per service)

### Environment Variable Security
- Never commit `.env` files to Git
- Use Render dashboard to set sensitive variables
- Keep service keys secure

### Database Setup
Make sure you've run the database schema in Supabase:
```sql
-- File: pdfprocess/db/schema.sql
-- Run in Supabase SQL Editor
```

---

## Troubleshooting

### Build Fails on Render
- **Check logs** in Render dashboard
- **Verify** all dependencies in `requirements.txt` / `package.json`
- **Ensure** Python 3.11+ / Node 18+

### CORS Errors
- **Update** `BACKEND_CORS_ORIGINS` with your frontend URL
- **Include** protocol (`https://`)
- **Restart** backend service

### File Uploads Don't Work
- **Check** Supabase credentials in backend env vars
- **Verify** `MAX_FILE_SIZE` setting
- **Review logs** on Render

---

## Need Help?

Review the full deployment plan: [deployment_plan.md](file:///C:/Users/Samyukth/.gemini/antigravity/brain/bb218b4a-8573-4363-a401-a41b9af9046b/deployment_plan.md)

---

**Estimated Time**: 30-45 minutes for complete deployment
**Cost**: Free tier available, $0/month to start
