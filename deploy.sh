#!/bin/bash

# Dua & Zikr Backend Deployment Script
# Run this script on your production server

echo "🚀 Starting Dua & Zikr Backend Deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update
sudo apt upgrade -y

# Install required system packages
echo "🔧 Installing system dependencies..."
sudo apt install -y python3 python3-pip python3-venv mysql-server mysql-client nginx git

# Install MySQL Python connector
echo "🐬 Installing MySQL Python connector..."
sudo apt install -y python3-dev default-libmysqlclient-dev build-essential

# Create project directory
echo "📁 Setting up project directory..."
PROJECT_DIR="/var/www/dua_zikr_backend"
sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR

# Clone or copy project files
echo "📥 Copying project files..."
# If using git:
# git clone https://github.com/ZeroDevsLtd/DuaZikrBackend.git $PROJECT_DIR
# Or copy files manually to $PROJECT_DIR

cd $PROJECT_DIR

# Create virtual environment
echo "🐍 Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "📚 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create production environment file
echo "⚙️ Setting up environment configuration..."
cp production.env .env
echo "⚠️  Please edit .env file with your actual production values!"

# Setup MySQL database
echo "🐬 Setting up MySQL database..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS dua_zikr_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'dua_user'@'localhost' IDENTIFIED BY 'your_secure_password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON dua_zikr_db.* TO 'dua_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Run Django migrations
echo "🗄️ Running database migrations..."
export DJANGO_SETTINGS_MODULE=dua_zikr_backend.production_settings
python manage.py makemigrations
python manage.py migrate

# Create superuser
echo "👑 Creating superuser..."
python manage.py createsuperuser

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# Setup Gunicorn service
echo "🔄 Setting up Gunicorn service..."
sudo tee /etc/systemd/system/dua-zikr.service > /dev/null <<EOF
[Unit]
Description=Dua & Zikr Backend Gunicorn Service
After=network.target

[Service]
User=$USER
Group=www-data
WorkingDirectory=$PROJECT_DIR
Environment="PATH=$PROJECT_DIR/venv/bin"
Environment="DJANGO_SETTINGS_MODULE=dua_zikr_backend.production_settings"
ExecStart=$PROJECT_DIR/venv/bin/gunicorn --config gunicorn.conf.py dua_zikr_backend.wsgi:application
ExecReload=/bin/kill -s HUP \$MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

# Setup Nginx configuration
echo "🌐 Setting up Nginx configuration..."
sudo tee /etc/nginx/sites-available/dua-zikr > /dev/null <<EOF
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location = /favicon.ico { access_log off; log_not_found off; }
    
    location /static/ {
        root $PROJECT_DIR;
    }

    location /media/ {
        root $PROJECT_DIR;
    }

    location / {
        include proxy_params;
        proxy_pass http://unix:/run/dua-zikr.sock;
    }
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/dua-zikr /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Start services
echo "🚀 Starting services..."
sudo systemctl daemon-reload
sudo systemctl start dua-zikr
sudo systemctl enable dua-zikr
sudo systemctl restart nginx

# Setup firewall
echo "🔥 Setting up firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw --force enable

echo "✅ Deployment completed!"
echo "🌐 Your API should be accessible at: http://yourdomain.com"
echo "📊 Check service status with: sudo systemctl status dua-zikr"
echo "📝 View logs with: sudo journalctl -u dua-zikr -f"
echo "⚠️  Don't forget to:"
echo "   1. Edit .env file with your actual values"
echo "   2. Update domain names in Nginx config"
echo "   3. Setup SSL certificate with Let's Encrypt"
echo "   4. Configure your domain DNS"
