# Vercel Deployment Guide

This guide explains how to deploy your Express + MongoDB backend to Vercel as serverless functions.

## Overview

Your backend has been adapted to work with Vercel's serverless environment while maintaining full compatibility with local development.

## What Changed?

### 1. Database Connection (`src/utils/database.ts`)

- **Added connection pooling** for serverless optimization
- **Cached connections** to avoid reconnecting on every request
- **Removed `process.exit(1)`** - now throws errors instead for serverless compatibility

### 2. Vercel Entry Point (`api/index.ts`)

- Created a new Vercel serverless handler
- Connects to database before each request
- Handles errors gracefully

### 3. Configuration Files

- **`vercel.json`**: Configures Vercel build and routing
- **`package.json`**: Added `vercel-build` script
- **`tsconfig.json`**: Updated to compile both `src` and `api` directories

### 4. Dependencies

- Added `@vercel/node` for Vercel-specific types and utilities

## Local Development

Your backend works exactly the same locally:

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The server will run on port 5000 (or your configured PORT) as before.

## Vercel Deployment

### Step 1: Push to GitHub

1. Commit all changes:

```bash
git add .
git commit -m "Add Vercel serverless support"
git push
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Select the `backend` folder as the root directory
5. Click "Deploy"

### Step 3: Configure Environment Variables

In Vercel dashboard, go to Settings → Environment Variables and add:

```
DATABASE_URL=mongodb+srv://your-username:your-password@cluster.mongodb.net/your-database
NODE_ENV=production
```

**Important**: Add any other environment variables from your `.env` file (e.g., `RESEND_API_KEY`, `JWT_SECRET`, etc.)

### Step 4: Redeploy

After adding environment variables, redeploy your project:

- Go to Deployments tab
- Click the three dots next to your latest deployment
- Select "Redeploy"

## API Endpoints

Once deployed, your API will be available at:

```
https://your-project.vercel.app/api/users
https://your-project.vercel.app/api/auth
```

## Testing Your Deployment

### Health Check

```bash
curl https://your-project.vercel.app/
```

Expected response:

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### User Registration

```bash
curl -X POST https://your-project.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123","role":"admin"}'
```

## How It Works

### Traditional Server vs Serverless

**Traditional Server (Local):**

```
Start Server → Connect DB Once → Listen on Port → Handle Requests → Keep Running
```

**Vercel Serverless:**

```
Request Arrives → Start Function → Connect/Reuse DB → Handle Request → Return Response → Shutdown
```

### Connection Pooling

In serverless environments, functions start and stop frequently. Connection pooling:

- Reuses existing MongoDB connections across function invocations
- Reduces connection overhead
- Improves performance and reduces costs

## Troubleshooting

### Build Errors

**Error: Cannot find module '@vercel/node'**

```bash
cd backend
npm install @vercel/node
```

### Runtime Errors

**Error: DATABASE_URL not defined**

- Make sure you've added `DATABASE_URL` in Vercel environment variables
- Redeploy after adding environment variables

**Error: Connection timeout**

- Check your MongoDB connection string is correct
- Ensure your MongoDB cluster allows connections from anywhere (whitelist IP 0.0.0.0/0)

### Performance Issues

**Slow response times**

- Connection pooling should help, but first requests may be slower (cold start)
- Consider using Vercel's Edge Functions for better performance

## Differences from Local Development

| Feature             | Local Development | Vercel Serverless        |
| ------------------- | ----------------- | ------------------------ |
| Server Lifecycle    | Long-running      | Per-request              |
| Database Connection | Once at startup   | Per-request with pooling |
| Execution Time      | Unlimited         | 10-60 seconds            |
| Environment         | `.env` file       | Vercel dashboard         |
| Logs                | Console           | Vercel dashboard         |

## Best Practices

1. **Keep functions lightweight**: Serverless functions have execution time limits
2. **Use connection pooling**: Already implemented for MongoDB
3. **Monitor cold starts**: First requests may be slower
4. **Set appropriate timeouts**: Configure MongoDB connection timeouts
5. **Handle errors gracefully**: Errors are logged in Vercel dashboard

## Scaling

Vercel automatically scales your serverless functions:

- **Horizontal scaling**: Multiple function instances handle concurrent requests
- **Automatic scaling**: No manual configuration needed
- **Pay-per-use**: You only pay for actual usage

## Monitoring

View logs and metrics in Vercel dashboard:

- **Logs**: Real-time function logs
- **Analytics**: Request counts, response times
- **Errors**: Error tracking and alerts

## Next Steps

1. **Test thoroughly**: Test all API endpoints in production
2. **Set up monitoring**: Configure alerts for errors and performance issues
3. **Optimize**: Monitor performance and optimize slow endpoints
4. **Documentation**: Update API documentation with production URLs

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [MongoDB on Vercel](https://vercel.com/docs/concepts/solutions/mongodb)

## Summary

Your backend is now ready for Vercel deployment with:
✅ Serverless-compatible architecture
✅ Connection pooling for performance
✅ Full local development support
✅ Production-ready configuration

Deploy to Vercel and enjoy automatic scaling, global CDN, and zero infrastructure management!
