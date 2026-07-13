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

### 2. Deploy App (PM2 path — recommended)

```bash
# Clone project
git clone your-repo /var/www/livegoali
cd /var/www/livegoali
npm install

# Create env file — MUST be named .env (not .env.production):
# ecosystem.config.js runs the socket server with `--env-file=.env`
# literally, and Next.js also loads .env automatically, so this one
# file is what both processes read.
cp .env.example .env
nano .env  # Fill all values — see Environment Variables Reference below

# MySQL + Redis only (do NOT run `docker-compose up -d --build`,
# which would also start the app/socket/nginx containers on the same
# ports 3000/3001/80 that PM2 + system nginx use below — pick one path)
docker compose up -d mysql redis

npm run prisma:push
npm run prisma:seed   # creates admin@livegoali.com / Admin@123! — CHANGE THIS PASSWORD immediately after first login

npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # follow the printed command to enable PM2 on boot
```

### 3. Nginx

`nginx.conf`'s upstreams (`server app:3000` / `server socket:3001`) are Docker Compose service hostnames — they only resolve inside that network. Since PM2 runs the app/socket processes directly on the host (not in containers), point nginx at localhost instead:

```bash
cp nginx.conf /etc/nginx/nginx.conf
sed -i 's/server app:3000;/server 127.0.0.1:3000;/' /etc/nginx/nginx.conf
sed -i 's/server socket:3001;/server 127.0.0.1:3001;/' /etc/nginx/nginx.conf
nginx -t && nginx -s reload
```

Do not open port 3001 to the public internet — only nginx (on `127.0.0.1`) needs to reach it. Set `NEXT_PUBLIC_SOCKET_URL` to your public domain (e.g. `https://livegoali.com`), not `http://<ip>:3001` — the browser connects over the same origin/port as the app, and nginx's `/socket.io/` location proxies it internally.

### 4. SSL with Certbot

```bash
certbot --nginx -d livegoali.com -d www.livegoali.com
```
Certbot edits `/etc/nginx/nginx.conf` in place to add the HTTPS server block and redirect — review the diff it makes before reloading if you're unsure.

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
