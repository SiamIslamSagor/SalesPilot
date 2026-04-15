# Setup & Deployment Guide

## Prerequisites

- **Node.js** 18+ (recommended: 20 LTS)
- **MongoDB** (local install or MongoDB Atlas cloud)
- **Bun** or **npm** as package manager
- **Git**

### External Service Accounts Required

| Service               | Purpose                       | Sign Up                       |
| --------------------- | ----------------------------- | ----------------------------- |
| **MongoDB Atlas**     | Cloud database                | https://www.mongodb.com/atlas |
| **Resend**            | Transactional email           | https://resend.com            |
| **ImgBB**             | Image hosting                 | https://imgbb.com             |
| **Vercel**            | Deployment (optional)         | https://vercel.com            |
| **Vercel AI Gateway** | AI mockup generation (Gemini) | Via Vercel dashboard          |

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repo-url>
cd prod-pros
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
DATABASE_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=<your-jwt-secret-at-least-32-chars>
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
FRONTEND_URL=http://localhost:8080
AI_GATEWAY_API_KEY=<your-vercel-ai-gateway-key>
IMGBB_API_KEY=<your-imgbb-api-key>
NODE_ENV=development
```

Start the backend dev server:

```bash
npm run start:dev
```

Backend runs on `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd ..   # back to project root
npm install   # or: bun install
```

Create `.env` in the project root:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend dev server:

```bash
npm run dev
```

Frontend runs on `http://localhost:8080`.

### 4. First-Time Setup

1. Open `http://localhost:8080` in your browser
2. You'll need to create the first user directly in MongoDB or via a seed script
3. Navigate to the Customers page — it auto-seeds 10 demo customers if the DB is empty
4. Import products via Excel or create them manually

---

## Available Scripts

### Frontend (root package.json)

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start Vite dev server    |
| `npm run build`   | Build for production     |
| `npm run preview` | Preview production build |
| `npm run lint`    | Run ESLint               |
| `npm run test`    | Run Vitest tests         |

### Backend (backend/package.json)

| Command             | Description                                |
| ------------------- | ------------------------------------------ |
| `npm run start:dev` | Start with ts-node + nodemon (auto-reload) |
| `npm run build`     | Compile TypeScript to dist/                |
| `npm start`         | Run compiled JS from dist/                 |
| `npm run lint`      | Run ESLint                                 |

---

## Deployment to Vercel

### Backend Deployment

The backend is configured as a Vercel serverless function via `backend/vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/api" }]
}
```

Entry point: `backend/api/index.ts`

1. Create a new Vercel project linked to the `backend/` directory
2. Set environment variables in Vercel dashboard (all from `.env`)
3. Deploy — all routes are handled by the single serverless function

### Frontend Deployment

The frontend is configured via root `vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

1. Create a new Vercel project linked to the root directory
2. Set `VITE_API_URL` environment variable pointing to your backend URL
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy

### Important: CORS Configuration

Update `backend/src/app.ts` CORS origins to include your production frontend URL. The current whitelist is:

- `FRONTEND_URL` environment variable
- `http://localhost:8080`
- `http://localhost:5173`

---

## Project Structure Summary

```
prod-pros/
├── docs/                          # Project documentation (you are here)
│   ├── PROJECT_OVERVIEW.md        # Complete project overview
│   ├── BACKEND_ARCHITECTURE.md    # Backend architecture details
│   ├── FRONTEND_ARCHITECTURE.md   # Frontend architecture details
│   ├── API_REFERENCE.md           # Complete API reference
│   └── SETUP_AND_DEPLOYMENT.md    # This file
│
├── backend/                       # Express.js API server
│   ├── api/index.ts               # Vercel serverless entry
│   ├── src/
│   │   ├── app.ts                 # Express app config
│   │   ├── server.ts              # Server startup
│   │   ├── controllers/           # 11 controllers
│   │   ├── services/              # 14 services
│   │   ├── repositories/          # 8 repositories
│   │   ├── models/                # 9 Mongoose models
│   │   ├── routes/                # 11 route files
│   │   ├── validators/            # 6 validator files
│   │   ├── middlewares/           # Auth, authorization, errors, upload
│   │   ├── migrations/            # Data migration scripts
│   │   ├── scripts/               # Utility scripts
│   │   ├── types/                 # TypeScript definitions
│   │   └── utils/                 # Shared utilities
│   ├── docs/                      # Legacy API-specific docs
│   ├── package.json
│   └── vercel.json
│
├── src/                           # React frontend
│   ├── App.tsx                    # Root + routing config
│   ├── main.tsx                   # Entry point
│   ├── pages/                     # 25 page components
│   ├── components/                # Reusable components + shadcn/ui
│   ├── contexts/                  # AuthContext
│   ├── hooks/                     # Custom hooks
│   ├── i18n/                      # Translations (EN/FI)
│   ├── services/api.ts            # API client
│   ├── types/                     # TypeScript types
│   └── lib/                       # Utilities
│
├── plans/                         # Feature planning docs
├── package.json                   # Frontend dependencies
├── vite.config.ts                 # Vite configuration
├── tailwind.config.ts             # Tailwind configuration
└── vercel.json                    # Frontend Vercel config
```

---

## Database Migrations

Run migrations manually when needed:

### Backfill Offer Access Codes

For existing offers missing `accessCode` fields:

```bash
cd backend
npx ts-node src/migrations/001_backfill_offer_access_codes.ts
```

### Backfill Record Owners

For offers/orders missing ownership metadata:

```bash
npx ts-node src/migrations/002_backfill_record_owners.ts
```

### Recalculate Order Totals

For orders with `totalAmount = 0`:

```bash
npx ts-node src/scripts/recalculateOrderTotals.ts
```

---

## Troubleshooting

| Issue                    | Solution                                                               |
| ------------------------ | ---------------------------------------------------------------------- |
| CORS errors              | Verify `FRONTEND_URL` in backend `.env` matches your frontend URL      |
| JWT errors               | Ensure `JWT_SECRET` is set and consistent across restarts              |
| Email not sending        | Check `RESEND_API_KEY` and `EMAIL_FROM` (must be verified in Resend)   |
| Mockup generation fails  | Verify `AI_GATEWAY_API_KEY` is valid; check 60s timeout isn't exceeded |
| Image upload fails       | Check `IMGBB_API_KEY` is valid                                         |
| MongoDB connection fails | Verify `DATABASE_URL` and that your IP is whitelisted in Atlas         |
| 401 on API calls         | Token expired (7-day lifetime) — re-login                              |
| Products won't delete    | Product is referenced in active (draft/sent) offers                    |
| Customers won't delete   | Customer has linked offers or orders                                   |
