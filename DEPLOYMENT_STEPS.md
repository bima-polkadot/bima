# 🚀 Simple Deployment Steps for BIMA Backend

Follow these steps to deploy your backend services to Fly.io.

## 📋 Prerequisites Check

1. **Check if Fly CLI is installed:**
   ```bash
   flyctl version
   ```
   If not installed:
   ```bash
   # macOS
   brew install flyctl
   
   # Linux/WSL
   curl -L https://fly.io/install.sh | sh
   
   # Windows
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. **Login to Fly.io:**
   ```bash
   flyctl auth login
   ```

## 🎯 Quick Deployment (Recommended)

**Option 1: Use the deployment script**
```bash
cd bima
./deploy.sh
```

**Option 2: Manual deployment (follow steps below)**

## 📦 Manual Deployment Steps

### Step 1: Deploy Main Backend

```bash
# Navigate to backend directory
cd bima/backend

# Create the Fly app (only run once)
flyctl apps create bima-backend

# Create storage volume (only run once)
flyctl volumes create bima_storage --size 3 --region iad

# Deploy the application
flyctl deploy

# Check if it's working
flyctl status
```

### Step 2: Deploy Polkadot Service

```bash
# Navigate to Polkadot service directory
cd "../POlkadot"

# Create the Fly app (only run once)
flyctl apps create bima-polkadot-service

# Create storage volume (only run once)
flyctl volumes create polkadot_data --size 1 --region iad

# Deploy the application
flyctl deploy

# Check if it's working
flyctl status
```

### Step 3: Set Environment Variables

**For Polkadot Service (REQUIRED):**
```bash
# Set Substrate RPC endpoint and IPFS/Pinata credentials
flyctl secrets set POLKADOT_WS="wss://rpc.polkadot.io" --app bima-polkadot-service
flyctl secrets set PINATA_API_KEY="your-pinata-key" --app bima-polkadot-service
flyctl secrets set PINATA_SECRET_API_KEY="your-pinata-secret" --app bima-polkadot-service
```

**For Main Backend (OPTIONAL):**
```bash
flyctl secrets set OPENAI_API_KEY="your-openai-key" --app bima-backend
```

## 🌐 Get Your URLs

```bash
# Get backend URL
flyctl info --app bima-backend

# Get Polkadot service URL  
flyctl info --app bima-polkadot-service
```

Your services will be available at:
- Backend: `https://bima-backend.fly.dev`
- Polkadot Service: `https://bima-polkadot-service.fly.dev`

## 🔧 Update Frontend

Update your frontend environment variables:

```env
# In frontend/.env.production or Vercel settings
VITE_API_URL=https://bima-backend.fly.dev
VITE_POLKADOT_SERVICE_URL=https://bima-polkadot-service.fly.dev
```

Then redeploy your frontend to Vercel.

## 🔍 Troubleshooting

### If you get "volume error":
The fly.toml has been updated to use a single volume. Delete old apps and redeploy:
```bash
flyctl apps destroy bima-backend
flyctl apps destroy bima-polkadot-service
```
Then run the deployment steps again.

### Check logs:
```bash
flyctl logs --app bima-backend
flyctl logs --app bima-polkadot-service
```

### SSH into containers:
```bash
flyctl ssh console --app bima-backend
flyctl ssh console --app bima-hedera-service
```

## ✅ Verification

1. Visit `https://your-backend.fly.dev/api/health` - should return OK
2. Visit `https://your-polkadot-service.fly.dev/health` - should return OK
3. Test your frontend - it should now connect to the deployed backends

## 💡 Tips

- Use the `./deploy.sh` script for easy deployment
- Always set the Hedera credentials as secrets, never in code
- Monitor your apps with `flyctl status`
- Free tier includes 3 VMs and 3GB storage - perfect for this project
- Your SQLite database will persist across deployments thanks to the volume

## 🆘 Need Help?

If something goes wrong:
1. Check the logs: `flyctl logs --app your-app-name`
2. Verify secrets are set: `flyctl secrets list --app your-app-name`  
3. Try redeploying: `flyctl deploy --app your-app-name`
4. Check volume exists: `flyctl volumes list --app your-app-name`

That's it! Your backend should now be running on Fly.io 