module.exports = {
  apps: [
    {
      name: "convox-backend",
      script: "./index.js",
      instances: "max",        // Run as many instances as there are CPU cores
      exec_mode: "cluster",    // Enable PM2 cluster mode
      autorestart: true,       // Restart on crash
      watch: false,            // Don't watch files in production
      max_memory_restart: '1G',// Auto restart if app exceeds 1GB memory
      env: {
        NODE_ENV: "development",
        PORT: 8000
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8000
      }
    }
  ]
};
