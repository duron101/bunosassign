module.exports = {
  apps: [{
    name: 'bonus-system',
    script: 'simple-server.js',
    instances: 2,                    // 多实例负载均衡
    exec_mode: 'cluster',            // 集群模式
    max_memory_restart: '500M',      // 内存超限自动重启
    restart_delay: 4000,             // 重启延迟
    max_restarts: 10,                // 最大重启次数
    min_uptime: '10s',              // 最小运行时间
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // 日志配置
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // 监控配置
    pmx: true,
    // 健康检查
    health_check_grace_period: 3000,
    health_check_fatal_exceptions: true
  }]
}
