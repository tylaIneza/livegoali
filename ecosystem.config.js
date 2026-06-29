module.exports = {
  apps: [
    {
      name: "livegoali-web",
      script: "node_modules/.bin/next",
      args: "start",
      instances: "max",           // one worker per CPU core
      exec_mode: "cluster",
      max_memory_restart: "1G",
      node_args: "--max-old-space-size=900",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
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
      // Give the socket server more memory — it holds 100k connections in RAM
      max_memory_restart: "3G",
      node_args: "--max-old-space-size=3000",
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
