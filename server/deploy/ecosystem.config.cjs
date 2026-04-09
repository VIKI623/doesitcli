// PM2 ecosystem file for the doesitcli comments API.
// Started by `pm2 start ecosystem.config.cjs` from /home/www/doesitcli/api.
module.exports = {
    apps: [
        {
            name: 'doesitcli-api',
            script: 'src/index.mjs',
            cwd: '/home/www/doesitcli/api',
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            max_memory_restart: '256M',
            env: {
                NODE_ENV: 'production',
            },
            error_file: '/home/www/doesitcli/logs/pm2-err.log',
            out_file: '/home/www/doesitcli/logs/pm2-out.log',
            time: true,
        },
    ],
}
