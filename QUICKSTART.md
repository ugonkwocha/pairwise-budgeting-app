# Pairwise - Quick Start Guide

## Installation & Setup (5 minutes)

### 1. Install Dependencies
```bash
cd "/Users/ugonkwocha/Documents/PairWise Budgeting App"
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Open in Browser
Go to [http://localhost:3000](http://localhost:3000)

You'll automatically be redirected to the onboarding wizard.

## First Time Setup (5-10 minutes)

### Step 1: Household
- Enter your household name (e.g., "Smith Family")
- Click Next

### Step 2: Members
- Add primary account holder name and email
- Add additional family members who will manage finances
- At least 2 members recommended for shared accountability
- Click Next

### Step 3: Currency
- Select your currency (USD, EUR, GBP, NGN, CAD, AUD)
- This affects all financial displays
- Click Next

### Step 4: Income Sources
- Default sources included: Salary/Wages, Bonus, Other
- Add custom income sources (e.g., Freelance, Rental Income)
- Remove sources you don't need
- Click Next

### Step 5: Categories
- Default categories included: Groceries, Utilities, Rent, Transportation, Entertainment, Healthcare
- Modify or add new expense categories
- Examples: Gym, Subscriptions, Childcare, Pet Care
- Click Next

### Step 6: Budgets
- Set monthly budget for each category
- Toggle "Allow unused budget to carry over" if applicable
- Total budget shows at bottom
- Click "Complete Setup"

## Using the App

### Dashboard
- View 4 key metrics: Total Income, Budgeted, Spent, Remaining
- See category budget breakdown with progress bars
- View income source breakdown
- Check active budget alerts

### Add Income (Coming Soon)
- Navigate to Income page
- Record income from any source
- Updates dashboard totals instantly

### Add Expenses (Coming Soon)
- Navigate to Expenses page
- Record expenses with category
- Tag as "needs" or "wants"
- Automatically deducts from category budget
- Triggers alerts if approaching limits

### View Expenses
- Go to Expenses page
- See all recent expenses
- Filter by category or date (coming soon)

### Manage Categories
- Go to Categories page (coming soon)
- Adjust monthly budgets
- Toggle carry-over settings

### Track Savings
- Go to Savings page (coming soon)
- Create savings goals
- Add contributions
- Track progress toward each goal

## Key Features

### ✅ Real-Time Updates
- All calculations update instantly
- No page reload needed
- Changes sync to browser storage automatically

### ✅ Budget Alerts
- **80% Used**: Yellow warning appears
- **100% Exceeded**: Red danger alert
- **Total Exceeded**: Alert if total spending > total budget
- Alerts are non-blocking and encouraging

### ✅ Fully Offline
- Works without internet connection
- All data stored locally in browser
- No account or login required for MVP

### ✅ Multi-Member
- All household members see same data
- Track who logged each transaction
- Equal permissions (no admin restrictions)

### ✅ Monthly Management
- Automatic budget duplication at month start
- Optional carry-over of unused budget
- Monthly confirmation prompt (coming soon)

## Important Notes

### Data Storage
- **Stored in**: Browser localStorage
- **Key**: `pairwise_budget_data`
- **Size Limit**: ~5-10MB (usually enough for 2+ years of data)
- **Backup**: Manually export to CSV (coming soon)

### Limitations
- Single device only (no cloud sync in MVP)
- Data lost if you clear browser storage
- No user authentication
- No collaborative editing in real-time

### Browser Compatibility
- Chrome/Edge ✅
- Firefox ✅
- Safari ✅
- Mobile browsers ✅

## Troubleshooting

### App Won't Start
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Data Not Saving
- Check browser allows localStorage
- Try disabling privacy mode/incognito
- Check storage quota in browser DevTools

### Stuck on Onboarding
- Clear browser storage: DevTools > Application > localStorage > Clear All
- Refresh page and try again

### Performance Issues
- Try a different browser
- Close other tabs to free memory
- Check browser console for errors (F12)

## Production Build

### Build for Deployment
```bash
npm run build
npm start
```

This creates an optimized production build in the `.next` folder.

## Next Steps

1. **Complete Onboarding**: Set up your household
2. **Add Test Data**: Record some income/expenses
3. **Explore Dashboard**: Check budget breakdown
4. **Monitor Alerts**: Trigger warnings to see how they work
5. **Plan Expansion**: Read ROADMAP.md for upcoming features

## Support

For detailed technical documentation, see:
- [README.md](./README.md) - Full project documentation
- [IMPLEMENTATION_PLAN.md](../valiant-exploring-harbor.md) - Architecture and design
- Code comments in `/lib` and `/components`

## Tips

1. **Mobile Friendly**: Use on your phone for on-the-go expense logging
2. **Shared Device**: Works great on a shared family computer
3. **Regular Review**: Check dashboard weekly to stay on budget
4. **Honest Logging**: Log all expenses within 24 hours for accuracy
5. **Adjust Budgets**: Don't hesitate to adjust categories monthly based on actuals

Enjoy using Pairwise! 💰
