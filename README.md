# Dua & Zikr Backend API

A comprehensive Django REST API backend for Islamic duas and zikr applications. This API provides access to a rich collection of Islamic supplications with support for multiple languages and comprehensive metadata.

## Features

- **Multi-language Support**: English, Bengali, Arabic, Urdu, German, Spanish, and Indonesian
- **Comprehensive Dua Data**: Includes Arabic text, transliterations, translations, explanations, and benefits
- **Rich Metadata**: Categories, difficulty levels, usage instructions, and references
- **Audio Support**: Audio file URLs and reciter information
- **Statistics Tracking**: View counts, favorite counts, and usage statistics
- **Search & Filtering**: Advanced search capabilities and filtering options
- **RESTful API**: Clean, well-documented REST endpoints

## API Endpoints

### Main Endpoints
- `GET /api/getalldua/` - Get all duas with metadata
- `GET /api/getallcategory/` - Get all categories with metadata

### Individual Dua Endpoints
- `GET /api/dua/{id}/` - Get a specific dua by ID
- `POST /api/favorite/{id}/` - Mark a dua as favorite

### Category Endpoints
- `GET /api/category/{slug}/` - Get all duas for a specific category

### Search & Filter Endpoints
- `GET /api/search/?q={query}` - Search duas by text
- `GET /api/popular/?limit={number}` - Get popular duas
- `GET /api/type/{type}/` - Get duas by type (quranic, hadith, traditional, personal)
- `GET /api/difficulty/{level}/` - Get duas by difficulty (beginner, intermediate, advanced)

### Information Endpoints
- `GET /api/info/` - Get API information and statistics

## Technology Stack

- **Backend**: Django 4.2.7
- **API Framework**: Django REST Framework 3.14.0
- **Database**: SQLite (can be easily changed to PostgreSQL/MySQL)
- **CORS**: django-cors-headers for cross-origin requests
- **Environment**: python-decouple for configuration management

## Project Structure

```
DuaZikrBackend/
├── dua_zikr_backend/          # Main project directory
│   ├── __init__.py
│   ├── settings.py            # Django settings
│   ├── urls.py               # Main URL configuration
│   ├── wsgi.py               # WSGI configuration
│   └── asgi.py               # ASGI configuration
├── duas/                      # Main app directory
│   ├── __init__.py
│   ├── admin.py              # Django admin configuration
│   ├── apps.py               # App configuration
│   ├── models.py             # Database models
│   ├── serializers.py        # API serializers
│   ├── views.py              # API views
│   ├── urls.py               # App URL patterns
│   └── management/           # Management commands
│       └── commands/
│           └── populate_sample_data.py
├── manage.py                  # Django management script
├── requirements.txt           # Python dependencies
└── README.md                 # This file
```

## Installation & Setup

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd DuaZikrBackend
```

### 2. Create Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run Database Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser (Optional)
```bash
python manage.py createsuperuser
```

### 6. Populate Sample Data
```bash
python manage.py populate_sample_data
```

### 7. Run the Development Server
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

## Database Models

### Category Model
- Basic information (name, slug, description)
- Visual properties (icon, color)
- Timestamps

### Dua Model
- **Basic Info**: ID, type, category, priority, tags
- **Arabic Text**: Text, font, size
- **Transliterations**: Multiple language support
- **Translations**: Complete translations with explanations and benefits
- **Audio**: Reciter, duration, URLs
- **References**: Quran, Hadith, and other sources
- **Usage**: When to recite, frequency, times
- **Statistics**: View count, favorite count, last read
- **Metadata**: Difficulty, estimated time, related duas, notes

### DuaStatistics Model
- Detailed usage statistics
- Time tracking and analytics

## Sample API Response

The `getAllDua` endpoint returns data in the following format:

```json
{
  "metadata": {
    "version": "1.0.0",
    "lastUpdated": "2024-01-15T10:00:00Z",
    "totalDuas": 5,
    "supportedLanguages": ["en", "bn", "ar", "ur", "de", "es", "id"],
    "categories": ["Salah", "Morning", "Evening", "Sleep", "Food & Drink"]
  },
  "duas": [
    {
      "id": "dua_001",
      "type": "quranic",
      "category": {...},
      "arabic": {...},
      "transliteration": {...},
      "translation": {...},
      "audio": {...},
      "references": {...},
      "usage": {...},
      "statistics": {...},
      "metadata": {...}
    }
  ]
}
```

## Configuration

### Environment Variables
Create a `.env` file in the project root:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Database Configuration
The project uses SQLite by default. To use PostgreSQL or MySQL, update the `DATABASES` setting in `settings.py`.

## Development

### Adding New Duas
1. Use the Django admin interface at `/admin/`
2. Or create a new management command
3. Or add directly through the Django shell

### Adding New Languages
1. Add new transliteration and translation fields to the Dua model
2. Update the serializers to include the new language
3. Update the metadata to include the new language code

### Customizing the API
- Modify serializers in `duas/serializers.py`
- Add new views in `duas/views.py`
- Update URL patterns in `duas/urls.py`

## Testing

### Run Tests
```bash
python manage.py test
```

### Test API Endpoints
Use tools like:
- **Postman**: For API testing and development
- **curl**: For command-line testing
- **Django REST Framework browsable API**: Available at each endpoint

## Deployment

### Production Settings
1. Set `DEBUG = False`
2. Use a production database (PostgreSQL/MySQL)
3. Configure proper CORS settings
4. Set up static file serving
5. Use environment variables for sensitive data

### Docker Support
The project can be easily containerized using Docker and docker-compose.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation

## Acknowledgments

- Islamic scholars and sources for authentic dua content
- Django and Django REST Framework communities
- Contributors and maintainers

---

**Note**: This API is designed for educational and religious purposes. Please ensure all content is authentic and properly sourced from reliable Islamic references.
