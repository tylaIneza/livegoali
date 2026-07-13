# LiveGoali.com — Deployment Guide

## Quick Start (Development)

### 1. Clone & Install

```bash
cd livegoali.com
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
# Fill in your values
```

### 3. Database Setup

Start MySQL and Redis (Docker):
```bash
docker run -d --name mysql -e MYSQL_DATABASE=livegoali -e MYSQL_ROOT_PASSWORD=password -p 3306:3306 mysql:8
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

Run migrations:
```bash
npm run prisma:push
npm run prisma:seed
```

### 4. Run Development

```bash
npm run dev:all     # Runs Next.js + Socket.IO server
```

Open: http://localhost:3000  
Admin: http://localhost:3000/admin  
Credentials: admin@livegoali.com / Admin@123!

---

## Production VPS Deployment

### Prerequisites

- Ubuntu 22.04 VPS
- Docker + Docker Compose
- Domain pointed to server

### 1. Server Setup

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
apt install docker-compose-plugin -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install nodejs -y

# Install PM2 & Nginx
npm install -g pm2
apt install nginx certbot python3-certbot-nginx -y
```

### 2. Deploy App

```bash
# Clone project
git clone your-repo /var/www/livegoali
cd /var/www/livegoali

# Create production env
cp .env.example .env.production
nano .env.production  # Fill all values

# Build & deploy with Docker
docker-compose --env-file .env.production up -d --build

# OR use PM2 directly
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. SSL with Certbot

```bash
certbot --nginx -d livegoali.com -d www.livegoali.com
```

### 4. Nginx

```bash
cp nginx.conf /etc/nginx/nginx.conf
nginx -t && nginx -s reload
```

---

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | MySQL connection string | ✅ |
| `DB_CONNECTION_LIMIT` | Prisma pool size per process (see ecosystem.config.js) | Optional |
| `REDIS_URL` | Redis connection string | ✅ |
| `NEXTAUTH_SECRET` | NextAuth JWT secret | ✅ |
| `NEXTAUTH_URL` | App URL (https://livegoali.com) | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Optional |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Optional |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary for image uploads | Optional |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Optional |
| `CLOUDINARY_API_SECRET` | Cloudinary secret | Optional |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO server URL | ✅ |

---

## Architecture

```
┌─────────────────────────────────────┐
│           Cloudflare CDN            │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│              Nginx                  │
│   (SSL, Rate Limiting, Proxy)       │
└────────┬─────────────────┬──────────┘
         │                 │
┌────────▼────────┐  ┌────▼──────────┐
│   Next.js :3000 │  │ Socket.IO:3001│
│   (App Server)  │  │  (Live Chat)  │
└────────┬────────┘  └───────────────┘
         │
┌────────▼────────────────────────────┐
│           MySQL + Redis             │
│     (Database + Cache/Sessions)     │
└─────────────────────────────────────┘
```

---

## Stream Management

Admin can add streams at `/admin/matches/{id}/edit`:

**HLS (.m3u8)** — Recommended for live streaming
```
https://your-cdn.com/stream/match123/index.m3u8
```

**DASH (.mpd)** — Alternative adaptive streaming
```
https://your-cdn.com/stream/match123/manifest.mpd
```

**MP4** — For recorded/VOD content
```
https://your-cdn.com/videos/match123.mp4
```

The player automatically:
- Tests stream health
- Switches to backup streams on failure
- Shows stream quality options
- Reconnects on disconnect

---

## Scaling for 100K+ Concurrent Viewers

1. **CDN**: Use Cloudflare or AWS CloudFront for static assets
2. **Stream CDN**: Use a dedicated CDN (AWS MediaPackage, Cloudflare Stream)
3. **Horizontal scaling**: PM2 cluster mode (all CPU cores)
4. **Redis**: Use Redis Cluster for Socket.IO adapter
5. **Database**: Read replicas for heavy read workloads
6. **Caching**: Redis cache on all match/prediction queries (already implemented)

For Socket.IO scaling across multiple nodes:
```bash
npm install @socket.io/redis-adapter
```
