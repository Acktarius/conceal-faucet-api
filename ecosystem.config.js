module.exports = {
  apps: [
    {
      name: "ccx-faucet",
      script: "server.js",
      instances: 2, // Run 2 processes for redundancy
      exec_mode: "cluster",
      max_memory_restart: "500M",
      // NODE_ENV is set by Docker environment variables (docker-compose.yml)
      error_file: "/dev/null", // Let Docker handle logs
      out_file: "/dev/null",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
  ],
};
