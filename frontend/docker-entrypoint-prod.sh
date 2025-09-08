#!/bin/sh
# Production Docker Entrypoint for Frontend

set -e

echo "🚀 Starting frontend production container..."

# Create required directories
mkdir -p /var/cache/nginx/client_temp
mkdir -p /var/log/nginx

# Set proper permissions
chown -R nginx:nginx /var/cache/nginx
chown -R nginx:nginx /var/log/nginx
chown -R nginx:nginx /usr/share/nginx/html

# Test nginx configuration
echo "🔧 Testing nginx configuration..."
nginx -t

echo "✅ Frontend container ready!"

# Execute the main command
exec "$@"