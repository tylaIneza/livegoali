module.exports = {
  apps: [
    {
      name: "livegoali-web",
      script: "node_modules/.bin/next",
      args: "start",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      max_memory_restart: "1G",
      error_file: "logs/web-error.log",
      out_file: "logs/web-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
    {
      name: "livegoali-socket",
      script: "npx",
      args: "tsx src/server/socket.ts",
      instances: 1,
      env: {
        NODE_ENV: "production",
        SOCKET_PORT: 3001,
      },
      max_memory_restart: "512M",
      error_file: "logs/socket-error.log",
      out_file: "logs/socket-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
