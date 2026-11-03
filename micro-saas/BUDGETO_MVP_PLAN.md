# 📄 Budgeto MVP Development Plan
**Student Finance App for Greece - Complete Implementation Guide**

---

## 🎯 Project Overview

**Goal**: Build a mobile-first web application that helps Greek students manage their finances through SMS parsing, expense tracking, budgeting, and gamification.

**Tech Stack**:
- **Frontend**: React 19 + Next.js App Router + Tailwind CSS
- **Backend**: FastAPI (Python) + SQLModel
- **Database**: PostgreSQL
- **Bot**: Telegram Bot API
- **Deployment**: Docker + Docker Compose

---

## 📋 Phase 1: Project Setup & Infrastructure (Week 1)

### 1.1 Environment Setup
```
budgeto/
├── frontend/          # React app
├── backend/           # FastAPI app
├── telegram-bot/      # Bot service
├── database/          # DB migrations & seeds
├── docker/            # Docker configs
└── docs/              # Documentation
```

**Tasks:**
- [ ] Initialize FastAPI project with SQLModel and PostgreSQL
- [ ] Set up React 19 + Next.js App Router + Tailwind CSS (mobile-first)
- [ ] Configure Docker development environment
- [ ] Implement JWT authentication system
- [ ] Set up CORS and security measures

### 1.2 Key Dependencies
**Backend**: `fastapi sqlmodel psycopg2-binary python-multipart alembic`
**Frontend**: `axios react-hook-form @hookform/resolvers zod`
**Next.js Setup**: `npm create next-app@latest --typescript --tailwind --app`

---

## 📊 Phase 2: Core Data Models & Database (Week 2)

### 2.1 Database Schema
```python
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    full_name: str
    archetype: str  # "Allowance", "Jobber", "Traveler", "Saver"
    telegram_id: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Transaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    amount: Decimal = Field(decimal_places=2)
    type: TransactionType  # "income" | "expense"
    category: TransactionCategory = Field(default="Other")
    description: Optional[str] = None
    source: TransactionSource  # "SMS" | "Manual" | "Telegram"
    state: TransactionState = Field(default="Pending")  # "Pending" | "Approved"
    original_sms: Optional[str] = None
    suggested_category: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class Budget(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    type: BudgetType  # "Monthly" | "Goal"
    name: str
    target_amount: Decimal = Field(decimal_places=2)
    current_amount: Decimal = Field(default=0, decimal_places=2)
    deadline: Optional[date] = None
    is_active: bool = True

class UserGamification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True)
    xp: int = Field(default=0)
    level: int = Field(default=1)
    streak_count: int = Field(default=0)
    last_activity: Optional[date] = None
```

**Tasks:**
- [ ] Create all database models with relationships
- [ ] Set up Alembic migrations
- [ ] Create database indexes for performance
- [ ] Add seed data for testing

---

## 🔧 Phase 3: Backend API Development (Week 3-4)

### 3.1 Core API Endpoints
```python
# Authentication
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
GET /api/users/me

# Transactions
GET /api/transactions/          # List with pagination & filters
POST /api/transactions/         # Create new transaction
PUT /api/transactions/{id}      # Update transaction
DELETE /api/transactions/{id}   # Delete transaction
POST /api/transactions/{id}/approve    # Approve pending
GET /api/transactions/pending          # Get pending

# Budgets
GET /api/budgets/               # List user budgets
POST /api/budgets/              # Create new budget
GET /api/budgets/{id}/progress  # Get budget progress

# SMS Processing
POST /api/sms/parse             # Parse forwarded SMS

# Gamification
GET /api/gamification/me        # User's gamification stats
GET /api/gamification/insights  # Weekly insights
```

### 3.2 SMS Parsing Service
```python
class GreekSMSParser:
    BANK_PATTERNS = {
        'NBG': r'NBG.*?(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)',
        'EUROBANK': r'Eurobank.*?(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)',
        'ALPHA': r'Alpha Bank.*?(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)',
        'PIRAEUS': r'Piraeus.*?(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)',
        'IRIS': r'IRIS.*?(\d+[,\.]\d{2}).*?EUR.*?([\w\s]+)'
    }
    
    def parse_sms(self, sms_text: str) -> ParsedTransaction:
        """Parse Greek bank SMS with category suggestion"""
```

**Tasks:**
- [ ] Implement all CRUD endpoints with proper validation
- [ ] Create SMS parsing for Greek banks + IRIS
- [ ] Add business logic services (Budget, Gamification)
- [ ] Set up FastAPI automatic documentation
- [ ] Write comprehensive API tests

---

## 🎨 Phase 4: Frontend Development (Week 5-7)

### 4.1 Next.js App Router Structure
```jsx
// App Router structure (app directory)
app/
├── layout.tsx                    # Root layout
├── page.tsx                      # Dashboard (Home)
├── onboarding/
│   └── page.tsx                  # User setup & archetype selection
├── transactions/
│   ├── page.tsx                  # Transaction management
│   └── pending/
│       └── page.tsx              # Pending transactions (swipe interface)
├── budgets/
│   └── page.tsx                  # Budget & goals management
├── gamification/
│   └── page.tsx                  # Stats, level, insights
└── settings/
    └── page.tsx                  # User settings
```

### 4.2 Key Components (Mobile-First with Next.js)
```tsx
// app/page.tsx - Dashboard
export default function Dashboard() {
  return (
    <div className="space-y-6 p-4">
      <MonthlyBudgetProgress />
      <PendingTransactionsCard count={3} />
      <GoalsSnapshot />
      <QuickAddButton />
      <LevelStreakBanner />
    </div>
  )
}

// app/transactions/page.tsx - Transaction Inbox with Swipe Actions
'use client'

export default function TransactionInbox() {
  return (
    <div className="h-screen flex flex-col">
      <TabNavigation tabs={["Pending", "Approved"]} />
      <SwipeableTransactionList />
    </div>
  )
}

const SwipeableTransaction = ({ transaction }: { transaction: Transaction }) => (
  <SwipeableCard
    onSwipeRight={() => approveTransaction(transaction.id)}
    onSwipeLeft={() => deleteTransaction(transaction.id)}
    className="mb-3 p-4 bg-white rounded-lg shadow"
  >
    <TransactionDetails transaction={transaction} />
    <SuggestedCategory category={transaction.suggested_category} />
  </SwipeableCard>
)
```

### 4.3 Next.js + Tailwind CSS Setup
```bash
# Create Next.js project with Tailwind CSS
npm create next-app@latest budgeto-frontend --typescript --tailwind --app
cd budgeto-frontend
npm install axios react-hook-form @hookform/resolvers zod
```

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#f0f9ff', 500: '#3b82f6', 600: '#2563eb' },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444'
      }
    }
  },
  plugins: [],
}
```

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-100 text-gray-900;
}
```

**Tasks:**
- [ ] Set up Next.js project with App Router and TypeScript
- [ ] Configure Tailwind CSS with mobile-first approach  
- [ ] Create root layout with navigation and middleware
- [ ] Implement authentication flow with Next.js middleware
- [ ] Build transaction pages with client-side interactivity ('use client')
- [ ] Create budget management interface with server components
- [ ] Develop gamification dashboard with real-time data
- [ ] Add custom hooks for API integration
- [ ] Set up API routes for frontend-backend communication
- [ ] Implement Progressive Web App (PWA) features
- [ ] Configure server-side rendering for optimal performance

---

## 🤖 Phase 5: Telegram Bot Integration (Week 8)

### 5.1 Bot Commands
```python
class BudgetoBot:
    def setup_handlers(self):
        self.app.add_handler(CommandHandler("start", self.start))
        self.app.add_handler(CommandHandler("add", self.add_transaction))
        self.app.add_handler(CommandHandler("budget", self.show_budget))
        self.app.add_handler(CommandHandler("stats", self.show_stats))
        self.app.add_handler(MessageHandler(
            filters.TEXT & ~filters.COMMAND, 
            self.parse_natural_language
        ))
    
    async def add_transaction(self, update, context):
        """Handle: /add Coffee 3€"""
        
    async def parse_natural_language(self, update, context):
        """Parse: 'Lunch at taverna 15 euros'"""
```

**Tasks:**
- [ ] Set up Telegram bot with webhooks
- [ ] Implement core commands (/start, /add, /budget, /stats)
- [ ] Add natural language transaction parsing
- [ ] Create user linking mechanism
- [ ] Test bot integration with API

---

## 🎮 Phase 6: Gamification System (Week 9)

### 6.1 XP & Leveling
```python
XP_REWARDS = {
    'transaction_approved': 10,
    'daily_login': 5,
    'week_streak': 25,
    'budget_goal_met': 50,
    'month_tracking_complete': 100
}

LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 30000]

def calculate_level(xp: int) -> int:
    for level, threshold in enumerate(LEVEL_THRESHOLDS):
        if xp < threshold:
            return level - 1
    return len(LEVEL_THRESHOLDS) - 1
```

### 6.2 Weekly Insights (Greek-Themed)
```python
class InsightGenerator:
    GREEK_MESSAGES = {
        'high_food_spending': [
            "Your taverna visits could fund a small Greek island! 🏝️",
            "You're eating like Dionysus but budgeting like a mortal! 🍷"
        ],
        'good_budgeting': [
            "Your budgeting skills are more legendary than Odysseus! ⚓",
            "Even ancient Greeks would applaud this financial wisdom! 🏛️"
        ]
    }
    
    def generate_weekly_insights(self, user_id: int) -> List[Insight]:
        """Generate funny and useful weekly insights"""
```

**Tasks:**
- [ ] Implement XP system with level calculation
- [ ] Create streak tracking mechanism
- [ ] Build weekly insight generation with Greek humor
- [ ] Design gamification UI components
- [ ] Add achievement system

---

## 🧪 Phase 7: Testing & Quality Assurance (Week 10)

### 7.1 Testing Strategy
```python
# Backend Tests
def test_sms_parsing_greek_banks():
    """Test SMS parsing for all Greek banks"""

def test_transaction_approval_workflow():
    """Test pending -> approved flow"""

def test_budget_progress_calculation():
    """Test budget math and alerts"""

def test_gamification_xp_awards():
    """Test XP calculation and level progression"""
```

```jsx
// Frontend Tests
describe('Transaction Swipe Actions', () => {
  test('swipe right approves transaction', () => {})
  test('swipe left deletes transaction', () => {})
})

describe('Budget Progress', () => {
  test('displays correct progress percentage', () => {})
  test('shows warning when approaching limit', () => {})
})
```

**Tasks:**
- [ ] Write comprehensive backend unit tests
- [ ] Add frontend component testing
- [ ] Test SMS parsing with real Greek bank SMS samples
- [ ] Performance testing for mobile devices
- [ ] Security testing and vulnerability assessment

---

## 🚀 Phase 8: Deployment & Launch (Week 11)

### 8.1 Production Setup
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    environment:
      - NODE_ENV=production
  
  backend:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql://...
      - JWT_SECRET_KEY=...
  
  database:
    image: postgres:15
    environment:
      - POSTGRES_DB=budgeto
      - POSTGRES_USER=...
      - POSTGRES_PASSWORD=...
  
  redis:
    image: redis:7-alpine
```

### 8.2 Launch Checklist
- [ ] Set up production environment (AWS/DigitalOcean)
- [ ] Configure SSL certificates
- [ ] Set up monitoring and logging
- [ ] Create backup strategy for database
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Create user documentation
- [ ] Set up analytics tracking

---

## 📱 MVP Features Summary

### Core Features ✅
1. **User Onboarding**: Archetype selection, monthly budget setup
2. **Transaction Management**: SMS parsing, pending/approved workflow, swipe actions
3. **Budgeting**: Monthly budgets, goal-based savings targets
4. **Telegram Bot**: Natural language transaction entry
5. **Gamification**: XP, levels, streaks, weekly Greek-themed insights
6. **Mobile-First UI**: Responsive design optimized for smartphones

### Greek Market Specific ✅
1. **SMS Parsing**: NBG, Eurobank, Alpha, Piraeus, IRIS support
2. **Euro Currency**: Proper formatting and calculations
3. **Greek Language**: Localized categories and insights
4. **Cultural Elements**: Greek-themed gamification messages

### Technical Excellence ✅
1. **Modern Stack**: React 19, Next.js App Router, FastAPI, PostgreSQL
2. **Mobile Performance**: Server-side rendering, optimized for mobile, PWA-ready
3. **Security**: JWT auth, input validation, SQL injection prevention
4. **Testing**: Comprehensive test coverage
5. **Documentation**: API docs, user guides
6. **Next.js Benefits**: Server components, automatic code splitting, built-in optimization

---

## 🎯 Success Metrics

### User Engagement
- **Daily Active Users**: Target 70%+ of registered users
- **Transaction Approval Rate**: >85% of pending transactions
- **Streak Retention**: 30%+ users maintain weekly streaks

### Feature Adoption
- **SMS Integration**: 60%+ users set up SMS forwarding
- **Bot Usage**: 40%+ users try Telegram bot
- **Goal Creation**: 50%+ users create savings goals

### Technical Performance
- **Mobile Load Time**: <3 seconds on 3G
- **API Response Time**: <200ms average
- **Uptime**: 99.5% availability

---

## 🚀 Why Next.js for Budgeto MVP?

### Next.js Advantages for Mobile-First Finance App
1. **Server-Side Rendering (SSR)**: Faster initial page loads on mobile devices, crucial for user retention
2. **App Router**: Built-in routing with file-system based approach, perfect for our mobile-first navigation
3. **Server Components**: Reduce JavaScript bundle size, improving performance on low-end devices
4. **Built-in API Routes**: Simplified backend integration without needing separate routing setup
5. **Automatic Code Splitting**: Only load necessary code per page, essential for mobile performance
6. **Image Optimization**: Built-in image optimization for faster loading of icons and graphics
7. **Progressive Web App (PWA)**: Easy setup for native app-like experience
8. **TypeScript Support**: Better development experience with type safety
9. **Middleware**: Perfect for implementing authentication checks and redirects
10. **Edge Runtime**: Deploy globally for faster response times in Greece and Europe

### Technical Benefits vs Vite
- **Zero Config**: No complex webpack configuration needed
- **Production Ready**: Built-in optimizations for production deployment
- **SEO Friendly**: Server-side rendering improves search engine visibility
- **Better Mobile Performance**: SSR reduces Time to Interactive (TTI)
- **Deployment Integration**: Seamless deployment with Vercel or other platforms

---

This MVP plan provides a comprehensive roadmap for building Budgeto from start to finish, with detailed technical specifications, time estimates, and clear deliverables for each phase. The focus on mobile-first design, Greek market specifics, and gamification will create a unique and engaging financial app for Greek students.