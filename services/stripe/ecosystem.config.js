module.exports = {
  apps: [
    {
      name: "mergemind-stripe",
      script: "dist/index.js",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 4000
      }
    }
  ]
};
