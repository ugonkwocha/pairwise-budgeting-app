# PostgreSQL Direct Connection Setup

This guide covers connecting your PairWise app directly to PostgreSQL on Coolify using Prisma ORM.

## Architecture

```
┌─────────────────────────────┐
│   Next.js App (Coolify)     │
│                             │
│   Uses Prisma ORM           │
└────────────┬────────────────┘
             │
             │ Direct Connection
             │
┌────────────▼────────────────┐
│   PostgreSQL Database       │
│   (Coolify Service)         │
│                             │
│   Tables: users, households,│
│   incomes, expenses, etc.   │
└─────────────────────────────┘
```

## Setup Steps

### Step 1: Database Connection

Your Coolify PostgreSQL credentials:
- **Host**: `localhost` (for development) or `BudgetingApp DB` (Coolify internal)
- **Port**: `5432`
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: `doQQOu7ZAzprjMD6rN9rTce7K7UBNoKs`

### Step 2: Initialize Prisma

The Prisma schema is already created at `prisma/schema.prisma`.

#### Generate Prisma Client

```bash
npx prisma generate
```

#### Create Database Tables (Migration)

Run the Prisma migration to create all tables:

```bash
npx prisma migrate dev --name init
```

This will:
1. Create all tables in PostgreSQL
2. Generate Prisma client
3. Create a migration file in `prisma/migrations/`

#### View Database (Optional)

Open Prisma Studio to browse your database:

```bash
npx prisma studio
```

This opens a UI at `http://localhost:5555` to view and edit data.

### Step 3: Environment Variables

Your `.env.local` is already configured. For production on Coolify, update:

```env
# For Coolify internal network
DATABASE_URL=postgresql://postgres:password@postgres-service-name:5432/postgres

# Or using IP (if network allows)
DATABASE_URL=postgresql://postgres:password@157.180.36.81:5432/postgres
```

### Step 4: Database Utilities

The database client is set up in `lib/db.ts` and is ready to use.

---

## Using Prisma in Your Code

### Server Actions & API Routes

```typescript
// lib/db.ts - Already configured
import { db } from '@/lib/db';

// Example: Get household with all data
export async function getHousehold(householdId: string) {
  const household = await db.household.findUnique({
    where: { id: householdId },
    include: {
      members: true,
      incomes: true,
      expenses: true,
      categories: true,
    },
  });
  return household;
}

// Example: Create a user
export async function createUser(email: string, name: string, password: string) {
  const user = await db.user.create({
    data: {
      email,
      name,
      password, // Remember: hash this with bcrypt!
    },
  });
  return user;
}

// Example: Get user incomes
export async function getUserIncomes(userId: string, householdId: string) {
  const incomes = await db.income.findMany({
    where: {
      userId,
      householdId,
    },
    orderBy: { date: 'desc' },
  });
  return incomes;
}
```

### Type Safety

Prisma generates types automatically:

```typescript
import type { User, Household, Income } from '@prisma/client';

// TypeScript will catch errors
const user: User = {
  // ... required fields
};
```

---

## Database Schema

The Prisma schema includes 10 models:

1. **User** - User accounts (email, password, name)
2. **Household** - Budget groups
3. **HouseholdMember** - Users in households
4. **Invite** - Pending invitations
5. **IncomeSource** - Income categories (Salary, Freelance, etc.)
6. **Income** - Income transactions
7. **Category** - Expense categories
8. **MonthlyCategory** - Monthly budget allocations
9. **Expense** - Expense transactions
10. **SavingsGoal** - Savings goals
11. **SavingsContribution** - Savings progress
12. **Alert** - Budget alerts

All relationships are set up for easy querying.

---

## Common Tasks

### Get all expenses for a household in a month

```typescript
const expenses = await db.expense.findMany({
  where: {
    householdId,
    date: {
      gte: new Date('2026-02-01'),
      lt: new Date('2026-03-01'),
    },
  },
  include: {
    category: true,
    user: true,
  },
  orderBy: { date: 'desc' },
});
```

### Create a new income

```typescript
const income = await db.income.create({
  data: {
    householdId,
    amount: new Decimal('5000.00'),
    sourceId,
    sourceName,
    userId,
    userName,
    date: new Date('2026-02-08'),
  },
});
```

### Update category budget

```typescript
const monthly = await db.monthlyCategory.update({
  where: {
    householdId_categoryId_month: {
      householdId,
      categoryId,
      month: '2026-02',
    },
  },
  data: {
    budget: new Decimal('1500.00'),
  },
});
```

---

## Development Workflow

### After schema changes

1. **Update** `prisma/schema.prisma`
2. **Run migration**:
   ```bash
   npx prisma migrate dev --name description_of_change
   ```
3. **Types regenerate** automatically
4. **Deploy** migration file with your code

### Production migrations on Coolify

The migration files in `prisma/migrations/` are auto-applied when deploying:

```bash
# Coolify runs this on deploy
npx prisma migrate deploy
```

---

## Authentication Setup Next

Currently:
- ✅ Database connected
- ✅ Prisma ORM configured
- ❌ Authentication not yet wired up

When ready, we'll implement:
1. Password hashing (bcrypt)
2. Login API route
3. Session management
4. Wire up auth pages to database

---

## Troubleshooting

### Connection Refused

```
Error: getaddrinfo ENOTFOUND localhost
```

**Fix:**
- Verify PostgreSQL is running
- Check DATABASE_URL in .env.local
- For Coolify, use internal service name

### Migration Error: Relation already exists

```
Error: relation "users" already exists
```

**Fix:**
- Database already has tables
- Either:
  - Use existing tables (connect to schema)
  - Or drop and recreate: `npx prisma migrate reset`

### Type Errors

```
Type 'string' is not assignable to type 'Decimal'
```

**Fix:**
- Use `new Decimal()` for money fields:
  ```typescript
  amount: new Decimal('100.00')
  ```

---

## Next Steps

1. ✅ Prisma schema created
2. ✅ Database connected
3. ⏳ Run migrations to create tables
4. ⏳ Create authentication with bcrypt
5. ⏳ Update API routes to use database
6. ⏳ Connect auth pages to database

---

## Resources

- [Prisma Docs](https://www.prisma.io/docs/)
- [Prisma Query Examples](https://www.prisma.io/docs/orm/prisma-client/queries/crud)
- [Prisma Migrations](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/overview)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
