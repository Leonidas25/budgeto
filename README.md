# Budgeto - Student Finance App for Greece 🇬🇷

A personal finance management application designed for Greek university students. Track expenses, manage budgets, and build healthy financial habits through gamification.

## ✨ Key Features

- **💰 Transaction Management**: Manual entry + Greek bank SMS parsing (NBG, Eurobank, Alpha, Piraeus, IRIS)
- **📊 Budget Tracking**: Monthly category-based budgets with progress visualization
- **🎮 Gamification**: XP system, achievements, daily streaks, and level progression
- **📱 Responsive UI**: Desktop/mobile view toggle with Mediterranean design
- **🔐 Secure Authentication**: JWT-based login with user archetypes
- **📈 Dashboard**: Real-time balance, spending insights, and progress stats

## 🛠️ Tech Stack

**Frontend**: Next.js 19, TypeScript, Tailwind CSS, Axios  
**Backend**: FastAPI, SQLModel, PostgreSQL, JWT Auth  
**Infrastructure**: Docker Compose, Nginx (production), Monitoring (Prometheus, Grafana)

## 🚀 Setup Instructions

### Prerequisites
- Docker & Docker Compose
- Git
- Linux VM (Ubuntu 20.04+ recommended) with 4GB+ RAM

### Development Setup

```bash
# Clone repository
git clone <your-repo-url>
cd budgeto

# Start development environment
docker compose up -d

# Access application:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8001
# API Docs: http://localhost:8001/docs
```

**Demo Credentials**: `demo` / `demo123`

### Production Deployment (VM)

```bash
# 1. Configure environment
cp .env.prod.example .env.prod
# Edit .env.prod with your production values

# 2. Deploy with monitoring
./deploy-prod.sh

# 3. Access services:
# App: http://your-domain.com
# Monitoring: http://your-domain.com:3001
```

**Production includes**: SSL-ready Nginx, monitoring (Prometheus/Grafana), automated backups, security hardening.

### VM Requirements
- **Development**: 2 CPU, 4GB RAM, 10GB disk
- **Production**: 4 CPU, 8GB RAM, 50GB disk
- **Ports**: 80, 443 (production), 3000, 8001 (development)

## 💡 Usage

1. **Login** with demo credentials or register new account
2. **Add transactions** manually or via Greek bank SMS parsing
3. **Set budgets** by category with monthly limits
4. **Track progress** through XP, achievements, and streaks
5. **Switch views** between mobile and desktop layouts

### Greek Bank SMS Support
```
NBG: Αγορά 45.30 EUR στο SUPERMARKET ABC την 23/08/2025
Eurobank: Πληρωμή 15.50 EUR - COFFEE SHOP XYZ
```

## 🔧 Management Commands

```bash
# View logs
docker compose logs -f [service]

# Stop services
docker compose down

# Production status
./deploy-prod.sh status

# Production logs
./deploy-prod.sh logs [service]
```

## 📚 Documentation

- **API Docs**: `/docs` endpoint (Swagger UI)
- **Production Guide**: `PRODUCTION.md`
- **Project Plan**: `BUDGETO_MVP_PLAN.md`
- **Requirements**: `PRD.md`

---

**Built for Greek students** 🇬🇷 | **Ready for production deployment**