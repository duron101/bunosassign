#!/bin/sh

# Docker entrypoint script for frontend

set -e

# 设置默认值
BACKEND_URL=${BACKEND_URL:-http://backend:3000}

# 替换Nginx配置中的环境变量
if [ -f /etc/nginx/nginx.conf ]; then
    echo "Configuring nginx with BACKEND_URL: $BACKEND_URL"
    sed -i "s|backend:3000|${BACKEND_URL#http://}|g" /etc/nginx/nginx.conf
fi

# 创建必要目录
mkdir -p /var/log/nginx
touch /var/log/nginx/access.log /var/log/nginx/error.log

# 测试nginx配置
echo "Testing nginx configuration..."
nginx -t

# 启动nginx
echo "Starting nginx..."
exec "$@"