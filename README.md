# Dua & Zikr Backend API

A comprehensive Django REST Framework backend API for a Dua and Zikr application, providing multi-language support for Islamic supplications and prayers.

## 🌟 Features

- **Multi-language Support**: Full support for 7 languages (English, Bengali, Arabic, Urdu, German, Spanish, Indonesian)
- **Comprehensive Dua Database**: 15 categories with sample duas
- **RESTful API**: Clean, well-documented API endpoints
- **Public APIs**: All dua and category APIs are publicly accessible without authentication
- **User Management**: Optional signup, login, password reset, profile management
- **Admin Interface**: Django admin for easy content management
- **Multi-language Fields**: Titles, translations, explanations, and benefits in all supported languages
- **Category Management**: Organized dua categories with icons and colors
- **Search & Filter**: Advanced search and filtering capabilities
- **Network Accessible**: Configurable for access from mobile devices on the same network

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- pip
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ZeroDevsLtd/DuaZikrBackend.git
   cd DuaZikrBackend
   ```

2. **Create virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp config.env.example config.env
   # Edit config.env with your configuration
   ```

5. **Run migrations**
   ```bash
   python manage.py makemigrations duas
   python manage.py makemigrations authentication
   python manage.py migrate
   ```

6. **Populate sample data**
   ```bash
   python manage.py populate_sample_data
   ```

7. **Create admin user**
   ```bash
   python manage.py createsuperuser
   ```

8. **Run the server**
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

### API Usage

#### Public APIs (No Authentication Required)
```bash
# Get all duas
curl http://localhost:8000/api/getalldua/

# Get all categories
curl http://localhost:8000/api/getallcategory/

# Search duas
curl "http://localhost:8000/api/search/?q=bismillah"
```

#### User Management APIs
```bash
# User registration
curl -X POST http://localhost:8000/api/auth/signup/ \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "password": "securepass123", "password_confirm": "securepass123"}'

# User login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "securepass123"}'

# Forgot password
curl -X POST http://localhost:8000/api/auth/forgot-password/ \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'
```

## 📱 API Endpoints

### Base URL
```
http://localhost:8000/api/
```

### 🔓 Public Endpoints (No Authentication Required)

#### 1. Get All Duas
- **URL**: `/getalldua/`
- **Method**: `GET`
- **Description**: Returns all duas with complete information including multi-language support
- **Response**: JSON with metadata and duas array

#### 2. Get All Categories
- **URL**: `/getallcategory/`
- **Method**: `GET`
- **Description**: Returns all categories with multi-language names and descriptions
- **Response**: JSON with categories array

#### 3. Search Duas
- **URL**: `/search/`
- **Method**: `GET`
- **Parameters**: `q` (search query)
- **Description**: Search duas by text content
- **Response**: JSON with matching duas

#### 4. Filter Duas by Category
- **URL**: `/filter/`
- **Method**: `GET`
- **Parameters**: `category` (category slug)
- **Description**: Filter duas by category
- **Response**: JSON with filtered duas

#### 5. Get Single Dua
- **URL**: `/dua/<dua_id>/`
- **Method**: `GET`
- **Description**: Get detailed information about a specific dua
- **Response**: JSON with complete dua information

#### 6. Health Check
- **URL**: `/health/`
- **Method**: `GET`
- **Description**: API health status
- **Response**: Simple status message

### 🔐 Authentication Endpoints (User Management)

#### 1. User Registration
- **URL**: `/auth/signup/`
- **Method**: `POST`
- **Required**: `name`, `email`, `password`
- **Optional**: `phone`, `age`, `gender`
- **Description**: Create a new user account
- **Response**: User data and authentication token

#### 2. User Login
- **URL**: `/auth/login/`
- **Method**: `POST`
- **Required**: `email`, `password`
- **Description**: Authenticate user and get access token
- **Response**: User data and authentication token

#### 3. Forgot Password
- **URL**: `/auth/forgot-password/`
- **Method**: `POST`
- **Required**: `email`
- **Description**: Request password reset link
- **Response**: Success message

#### 4. Reset Password
- **URL**: `/auth/reset-password/`
- **Method**: `POST`
- **Required**: `token`, `new_password`, `new_password_confirm`
- **Description**: Reset password using token
- **Response**: Success message

#### 5. Password Reset Page
- **URL**: `/auth/reset-password-page/?token=<token>`
- **Method**: `GET`
- **Description**: User-friendly HTML page for password reset
- **Response**: HTML form

### 🔒 Protected Endpoints (Authentication Required)

#### 1. User Profile
- **URL**: `/auth/profile/`
- **Method**: `GET`, `PUT`, `PATCH`
- **Headers**: `Authorization: Token <your-token>`
- **Description**: Get and update user profile
- **Response**: User profile data

#### 2. User Info
- **URL**: `/auth/me/`
- **Method**: `GET`
- **Headers**: `Authorization: Token <your-token>`
- **Description**: Get current user information
- **Response**: Current user data

#### 3. Change Password
- **URL**: `/auth/change-password/`
- **Method**: `POST`
- **Headers**: `Authorization: Token <your-token>`
- **Required**: `old_password`, `new_password`, `new_password_confirm`
- **Description**: Change user password
- **Response**: Success message and new token

#### 4. User Logout
- **URL**: `/auth/logout/`
- **Method**: `POST`
- **Headers**: `Authorization: Token <your-token>`
- **Description**: Logout user and invalidate token
- **Response**: Success message

## 🌍 Multi-language Support

The API supports the following languages:
- **English (en)**
- **Bengali (bn)**
- **Arabic (ar)**
- **Urdu (ur)**
- **German (de)**
- **Spanish (es)**
- **Indonesian (id)**

### Multi-language Fields
Each dua includes:
- `title`: Title in all supported languages
- `transliteration`: Arabic text transliteration in all languages
- `translation`: Meaning in all supported languages
- `explanation`: Detailed explanation in all languages
- `benefits`: Benefits and virtues in all languages

## 🗂️ Data Structure

### Dua Object
```json
{
  "id": "dua_001",
  "type": "quranic",
  "category_id": 1,
  "category_name": "Salah",
  "priority": 1,
  "tags": ["prayer", "worship", "quran"],
  "title": {
    "en": "Sura Fatiha",
    "bn": "সূরা ফাতিহা",
    "ar": "سورة الفاتحة",
    "ur": "سورہ فاتحہ",
    "de": "Sure Al-Fatiha",
    "es": "Sura Al-Fatiha",
    "id": "Surah Al-Fatihah"
  },
  "dua_text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  "transliteration": { /* multi-language */ },
  "translation": { /* multi-language */ },
  "explanation": { /* multi-language */ },
  "benefits": { /* multi-language */ },
  "audio": {
    "reciter": "Abdul Rahman Al-Sudais",
    "duration": "00:00:15",
    "url": "https://api.example.com/audio/dua_001.mp3"
  },
  "references": {
    "quran": {"surah": 1, "ayah": 1, "juz": 1},
    "source": "Quran 1:1"
  },
  "usage": {
    "whenToRecite": ["Before starting any work", "Before eating"],
    "frequency": "daily"
  },
  "statistics": {
    "viewCount": 0,
    "favoriteCount": 0,
    "lastRead": null
  },
  "metadata": {
    "difficulty": "beginner",
    "estimatedTime": "00:00:30",
    "relatedDuas": [],
    "notes": "This is the most important dua to memorize"
  }
}
```

### Category Object
```json
{
  "id": 1,
  "name": {
    "en": "Salah",
    "bn": "নামাজ",
    "ar": "الصلاة",
    "ur": "نماز",
    "de": "Gebet",
    "es": "Oración",
    "id": "Sholat"
  },
  "slug": "salah",
  "description": { /* multi-language */ },
  "icon": "prayer",
  "color": "#4CAF50",
  "created_at": "2025-08-15T10:33:33.127281Z",
  "updated_at": "2025-08-15T10:33:33.127298Z"
}
```

## 🏗️ Project Structure

```
DuaZikrBackend/
├── dua_zikr_backend/          # Main Django project
│   ├── __init__.py
│   ├── settings.py            # Django settings
│   ├── urls.py               # Main URL configuration
│   ├── wsgi.py               # WSGI configuration
│   └── asgi.py               # ASGI configuration
├── duas/                      # Main app
│   ├── __init__.py
│   ├── admin.py              # Django admin configuration
│   ├── apps.py               # App configuration
│   ├── models.py             # Database models
│   ├── serializers.py        # DRF serializers
│   ├── views.py              # API views
│   ├── urls.py               # App URL configuration
│   ├── tests.py              # Unit tests
│   └── management/           # Custom management commands
│       └── commands/
│           └── populate_sample_data.py
├── requirements.txt           # Python dependencies
├── manage.py                 # Django management script
├── README.md                 # This file
├── API_DOCUMENTATION.md      # Detailed API documentation
└── PROJECT_SUMMARY.md        # Project overview
```

## 🔧 Configuration

### Environment Variables
Create a `config.env` file with:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,192.168.50.205
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Network Access
To access the API from mobile devices on the same network:
1. Update `ALLOWED_HOSTS` in `settings.py` with your local IP
2. Update `CORS_ALLOWED_ORIGINS` if needed
3. Run server with: `python manage.py runserver 0.0.0.0:8000`

## 👨‍💼 Admin Interface

Access the admin interface at `/admin/` to:
- Manage categories and duas
- Add/edit multi-language content
- Monitor usage statistics
- Manage user accounts

## 📊 Sample Data

The project includes sample data for:
- **15 Categories**: Salah, Morning, Evening, Sleep, Ramadan, Food & Drink, Illness, Ruqyah, Family, Rizq, Gratitude, Purification, Hajj & Umrah, Travel, Nature
- **10 Sample Duas**: Including Quranic verses and hadith-based supplications

## 🧪 Testing

Run tests with:
```bash
python manage.py test
```

## 📝 API Documentation

For detailed API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team

## 🔄 Updates

- **v1.0.0**: Initial release with complete API and multi-language support
- Multi-language support for both Duas and Categories
- Comprehensive admin interface
- Sample data for all categories
- Network accessibility for mobile devices

---

**Built with ❤️ by ZeroDevs Team**
