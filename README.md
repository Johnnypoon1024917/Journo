# Journo - Travel Planning & Sharing Platform

A comprehensive travel planning and real-time journey sharing platform built with React, TypeScript, Node.js, and PostgreSQL.

## 🌟 Features

### Core Features
- 🗺️ **Interactive Trip Planning** - Day-by-day itinerary with Google Maps integration
- 🤝 **Real-time Collaboration** - Collaborative trip editing with live updates
- 📸 **Journey Sharing** - Share your travels with the community
- 💰 **Budget Tracking** - Multi-currency support with expense tracking
- 🎒 **Smart Packing Lists** - AI-powered packing suggestions
- 🌤️ **Weather Integration** - 7-day forecasts with automatic caching
- 🏆 **Badge System** - Earn achievements for your travels
- 🌐 **Offline Support** - PWA with offline capabilities
- 🌙 **Dark Mode** - Full dark mode support

### Advanced Features
- 🤖 **AI Destination Suggestions** - Personalized travel recommendations
- 🚀 **Quick Plan** - Instant trip creation from suggestions
- 📊 **Admin Dashboard** - Comprehensive analytics and management
- 🔒 **Enhanced Security** - JWT auth, rate limiting, audit logging
- 📱 **Mobile Optimized** - Touch-friendly responsive design

## 🚀 Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router
- **Maps**: Google Maps API
- **PWA**: Vite PWA Plugin
- **Testing**: Vitest + React Testing Library

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT with refresh tokens
- **Real-time**: Socket.IO
- **Caching**: Redis
- **Email**: SendGrid
- **Security**: Rate limiting, CSP headers, audit logging

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Development**: Hot reload, proxy configuration
- **Production**: Optimized builds, caching strategies

## 📚 Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[Current Project Status](docs/CURRENT_PROJECT_STATUS.md)** - Complete project overview
- **[UI Redesign Guide](docs/UI_REDESIGN_PREPARATION.md)** - UI redesign preparation
- **[Documentation Index](docs/README.md)** - Full documentation structure
- **[Test Credentials](LOGIN_TEST_CREDENTIALS.md)** - Test account credentials

## 🏁 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis (optional, for caching)
- Docker & Docker Compose (optional)

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd Journo
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. **Set up environment variables**
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your configuration
```

4. **Set up the database**
```bash
cd backend
npm run migrate
```

5. **Start the development servers**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/health

### Using Docker (Alternative)

```bash
docker-compose up
```

## 📁 Project Structure

```
Journo/
├── .kiro/                    # Kiro specs and configurations
│   └── specs/               # Feature specifications
├── backend/                  # Backend Node.js/Express application
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Database models
│   │   ├── migrations/      # Database migrations
│   │   └── utils/           # Utility functions
│   ├── uploads/             # User uploads
│   └── python_scraper/      # Python scraping service
├── frontend/                 # Frontend React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── stores/          # Zustand stores
│   │   ├── hooks/           # Custom hooks
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utility functions
│   │   └── design-system/   # Design system components
│   └── public/              # Static assets
├── docs/                     # Documentation
│   ├── archive/             # Historical documentation
│   ├── fixes/               # Bug fix documentation
│   ├── implementation/      # Implementation guides
│   └── *.md                 # Current documentation
├── README.md                # This file
├── LOGIN_TEST_CREDENTIALS.md # Test credentials
└── docker-compose.yml       # Docker services configuration
```

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm test
```

### Backend Tests
```bash
cd backend
npm test
```

### Test Credentials
See [LOGIN_TEST_CREDENTIALS.md](LOGIN_TEST_CREDENTIALS.md) for test account credentials.

## 🔧 Available Scripts

### Root Level
- `npm install` - Install all dependencies

### Frontend
- `npm run dev` - Start Vite dev server (port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run lint` - Lint code

### Backend
- `npm run dev` - Start development server with hot reload (port 5000)
- `npm run build` - Compile TypeScript
- `npm run start` - Start production server
- `npm run migrate` - Run database migrations
- `npm test` - Run tests
- `npm run lint` - Lint code

## 🌐 Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/journo

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Email (optional)
SENDGRID_API_KEY=your-sendgrid-key
FROM_EMAIL=noreply@journo.app

# External APIs
OPENWEATHER_API_KEY=your-openweather-key
GOOGLE_MAPS_API_KEY=your-google-maps-key

# Server
PORT=5000
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd frontend
npm run build

# Build backend
cd ../backend
npm run build
```

### Docker Deployment
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow the existing code style
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Google Maps API for mapping functionality
- OpenWeather API for weather data
- All open-source libraries used in this project

## 📞 Support

For support and questions:
- Check the [documentation](docs/)
- Review [current project status](docs/CURRENT_PROJECT_STATUS.md)
- Open an issue on GitHub

---

**Status**: ✅ Active Development  
**Version**: 1.0.0  
**Last Updated**: January 31, 2026
