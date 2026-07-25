module.exports = {
  apps: [{
    name: 'cloudmint-backend',
    script: 'server/src/server.ts',
    interpreter: 'node',
    interpreter_args: '--import tsx/esm',
    env_file: 'server/.env',
    cwd: '/opt/cloudmint',
    watch: false,
    max_memory_restart: '500M',
    instances: 1,
    exec_mode: 'fork',
    error_file: '/home/ubuntu/.pm2/logs/cloudmint-backend-error.log',
    out_file: '/home/ubuntu/.pm2/logs/cloudmint-backend-out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
