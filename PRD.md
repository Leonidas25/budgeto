
---

# 📄  Budgeto (Student Finance App for Greece)  
**Version:** v1.0 (MVP-focused)  

---
## 1. Core Features & User Flows  

### 1.1 Expense & Income Tracking  
- **Input Methods:**  
  - Forward **bank/IRIS SMS** → auto-parsed into a *Pending transaction*.  
  - **Quick text entry** (in-app or via Telegram bot).  
- **Pending/Approved Workflow:**  
  - Transactions appear as **Pending** with auto-detected details (amount, suggested category).  
  - Student **swipes/approves/edits/deletes** to confirm.  
  - Pending transactions can optionally **reserve budget** until approved.  

**Flow:**  
1. User forwards SMS or sends quick text (“Coffee 3€” or “Allowance 200€”).  
2. System parses → creates transaction in Pending state.  
3. User reviews → Approves or edits.  
4. Approved transaction updates budget and insights.  

---

### 1.2 Budgeting  
- **Monthly Budget**: Student sets a recurring spending cap.  
- **Goal-Based Budget**: Create a savings target with deadline (e.g., “Rome trip, €400, 2 months”).  

**Flow (Goal Example):**  
1. User creates goal “Rome Trip, €400, 2 months.”  
2. Contributions tracked automatically as incomes/expenses are approved.  
3. Progress bar shows % completion until deadline.  

---

### 1.3 Categorization  
- **Automatic suggestions** (rules-based initially).  
- Student approves or overrides.  
- Categories: Food, Drinks, Rent, Transport, Travel, Shopping, Other.  
- Categories power insights and recommendations.  

---

### 1.4 Gamification (MVP-Light)  
- **Levels & XP:** Users earn XP by approving transactions and staying within budget.  
- **Streaks:** Daily/weekly streak for consistent tracking.  
- **Insights:** Weekly digest with funny but useful commentary (e.g., “5 freddos this week = 1 bus ticket to Thessaloniki 🚍”).  

---

## 2. Key Screens / Components  

1. **Onboarding & Setup**  
   - Choose archetype (Allowance, Jobber, Traveler, Saver).  
   - Set monthly budget.  

2. **Dashboard (Home)**  
   - Monthly budget progress bar.  
   - Pending transactions card (“3 waiting for approval”).  
   - Goal progress snapshot.  
   - Quick add button (+).  
   - Level & streak banner.  

3. **Transaction Inbox**  
   - Tabs: Pending | Approved.  
   - Swipe actions: Approve ✅ | Edit ✏️ | Delete ❌.  
   - Suggested category visible.  

4. **Budgets & Goals**  
   - Monthly budget tracker.  
   - Goals list (personal only in MVP).  
   - Goal detail page (progress bar, contributions).  

5. **Gamification & Insights**  
   - Level + streak tracker.  
   - Weekly insights card feed.  

6. **Settings**  
   - SMS Forwarding guide.  
   - Telegram bot link.  
   - Notification preferences.  

---

## 3. Data Requirements  

**Entities**  
- **User**: {id, archetype, name, email, level, streaks, preferences}  
- **Transaction**: {id, user_id, amount, type [income/expense], category, source [SMS/manual/bot], state [Pending/Approved], timestamp}  
- **Budget**: {id, user_id, type [Monthly/Goal], target_amount, deadline, current_progress}  
- **Gamification**: {user_id, xp, level, streak_count}  

**Data Sources**  
- SMS parsing from Greek banks + IRIS.  
- Manual entries from app or Telegram bot.  

**Data States**  
- **Pending** until user confirmation.  
- **Approved** updates budgets and gamification.  

---

## 4. Technology Considerations  

- **Frontend**:  
  - Web app (React + Tailwind).  
  - Mobile-first responsive design.  

- **Backend**:  
  - FastAPI (Python).  
  - PostgreSQL (transactions, budgets, users).  
  - Redis (optional, for caching/notifications).  

- **Bot Integration**:  
  - Telegram bot connected to backend API.  
  - User authentication via tokens.  

- **SMS Parsing (Greece only):**  
  - Regex-based detection of amounts, type (credit/debit), source.  
  - Supported: IRIS + major banks (NBG, Eurobank, Alpha, Piraeus).  

- **Security**:  
  - GDPR-compliant.  
  - Secure storage of financial data.  
  - Role-based access in backend.  

---

## 5. MVP Scope vs Future Enhancements  

### MVP Scope (Phase 1)  
- Web app (responsive, mobile-first).  
- Expense/income entry: SMS parsing + manual entry + Telegram bot.  
- Pending/Approved workflow.  
- Monthly + personal goal-based budgeting.  
- Basic categorization (rules).  
- Gamification: Levels, XP, streaks, weekly insights.  
- Dashboard, Inbox, Budgets/Goals, Insights screens.  

### Future Enhancements (Phase 2+)  
- Shared Vaults (group savings goals).  
- Bill Splitting with friend invites.  
- Extended gamification (badges, challenges, social leaderboards).  
- Bank API integrations (Plaid, Salt Edge, Greek banks).  
- iOS/Android apps with push notifications.  
- Rewards system (partnership discounts, brand deals).  
- Predictive analytics (AI-driven recommendations).  