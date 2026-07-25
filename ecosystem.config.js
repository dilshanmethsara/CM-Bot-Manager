module.exports = {
  apps: [{
    name: 'cloudmint',
    script: 'server/src/server.ts',
    interpreter: 'node',
    interpreter_args: '--import tsx/esm',
    env_file: 'server/.env',
    cwd: '/opt/cloudmint',
    watch: false,
    max_memory_restart: '500M'
  }]
};
