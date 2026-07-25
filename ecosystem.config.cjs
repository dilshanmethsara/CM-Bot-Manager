module.exports = {
  apps: [
    {
      name: 'cloudmint-backend',
      script: 'server/src/server.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx/esm',
      env_file: 'server/.env',
      cwd: '/opt/cloudmint',
      watch: false,
      max_memory_restart: '500M'
    },
    {
      name: 'cloudmint-frontend',
      script: 'npx',
      args: 'nitro preview --port 3001',
      env: {
        PORT: '3001',
        NODE_ENV: 'production'
      },
      cwd: '/opt/cloudmint',
      watch: false,
      max_memory_restart: '300M'
    }
  ]
};
