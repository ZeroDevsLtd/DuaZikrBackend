# Dua & Zikr API Documentation

## Overview

The Dua & Zikr API provides access to a comprehensive collection of Islamic supplications (duas) and remembrances (zikr) with support for multiple languages and rich metadata.

**Base URL**: `http://localhost:8000/api/`

## Authentication

Currently, all endpoints are publicly accessible. Authentication will be added in future versions.

## Response Format

All API responses follow a consistent JSON format:

```json
{
  "metadata": {
    "version": "1.0.0",
    "lastUpdated": "2024-01-15T10:00:00Z",
    "totalDuas": 5,
    "supportedLanguages": ["en", "bn", "ar", "ur", "de", "es", "id"],
    "categories": ["Salah", "Morning", "Evening", "Sleep", "Food & Drink"]
  },
  "data": {...}
}
```

## Endpoints

### 1. Get All Duas

**Endpoint**: `GET /api/getalldua/`

**Description**: Retrieves all duas with comprehensive metadata and information.

**Response**:
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
      "category": {
        "id": 1,
        "name": "Salah",
        "slug": "salah",
        "description": "Prayers and worship related duas",
        "icon": "prayer",
        "color": "#4CAF50"
      },
      "priority": 1,
      "tags": ["prayer", "worship", "quran"],
      "arabic": {
        "text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        "font": "Uthmanic",
        "size": "large"
      },
      "transliteration": {
        "en": "Bismillahir Rahmanir Rahim",
        "bn": "বিসমিল্লাহির রাহমানির রাহীম",
        "ur": "بسم اللہ الرحمن الرحیم"
      },
      "translation": {
        "en": {
          "title": "In the name of Allah, the Most Gracious, the Most Merciful",
          "translation": "In the name of Allah, the Most Gracious, the Most Merciful",
          "explanation": "This is the opening verse of the Quran, recited before starting any good deed",
          "benefits": [
            "Protection from evil",
            "Blessing in actions",
            "Connection with Allah"
          ]
        }
      },
      "audio": {
        "reciter": "Abdul Rahman Al-Sudais",
        "duration": "00:00:15",
        "url": "https://api.example.com/audio/dua_001.mp3",
        "localPath": "/audio/dua_001.mp3"
      },
      "references": {
        "quran": {
          "surah": 1,
          "ayah": 1,
          "juz": 1
        },
        "hadith": {
          "bukhari": "1:1",
          "muslim": "1:1",
          "abudawud": "1:1"
        },
        "source": "Quran 1:1"
      },
      "usage": {
        "whenToRecite": [
          "Before starting any work",
          "Before eating",
          "Before sleeping"
        ],
        "frequency": "daily",
        "times": ["morning", "evening", "before_meals"]
      },
      "statistics": {
        "viewCount": 0,
        "favoriteCount": 0,
        "lastRead": null,
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z"
      },
      "metadata": {
        "difficulty": "beginner",
        "estimatedTime": "00:00:30",
        "relatedDuas": ["dua_002", "dua_003"],
        "notes": "This is the most important dua to memorize"
      }
    }
  ]
}
```

### 2. Get All Categories

**Endpoint**: `GET /api/getallcategory/`

**Description**: Retrieves all available categories with metadata.

**Response**:
```json
{
  "metadata": {
    "version": "1.0.0",
    "lastUpdated": "2024-01-15T10:00:00Z",
    "totalDuas": 5,
    "supportedLanguages": ["en", "bn", "ar", "ur", "de", "es", "id"],
    "categories": ["Salah", "Morning", "Evening", "Sleep", "Food & Drink"]
  },
  "categories": [
    {
      "id": 1,
      "name": "Salah",
      "slug": "salah",
      "description": "Prayers and worship related duas",
      "icon": "prayer",
      "color": "#4CAF50",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### 3. Get Dua by ID

**Endpoint**: `GET /api/dua/{id}/`

**Description**: Retrieves a specific dua by its unique ID.

**Parameters**:
- `id` (path): The unique identifier of the dua (e.g., "dua_001")

**Response**: Same as individual dua object from getAllDua endpoint.

**Example**: `GET /api/dua/dua_001/`

### 4. Get Duas by Category

**Endpoint**: `GET /api/category/{slug}/`

**Description**: Retrieves all duas belonging to a specific category.

**Parameters**:
- `slug` (path): The category slug (e.g., "salah", "morning")

**Response**:
```json
{
  "category": {
    "id": 1,
    "name": "Salah",
    "slug": "salah",
    "description": "Prayers and worship related duas"
  },
  "duas": [...],
  "count": 2
}
```

### 5. Search Duas

**Endpoint**: `GET /api/search/`

**Description**: Searches duas by text query.

**Query Parameters**:
- `q` (required): Search query string

**Example**: `GET /api/search/?q=protection`

**Response**:
```json
{
  "query": "protection",
  "results": [...],
  "count": 3
}
```

### 6. Get Popular Duas

**Endpoint**: `GET /api/popular/`

**Description**: Retrieves popular duas based on view count.

**Query Parameters**:
- `limit` (optional): Number of duas to return (default: 10)

**Example**: `GET /api/popular/?limit=5`

**Response**:
```json
{
  "duas": [...],
  "count": 5
}
```

### 7. Get Duas by Type

**Endpoint**: `GET /api/type/{type}/`

**Description**: Retrieves duas by their type.

**Parameters**:
- `type` (path): Dua type (quranic, hadith, traditional, personal)

**Example**: `GET /api/type/quranic/`

**Response**:
```json
{
  "type": "quranic",
  "duas": [...],
  "count": 2
}
```

### 8. Get Duas by Difficulty

**Endpoint**: `GET /api/difficulty/{level}/`

**Description**: Retrieves duas by difficulty level.

**Parameters**:
- `level` (path): Difficulty level (beginner, intermediate, advanced)

**Example**: `GET /api/difficulty/beginner/`

**Response**:
```json
{
  "difficulty": "beginner",
  "duas": [...],
  "count": 3
}
```

### 9. Mark Dua as Favorite

**Endpoint**: `POST /api/favorite/{id}/`

**Description**: Marks a dua as favorite (increments favorite count).

**Parameters**:
- `id` (path): The dua ID to mark as favorite

**Example**: `POST /api/favorite/dua_001/`

**Response**:
```json
{
  "message": "Dua marked as favorite",
  "favoriteCount": 1
}
```

### 10. Get API Information

**Endpoint**: `GET /api/info/`

**Description**: Retrieves comprehensive API information and statistics.

**Response**:
```json
{
  "api_name": "Dua & Zikr API",
  "version": "1.0.0",
  "description": "A comprehensive API for Islamic duas and zikr",
  "statistics": {
    "totalDuas": 5,
    "totalCategories": 15,
    "categoryBreakdown": [
      {
        "name": "Salah",
        "dua_count": 1
      }
    ],
    "typeBreakdown": [
      {
        "type": "quranic",
        "count": 1
      }
    ]
  },
  "endpoints": [
    "/api/getalldua/",
    "/api/getallcategory/",
    "/api/dua/{id}/",
    "/api/category/{slug}/",
    "/api/search/",
    "/api/popular/",
    "/api/type/{type}/",
    "/api/difficulty/{level}/",
    "/api/favorite/{id}/",
    "/api/info/"
  ]
}
```

## Data Models

### Dua Object Structure

```json
{
  "id": "string",           // Unique identifier
  "type": "string",         // quranic, hadith, traditional, personal
  "category": "object",     // Category information
  "priority": "integer",    // 1-5 (Very High to Very Low)
  "tags": ["string"],       // Array of tags
  "arabic": {
    "text": "string",       // Arabic text
    "font": "string",       // Font family
    "size": "string"        // Text size
  },
  "transliteration": {
    "en": "string",         // English transliteration
    "bn": "string",         // Bengali transliteration
    "ur": "string",         // Urdu transliteration
    "ar": "string",         // Arabic transliteration
    "de": "string",         // German transliteration
    "es": "string",         // Spanish transliteration
    "id": "string"          // Indonesian transliteration
  },
  "translation": {
    "en": {
      "title": "string",    // English title
      "translation": "string", // English translation
      "explanation": "string", // English explanation
      "benefits": ["string"]   // Array of benefits
    }
    // Similar structure for other languages
  },
  "audio": {
    "reciter": "string",    // Reciter name
    "duration": "string",   // Duration (HH:MM:SS)
    "url": "string",        // Audio URL
    "localPath": "string"   // Local file path
  },
  "references": {
    "quran": {
      "surah": "integer",   // Surah number
      "ayah": "integer",    // Ayah number
      "juz": "integer"      // Juz number
    },
    "hadith": {
      "bukhari": "string",  // Bukhari reference
      "muslim": "string",   // Muslim reference
      "abudawud": "string"  // Abu Dawud reference
    },
    "source": "string"      // General source
  },
  "usage": {
    "whenToRecite": ["string"], // When to recite
    "frequency": "string",      // daily, weekly, monthly, occasional, special
    "times": ["string"]         // Specific times
  },
  "statistics": {
    "viewCount": "integer",     // Number of views
    "favoriteCount": "integer", // Number of favorites
    "lastRead": "datetime",     // Last read timestamp
    "createdAt": "datetime",    // Creation timestamp
    "updatedAt": "datetime"     // Last update timestamp
  },
  "metadata": {
    "difficulty": "string",     // beginner, intermediate, advanced
    "estimatedTime": "string",  // Estimated reading time
    "relatedDuas": ["string"],  // Related dua IDs
    "notes": "string"           // Additional notes
  }
}
```

### Category Object Structure

```json
{
  "id": "integer",          // Category ID
  "name": "string",         // Category name
  "slug": "string",         // URL-friendly slug
  "description": "string",  // Category description
  "icon": "string",         // Icon identifier
  "color": "string",        // Hex color code
  "created_at": "datetime", // Creation timestamp
  "updated_at": "datetime"  // Last update timestamp
}
```

## Error Handling

### Error Response Format

```json
{
  "error": "Error message description"
}
```

### Common HTTP Status Codes

- `200 OK`: Request successful
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Example Error Response

```json
{
  "error": "Dua not found"
}
```

## Rate Limiting

Currently, no rate limiting is implemented. This will be added in future versions.

## CORS

CORS is enabled for development. The following origins are allowed:
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `http://localhost:8000`
- `http://127.0.0.1:8000`

## Pagination

The API uses Django REST Framework's built-in pagination with a default page size of 20 items.

## Testing

### Using curl

```bash
# Get all duas
curl http://localhost:8000/api/getalldua/

# Get specific dua
curl http://localhost:8000/api/dua/dua_001/

# Search duas
curl "http://localhost:8000/api/search/?q=protection"

# Mark as favorite
curl -X POST http://localhost:8000/api/favorite/dua_001/
```

### Using Postman

1. Import the collection (if available)
2. Set base URL to `http://localhost:8000/api/`
3. Test individual endpoints

### Using Django REST Framework Browsable API

Visit any endpoint in your browser to see the interactive API interface.

## Support

For API support and questions:
- Check this documentation
- Review the README.md file
- Create an issue in the repository
- Contact the development team

## Version History

- **v1.0.0**: Initial release with basic CRUD operations and search functionality
