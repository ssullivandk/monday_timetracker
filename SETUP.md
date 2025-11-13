# Local Development Environment Setup

## Prerequisites

- Docker Desktop installed
- Node.js 18+ installed
- npm or yarn
- Homebrew (for Mac)

## Initial Setup

### 1. **Install Required CLI Tools**

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Install Monday Apps CLI globally
npm install -g @monday/apps-cli

# Verify installations
supabase --version
mapps --version
```

### 2. **Install Node dependencies**

```bash
npm install
```

### 3. **Initialize Supabase** (if not already done)

```bash
supabase init
```

This creates a `supabase` directory with configuration and migrations.

### 4. **Start Supabase services**

```bash
supabase start
```

This will start all Supabase services (PostgreSQL, API, Studio, Auth, etc.). First run takes a few minutes to download Docker images.

**Copy the output keys!** You'll see:

- API URL: `http://localhost:54321`
- Studio URL: `http://localhost:54323`
- DB URL: `postgresql://postgres:postgres@localhost:54322/postgres`
- `anon key` and `service_role key` - **save these!**

### 5. **Update `.env.local`**

Copy the keys from step 4 into your `.env.local`:

```bash
# Supabase (Local)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key-from-supabase-start>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key-from-supabase-start>
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Redis (Local)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Monday.com (your existing token)
MONDAY_API_TOKEN=<your-token>

# Next.js
PORT=8301
APP_ID=10644582
NODE_ENV=development
```

### 6. **Start Redis**

```bash
docker compose up -d
```

This starts Redis and Redis Commander (GUI).

### 7. **Verify all services**

```bash
# Check Supabase status
supabase status

# Check Docker containers
docker ps
```

You should see:

- Supabase containers (supabase-db, supabase-studio, etc.)
- timetracker_redis
- timetracker_redis_commander

### 8. **Access management tools**

- **Supabase Studio**: <http://localhost:54323> (database GUI, SQL editor, table browser)
- **Redis Commander**: <http://localhost:8081> (Redis cache viewer)

### 9. **Start Next.js dev server**

```bash
npm run dev
```

Your app will be available at <http://localhost:8301>

---

## Useful Commands

### Supabase

- `supabase start` - Start all Supabase services
- `supabase stop` - Stop all Supabase services
- `supabase status` - Check service status and view URLs/keys
- `npm run db:studio` - Open Supabase Studio (<http://localhost:54323>)
- `npm run db:reset` - Reset database and re-run migrations
- `npm run db:migrate` - Push new migrations to database
- `supabase logs` - View Supabase logs

### Redis

- `docker compose up -d` - Start Redis services
- `docker compose down` - Stop Redis services
- `npm run redis:cli` - Access Redis CLI
- `npm run redis:flush` - Clear all Redis cache
- `npm run redis:gui` - Open Redis Commander (<http://localhost:8081>)

### Combined

- `npm run services:start` - Start both Supabase and Redis
- `npm run services:stop` - Stop both Supabase and Redis
- `npm run services:restart` - Restart all services

### Development

- `npm run dev` - Start Next.js dev server
- `npm run build` - Build for production
- `npm run start` - Start production server

---

## Database Migrations

Migrations are located in `supabase/migrations/` and run automatically when you:

- Run `supabase start` (first time)
- Run `supabase db reset`

To create a new migration:

```bash
# Create a new migration file
supabase migration new <migration_name>

# Edit the file in supabase/migrations/
# Then apply it:
supabase db reset
```

---

## Troubleshooting

### Supabase won't start

```bash
# Stop all containers
supabase stop
docker compose down

# Remove volumes (fresh start)
docker volume prune

# Start again
supabase start
```

### Can't see data in Studio

- Make sure migrations ran: `supabase db reset`
- Check database connection in Studio settings
- Verify `.env.local` has correct URLs

### Redis connection error

```bash
# Restart Redis
docker compose restart redis

# Check if Redis is running
docker ps | grep redis
```

### Port conflicts

If ports 54321-54324 are in use:

- Edit `supabase/config.toml` to change ports
- Or stop conflicting services

---

## Production Deployment

### 1. **Create Supabase Project**

- Go to <https://supabase.com>
- Create a new project
- Copy your production keys

### 2. **Run Migrations**

```bash
# Link to your production project
supabase link --project-ref <your-project-ref>

# Push migrations
supabase db push
```

Or run migrations manually in Supabase Dashboard → SQL Editor

### 3. **Set up Redis** (Upstash recommended)

- Go to <https://upstash.com>
- Create a Redis database
- Copy connection details

### 4. **Update Production Environment Variables**

In your deployment platform (Vercel, Railway, etc.), set:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-production-service-role-key>
DATABASE_URL=<your-production-database-url>

REDIS_URL=<your-upstash-redis-url>
REDIS_HOST=<your-upstash-host>
REDIS_PORT=6379
REDIS_PASSWORD=<your-upstash-password>

# Monday.com
MONDAY_API_TOKEN=<your-production-token>

NODE_ENV=production
```

### 5. **Deploy**

```bash
npm run build
# Then deploy to your platform
```

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│          Next.js Application            │
│              (Port 8301)                │
└─────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌──────────────┐    ┌──────────────┐
│   Supabase   │    │    Redis     │
│  (Port 54321)│    │  (Port 6379) │
│              │    │              │
│ - PostgreSQL │    │ - Caching    │
│ - REST API   │    │              │
│ - Studio     │    │              │
└──────────────┘    └──────────────┘
        │                   │
        ▼                   ▼
   [Database]          [Cache Layer]
```

---

## Quick Start (TL;DR)

```bash
# One-time setup
brew install supabase/tap/supabase
npm install
supabase start
# Copy keys to .env.local

# Daily workflow
supabase start          # Start Supabase
docker compose up -d    # Start Redis
npm run dev            # Start Next.js

# Stop everything
supabase stop
docker compose down
```
