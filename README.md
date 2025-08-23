# Budgeto - Student Finance App for Greece 🇬🇷

A comprehensive personal finance management application specifically designed for Greek students. Built with FastAPI, PostgreSQL, Next.js 19, and TypeScript.

## 🚀 Features Implemented

### 📱 Frontend (Next.js 19 + TypeScript + Tailwind CSS)
- **Authentication System**: Login, registration, and JWT-based authentication
- **Dashboard**: Real-time financial overview with current balance, budget progress, and gamification stats
- **Transaction Management**: 
  - View all transactions with filtering and pagination
  - Add transactions manually or via SMS parsing
  - Approve/reject pending transactions
  - Edit and delete transactions
- **Budget Management**: 
  - Create monthly budgets by category
  - Track spending progress with visual indicators
  - Edit and delete budgets
  - Monthly overview with total budget vs spent
- **Gamification/Stats**: 
  - XP system with levels and progress tracking
  - Achievement system with unlockable badges
  - Daily streak tracking
  - Progress visualization
- **Settings**: 
  - User profile management
  - Password change functionality
  - App preferences (notifications, SMS parsing, etc.)
  - Account deletion
- **Mobile-First Design**: Responsive design optimized for mobile devices
- **Navigation**: Bottom tab navigation for easy mobile access

### 🔧 Backend (FastAPI + SQLModel + PostgreSQL)
- **Authentication**: JWT-based authentication with refresh tokens
- **Database Models**: 
  - User management with archetypes (Allowance, Jobber, Traveler, Saver)
  - Transactions with categories, types, and states
  - Budgets with monthly tracking
  - Gamification with XP, levels, and achievements
- **API Endpoints**:
  - `/api/auth/*` - Authentication endpoints
  - `/api/transactions/*` - Transaction CRUD and filtering
  - `/api/budgets/*` - Budget management
  - `/api/gamification/*` - XP and achievement tracking
  - `/api/sms/*` - SMS parsing functionality
- **Greek SMS Parser**: Support for major Greek banks:
  - National Bank of Greece (NBG)
  - Eurobank
  - Alpha Bank
  - Piraeus Bank
  - IRIS Network
- **Gamification System**: 
  - XP awards for different actions
  - Level progression system
  - Achievement tracking
  - Daily streak calculations

### 🐳 Infrastructure
- **Docker Configuration**: Development environment setup
- **Database**: PostgreSQL with SQLModel/Alembic migrations
- **API Documentation**: Auto-generated Swagger/OpenAPI docs
- **CORS Configuration**: Proper frontend-backend communication

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 19 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom components
- **Icons**: Lucide React
- **HTTP Client**: Axios with interceptors
- **State Management**: React Context + useState/useEffect

### Backend
- **Framework**: FastAPI
- **ORM**: SQLModel (SQLAlchemy + Pydantic)
- **Database**: PostgreSQL
- **Authentication**: JWT tokens with python-jose
- **Validation**: Pydantic models
- **Documentation**: Auto-generated OpenAPI/Swagger

### Infrastructure
- **Containerization**: Docker with multi-service setup
- **Development**: Hot reload for both frontend and backend
- **Database Migrations**: Alembic integration

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)
- PostgreSQL (if running locally)

### Using Docker (Recommended)
```bash
# Clone the repository
cd micro-saas

# Start all services
docker-compose up -d

# The application will be available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8001
# API Docs: http://localhost:8001/docs
```

### Local Development

#### Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
alembic upgrade head

# Start the server
uvicorn main:app --reload --port 8001
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your API URL

# Start the development server
npm run dev
```

## 📱 Usage

### Demo Account
For testing purposes, use these demo credentials:
- **Username**: `demo_student`
- **Password**: `password123`

### User Flow
1. **Registration**: Create account with student archetype selection
2. **Dashboard**: View financial overview and quick stats
3. **Add Transactions**: 
   - Manual entry through the form
   - SMS parsing by pasting bank SMS messages
4. **Budget Management**: Set monthly spending limits by category
5. **Track Progress**: Monitor XP, levels, and achievements
6. **Settings**: Customize profile and app preferences

### SMS Parsing Examples
The app can parse SMS messages from Greek banks. Example formats:

**NBG (National Bank of Greece)**:
```
NBG: Αγορά 45.30 EUR στο SUPERMARKET ABC την 23/08/2025
```

**Eurobank**:
```
Eurobank: Πληρωμή 15.50 EUR - COFFEE SHOP XYZ
```

## 🏗️ Architecture

### Database Schema
- **Users**: Authentication and profile information
- **Transactions**: Financial transaction records
- **Budgets**: Monthly spending limits and goals
- **UserGamification**: XP, levels, and achievement tracking

### API Design
- RESTful endpoints with consistent naming
- JWT authentication on protected routes
- Comprehensive error handling
- Input validation with Pydantic
- Automatic API documentation

### Frontend Architecture
- Component-based architecture with reusable UI components
- Context-based authentication state management
- Mobile-first responsive design
- Type-safe API integration with TypeScript

## 🔐 Security Features
- JWT token-based authentication
- Password hashing with bcrypt
- CORS configuration for secure frontend-backend communication
- Input validation and sanitization
- SQL injection prevention through ORM

## 🎯 Target Users
- Greek university students
- Young adults managing finances
- Users familiar with mobile banking via SMS
- Gamification enthusiasts who enjoy progress tracking

## 📈 Future Enhancements
- Telegram bot integration
- Advanced analytics and insights
- Group challenges and social features
- Bank API integrations
- Receipt scanning with OCR
- Investment tracking
- Bill reminders and notifications

## 🤝 Contributing
This is an MVP implementation. Future contributions could include:
- Additional bank SMS patterns
- Enhanced gamification features
- Mobile app development (React Native)
- Advanced budgeting algorithms
- Integration with Greek payment systems

## 📄 License
This project is part of a student finance application MVP for the Greek market.

---

**Built with ❤️ for Greek students** 🇬🇷