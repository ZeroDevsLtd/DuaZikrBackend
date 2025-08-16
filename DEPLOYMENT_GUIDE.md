# 🚀 Production Deployment Guide - Dua & Zikr Backend

## 📋 Prerequisites

- **Server**: Ubuntu 20.04+ or CentOS 8+
- **Domain**: A registered domain name (optional but recommended)
- **MySQL**: Server with MySQL 8.0+
- **Python**: Python 3.9+
- **Nginx**: Web server for reverse proxy

## 🔧 Server Setup

### 1. **Connect to Your Server**
```bash
ssh username@your-server-ip
```

### 2. **Update System**
```bash
sudo apt update && sudo apt upgrade -y
```

### 3. **Install Dependencies**
```bash
sudo apt install -y python3 python3-pip python3-venv mysql-server mysql-client nginx git
sudo apt install -y python3-dev default-libmysqlclient-dev build-essential
```

## 🗄️ MySQL Database Setup

### 1. **Secure MySQL Installation**
```bash
sudo mysql_secure_installation
```

### 2. **Create Database and User**
```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE dua_zikr_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dua_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON dua_zikr_db.* TO 'dua_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 📁 Project Deployment

### 1. **Clone Project**
```bash
cd /var/www
sudo git clone https://github.com/ZeroDevsLtd/DuaZikrBackend.git
sudo chown -R $USER:$USER dua_zikr_backend
cd dua_zikr_backend
```

### 2. **Setup Virtual Environment**
```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. **Environment Configuration**
```bash
cp production.env .env
nano .env
```

**Update these values in `.env`:**
```bash
# Django Settings
SECRET_KEY=your-super-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,your-server-ip

# Database Configuration
DB_NAME=dua_zikr_db
DB_USER=dua_user
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=3306

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

### 4. **Database Migration**
```bash
export DJANGO_SETTINGS_MODULE=dua_zikr_backend.production_settings
python manage.py makemigrations
python manage.py migrate
```

### 5. **Create Superuser**
```bash
python manage.py createsuperuser
```

### 6. **Collect Static Files**
```bash
python manage.py collectstatic --noinput
```

## 🔄 Gunicorn Setup

### 1. **Create Gunicorn Service**
```bash
sudo nano /etc/systemd/system/dua-zikr.service
```

**Add this content:**
```ini
[Unit]
Description=Dua & Zikr Backend Gunicorn Service
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/dua_zikr_backend
Environment="PATH=/var/www/dua_zikr_backend/venv/bin"
Environment="DJANGO_SETTINGS_MODULE=dua_zikr_backend.production_settings"
ExecStart=/var/www/dua_zikr_backend/venv/bin/gunicorn --config gunicorn.conf.py dua_zikr_backend.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

### 2. **Start Gunicorn Service**
```bash
sudo systemctl daemon-reload
sudo systemctl start dua-zikr
sudo systemctl enable dua-zikr
sudo systemctl status dua-zikr
```

## 🌐 Nginx Configuration

### 1. **Create Nginx Site Config**
```bash
sudo nano /etc/nginx/sites-available/dua-zikr
```

**Add this content:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location = /favicon.ico { access_log off; log_not_found off; }
    
    location /static/ {
        root /var/www/dua_zikr_backend;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        root /var/www/dua_zikr_backend;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        include proxy_params;
        proxy_pass http://unix:/run/dua-zikr.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. **Enable Site and Test**
```bash
sudo ln -sf /etc/nginx/sites-available/dua-zikr /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## 🔒 SSL Certificate (Let's Encrypt)

### 1. **Install Certbot**
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. **Obtain SSL Certificate**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 3. **Auto-renewal**
```bash
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔥 Firewall Setup

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw --force enable
```

## 📊 Monitoring and Logs

### **Check Service Status**
```bash
sudo systemctl status dua-zikr
sudo systemctl status nginx
```

### **View Logs**
```bash
# Gunicorn logs
sudo journalctl -u dua-zikr -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Django logs
tail -f /var/www/dua_zikr_backend/logs/django.log
```

## 🚀 Quick Deployment Script

**Use the automated deployment script:**
```bash
chmod +x deploy.sh
./deploy.sh
```

## 🔧 Troubleshooting

### **Common Issues:**

1. **Permission Denied**
   ```bash
   sudo chown -R www-data:www-data /var/www/dua_zikr_backend
   sudo chmod -R 755 /var/www/dua_zikr_backend
   ```

2. **Database Connection Error**
   ```bash
   # Check MySQL service
   sudo systemctl status mysql
   
   # Test connection
   mysql -u dua_user -p dua_zikr_db
   ```

3. **Static Files Not Loading**
   ```bash
   python manage.py collectstatic --noinput
   sudo chown -R www-data:www-data /var/www/dua_zikr_backend/staticfiles
   ```

4. **Port Already in Use**
   ```bash
   sudo lsof -i :8000
   sudo kill -9 <PID>
   ```

## 📱 Mobile App Configuration

**Update your mobile app with:**
- **API Base URL**: `https://yourdomain.com/api/`
- **Registration**: `POST https://yourdomain.com/api/auth/signup/`
- **Login**: `POST https://yourdomain.com/api/auth/login/`
- **Get Duas**: `GET https://yourdomain.com/api/getalldua/`

## ✅ Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] Superuser created
- [ ] Static files collected
- [ ] Gunicorn service running
- [ ] Nginx configuration working
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] API endpoints accessible
- [ ] Mobile app tested
- [ ] Monitoring setup

## 🆘 Support

If you encounter issues:
1. Check service status: `sudo systemctl status dua-zikr`
2. View logs: `sudo journalctl -u dua-zikr -f`
3. Check Nginx: `sudo nginx -t`
4. Verify database connection
5. Check file permissions

---

**🎉 Your Dua & Zikr Backend is now production-ready!**
