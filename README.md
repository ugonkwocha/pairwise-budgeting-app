# Pairwise - Household Budgeting App

A household budgeting application that helps families plan, track, and manage shared finances with real-time visibility and no spreadsheets needed.

## Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn
- A modern web browser

### Installation

1. Navigate to the project directory:
```bash
cd "/Users/ugonkwocha/Documents/PairWise Budgeting App"
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with BudgetProvider
│   ├── page.tsx                 # Redirect to onboarding or dashboard
│   ├── globals.css              # Global styles
│   ├── onboarding/page.tsx      # Onboarding wizard
│   └── dashboard/page.tsx       # Main dashboard (soon)
│
├── components/
│   ├── ui/                      # Reusable UI components
│   ├── onboarding/              # Onboarding wizard steps
│   ├── dashboard/               # Dashboard components (to be built)
│   ├── income/                  # Income tracking (to be built)
│   ├── expenses/                # Expense tracking (to be built)
│   └── ...
│
├── lib/
│   ├── storage/                 # localStorage persistence layer
│   ├── calculations/            # Business logic (budget calculations, alerts)
│   ├── contexts/BudgetContext   # Global state management
│   ├── hooks/                   # Custom React hooks
│   └── lifecycle/               # Monthly transitions, carry-over logic
│
└── types/index.ts               # TypeScript interfaces
```

## Features (MVP)

### ✅ Completed
- Project setup with Next.js 14, TypeScript, Tailwind CSS
- Type definitions for all data models
- localStorage persistence layer with CRUD operations
- Global BudgetContext for state management
- Onboarding wizard (6 steps):
  - Household creation
  - Member management
  - Currency selection
  - Income source definition
  - Category setup
  - Monthly budget allocation
- Basic Dashboard with metrics and category breakdown

### 🚧 In Progress
- Income tracking page
- Expense tracking page
- Real-time budget deductions
- Monthly lifecycle management

### 📋 To Do
- Category management page
- Savings goals tracking
- Alert system (80%, 100%, total exceeded)
- Reports and CSV/Excel export
- Responsive mobile optimization
- Dark mode support (Phase 2)
- Backend migration (Phase 2)

## Key Technologies

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Storage**: Browser localStorage
- **Charts**: Recharts (upcoming)
- **Utilities**: date-fns, clsx, framer-motion

## Usage

### First Time Setup
1. Start the app and you'll be redirected to the onboarding wizard
2. Create your household and add all members
3. Select your currency (USD, EUR, GBP, CAD, AUD, NGN)
4. Define income sources (Salary, Bonus, Other, etc.)
5. Create expense categories (Groceries, Utilities, Rent, etc.)
6. Set monthly budgets for each category
7. Complete setup and access the dashboard

### Recording Transactions
- **Income**: Track household income from various sources
- **Expenses**: Log expenses and they'll automatically deduct from category budgets
- **Real-time Updates**: All calculations update instantly, no page reload needed

### Budget Alerts
- ⚠️ **Warning**: 80% of budget reached
- 🔴 **Danger**: Budget exceeded
- System alerts are non-blocking and encouraging in tone

## Data Model

### Core Entities
- **Household**: Represents the family/group unit
- **Users**: Members with access to the household budget
- **Categories**: Expense categories with monthly budgets
- **Income**: Income entries with source tracking
- **Expenses**: Spending entries with category association
- **SavingsGoals**: Savings targets (separate from expenses)
- **Alerts**: Budget alerts and notifications

### Data Persistence
All data is stored in browser localStorage under the key `pairwise_budget_data`. Data structure:
- Version number for migrations
- Household and user information
- Categories and monthly budgets
- All income and expense transactions
- Savings goals and contributions
- Generated alerts

## Calculations & Logic

### Budget Summary
- **Total Income**: Sum of all income entries for the month
- **Total Budgeted**: Sum of all category budgets
- **Total Spent**: Sum of all expenses for the month
- **Remaining**: Total Income - Total Spent
- **Net Disposable Income**: Total Income - Total Budgeted

### Category Spending
- **Percentage**: (Spent / Budget) × 100
- **Status**:
  - Green (Healthy): < 80%
  - Yellow (Warning): 80-99%
  - Red (Danger): ≥ 100%

### Income Breakdown
- Shows percentage of income from each source
- Updates real-time as income entries are added

## Browser Compatibility
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Known Limitations (MVP)
- Single device only (data stored locally in browser)
- No cloud sync
- No user authentication
- Limited to ~5MB of localStorage data
- No offline/PWA capabilities yet

## Future Enhancements (Phase 2)
- Backend API with multi-device sync
- User authentication
- Expense categorization with AI
- Bank account sync
- Advanced reporting and forecasting
- Child accounts with limited visibility
- Dark mode
- Mobile app
- Bulk import/export

## Development

### Build for Production
```bash
npm run build
npm start
```

### Lint Code
```bash
npm run lint
```

## Troubleshooting

### Data Not Saving
- Check browser localStorage is enabled
- Clear browser cache and refresh
- Try a different browser

### Charts Not Showing
- Ensure JavaScript is enabled
- Check browser console for errors
- Try refreshing the page

### Onboarding Loop
- Clear localStorage key `pairwise_budget_data`
- Reload the page
- Go through onboarding again

## License
Private project

## Support
For issues or questions, check the implementation plan at `/Users/ugonkwocha/.claude/plans/valiant-exploring-harbor.md`
