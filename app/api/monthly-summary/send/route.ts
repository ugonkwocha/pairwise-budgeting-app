import { NextResponse, type NextRequest } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

type AccessRow = {
  household_id: string | null;
  household_name: string | null;
  status: 'active' | 'invited' | 'removed' | null;
  role: 'primary' | 'member' | null;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return entities[char];
  });
}

function monthLabel(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getMonthBounds(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  const start = new Date(year, monthNumber - 1, 1);
  const end = new Date(year, monthNumber, 1);
  return {
    start: toIsoDate(start),
    end: toIsoDate(end),
  };
}

function card(label: string, value: string, accent: string) {
  return `
    <td style="width:25%;padding:8px">
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:16px">
        <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b">${label}</div>
        <div style="margin-top:12px;font-size:20px;font-weight:800;color:${accent}">${value}</div>
      </div>
    </td>
  `;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'You must be signed in to send monthly summaries' }, { status: 401 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'PairWise <team@mail.ugonkwocha.com>';

  if (!resendApiKey) {
    return NextResponse.json({ error: 'Email sending is not configured' }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const requestedMonth = typeof body?.month === 'string' ? body.month : '';
  const month = /^\d{4}-\d{2}$/.test(requestedMonth)
    ? requestedMonth
    : new Date().toISOString().slice(0, 7);

  const { data: accessRows, error: accessError } = await (supabase as any).rpc('get_my_household_access_status');
  if (accessError) {
    return NextResponse.json({ error: accessError.message || 'Unable to verify household access' }, { status: 500 });
  }

  const access = (accessRows as AccessRow[] | null)?.[0];
  if (!access?.household_id || access.status !== 'active') {
    return NextResponse.json({ error: 'No active household found' }, { status: 403 });
  }

  if (access.role !== 'primary') {
    return NextResponse.json({ error: 'Only primary members can send monthly summaries' }, { status: 403 });
  }

  const householdId = access.household_id;
  const monthBounds = getMonthBounds(month);
  const [
    householdResult,
    membersResult,
    categoriesResult,
    incomesResult,
    expensesResult,
    monthlyCategoriesResult,
    recurringResult,
  ] = await Promise.all([
    supabase.from('households').select('*').eq('id', householdId).single(),
    (supabase as any).from('budget_members').select('*').eq('household_id', householdId).order('created_at'),
    supabase.from('categories').select('*').eq('household_id', householdId),
    supabase.from('incomes').select('*').eq('household_id', householdId).gte('date', monthBounds.start).lt('date', monthBounds.end),
    supabase.from('expenses').select('*').eq('household_id', householdId).gte('date', monthBounds.start).lt('date', monthBounds.end),
    supabase.from('monthly_categories').select('*').eq('household_id', householdId).eq('month', month),
    (supabase as any).from('recurring_transactions').select('*').eq('household_id', householdId).eq('is_active', true).eq('type', 'expense'),
  ]);

  const error =
    householdResult.error ||
    membersResult.error ||
    categoriesResult.error ||
    incomesResult.error ||
    expensesResult.error ||
    monthlyCategoriesResult.error ||
    recurringResult.error;

  if (error) {
    return NextResponse.json({ error: error.message || 'Unable to build monthly summary' }, { status: 500 });
  }

  const household = householdResult.data as any;
  const currency = household.currency || 'USD';
  const incomes = incomesResult.data || [];
  const expenses = expensesResult.data || [];
  const categories = categoriesResult.data || [];
  const monthlyCategories = monthlyCategoriesResult.data || [];
  const recurring = recurringResult.data || [];
  const members = (membersResult.data || []) as any[];
  const recipients = members
    .filter((member) => member.auth_user_id && member.email)
    .map((member) => member.email as string);

  if (recipients.length === 0 && user.email) {
    recipients.push(user.email);
  }

  if (recipients.length === 0) {
    return NextResponse.json({ error: 'No active household member email addresses found' }, { status: 400 });
  }

  const totalIncome = incomes.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
  const totalSpending = expenses.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
  const totalBudgeted = monthlyCategories.reduce((sum: number, item: any) => (
    sum + Number(item.budget || 0) + Number(item.carry_over_amount || 0)
  ), 0);
  const remaining = totalIncome - totalSpending;

  const spentByCategory = expenses.reduce((acc: Record<string, number>, item: any) => {
    const categoryId = item.category_id || item.category_name || 'unknown';
    acc[categoryId] = (acc[categoryId] || 0) + Number(item.amount || 0);
    return acc;
  }, {});

  const overBudgetCategories = monthlyCategories
    .map((item: any) => {
      const category = categories.find((categoryItem: any) => categoryItem.id === item.category_id);
      const budget = Number(item.budget || 0) + Number(item.carry_over_amount || 0);
      const spent = spentByCategory[item.category_id] || 0;
      return {
        name: category?.name || 'Category',
        budget,
        spent,
        overBy: spent - budget,
      };
    })
    .filter((item) => item.budget > 0 && item.overBy > 0)
    .sort((a, b) => b.overBy - a.overBy);

  const today = new Date();
  const upcomingLimit = addDays(today, 30);
  const upcomingBills = recurring
    .filter((item: any) => item.next_due_date >= toIsoDate(today) && item.next_due_date <= toIsoDate(upcomingLimit))
    .sort((a: any, b: any) => String(a.next_due_date).localeCompare(String(b.next_due_date)))
    .slice(0, 8);

  const safeHouseholdName = escapeHtml(household.name || access.household_name || 'PairWise household');
  const safeMonth = escapeHtml(monthLabel(month));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const summaryUrl = `${appUrl}/dashboard`;

  const overBudgetHtml = overBudgetCategories.length > 0
    ? overBudgetCategories.map((item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-weight:700">${escapeHtml(item.name)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#475569;text-align:right">${formatMoney(item.spent, currency)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#dc2626;text-align:right;font-weight:700">${formatMoney(item.overBy, currency)} over</td>
        </tr>
      `).join('')
    : '<tr><td style="padding:14px 0;color:#64748b" colspan="3">No categories are over budget.</td></tr>';

  const upcomingBillsHtml = upcomingBills.length > 0
    ? upcomingBills.map((bill: any) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-weight:700">${escapeHtml(bill.name || bill.category_name || 'Bill')}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#475569">${escapeHtml(bill.next_due_date)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;text-align:right;font-weight:700">${formatMoney(Number(bill.amount || 0), currency)}</td>
        </tr>
      `).join('')
    : '<tr><td style="padding:14px 0;color:#64748b" colspan="3">No recurring bills are due in the next 30 days.</td></tr>';

  const subject = `${household.name || access.household_name || 'PairWise household'} monthly budget summary: ${monthLabel(month)}`;
  const text = [
    `${household.name} monthly budget summary for ${monthLabel(month)}`,
    '',
    `Income: ${formatMoney(totalIncome, currency)}`,
    `Spending: ${formatMoney(totalSpending, currency)}`,
    `Budgeted: ${formatMoney(totalBudgeted, currency)}`,
    `Remaining after spending: ${formatMoney(remaining, currency)}`,
    '',
    'Over-budget categories:',
    overBudgetCategories.length
      ? overBudgetCategories.map((item) => `- ${item.name}: ${formatMoney(item.spent, currency)} spent, ${formatMoney(item.overBy, currency)} over`).join('\n')
      : '- None',
    '',
    'Upcoming bills:',
    upcomingBills.length
      ? upcomingBills.map((bill: any) => `- ${bill.name}: ${formatMoney(Number(bill.amount || 0), currency)} due ${bill.next_due_date}`).join('\n')
      : '- None due in the next 30 days',
    '',
    summaryUrl,
  ].join('\n');

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#f7f9fd;padding:32px;color:#0f172a">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden">
        <div style="padding:28px 32px;border-bottom:1px solid #e2e8f0">
          <div style="font-size:18px;font-weight:800;color:#2563eb;letter-spacing:.04em;margin-bottom:24px">PAIRWISE</div>
          <h1 style="font-size:26px;line-height:1.25;margin:0">${safeHouseholdName} summary</h1>
          <p style="font-size:15px;color:#64748b;margin:8px 0 0">${safeMonth}</p>
        </div>
        <div style="padding:24px">
          <table role="presentation" style="width:100%;border-collapse:collapse;margin:0 -8px 20px">
            <tr>
              ${card('Income', formatMoney(totalIncome, currency), '#0f766e')}
              ${card('Spending', formatMoney(totalSpending, currency), '#ea580c')}
              ${card('Budgeted', formatMoney(totalBudgeted, currency), '#7c3aed')}
              ${card('Remaining', formatMoney(remaining, currency), remaining >= 0 ? '#0891b2' : '#dc2626')}
            </tr>
          </table>

          <h2 style="font-size:16px;margin:24px 0 8px">Over-budget categories</h2>
          <table style="width:100%;border-collapse:collapse">${overBudgetHtml}</table>

          <h2 style="font-size:16px;margin:28px 0 8px">Upcoming bills</h2>
          <table style="width:100%;border-collapse:collapse">${upcomingBillsHtml}</table>

          <a href="${escapeHtml(summaryUrl)}" style="display:inline-block;margin-top:28px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700">
            Open PairWise
          </a>
        </div>
      </div>
    </div>
  `;

  const resend = new Resend(resendApiKey);
  const { error: sendError } = await resend.emails.send({
    from,
    to: recipients,
    subject,
    text,
    html,
  });

  if (sendError) {
    return NextResponse.json({ error: sendError.message || 'Unable to send monthly summary' }, { status: 502 });
  }

  return NextResponse.json({ ok: true, recipients: recipients.length });
}
