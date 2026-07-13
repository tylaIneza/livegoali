// Memory/instance counts below are sized for a 4 vCPU / 8GB single-box
// deployment running the full stack (this app + MySQL + Redis + nginx on
// one machine). Worst-case budget on that spec:
//   OS + MySQL + Redis + nginx     ~2GB  (reserved, not managed by PM2)
//   web:    3 workers x 600M       ~1.8GB
//   socket: 1 worker  x 2G         ~2GB
//   total                          ~5.8GB, leaving ~2.2GB headroom
// If you deploy on different hardware, rescale these together with
// DB_CONNECTION_LIMIT in .env (see src/lib/prisma.ts) — connection count
// = connection_limit x (web instances + 1 socket instance).
module.exports = {
  apps: [
    {
      name: "livegoali-web",
      script: "node_modules/.bin/next",
      args: "start",
      instances: -1,               // all CPU cores minus 1 — reserves a core for the socket server + system load
      exec_mode: "cluster",
      max_memory_restart: "600M",
      node_args: "--max-old-space-size=500",
      env: {
        NODE_ENV: "production",
        // Port 3000 is already used by another app on the shared VPS
        // (confirmed via `ss -tlnp` — check for conflicts again if you
        // deploy this to a different box).
        PORT: 3002,
      },
      error_file: "logs/web-error.log",
      out_file: "logs/web-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
    {
      name: "livegoali-socket",
      script: "node_modules/.bin/tsx",
      args: "--env-file=.env src/server/socket.ts",
      instances: 1,
      exec_mode: "fork",
      // Single process handling all WebSocket connections — sized to fit
      // the remaining budget after the web tier and system overhead above.
      max_memory_restart: "2G",
      node_args: "--max-old-space-size=1800",
      env: {
        NODE_ENV: "production",
        SOCKET_PORT: 3001,
      },
      error_file: "logs/socket-error.log",
      out_file: "logs/socket-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
