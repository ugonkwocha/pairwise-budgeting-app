import { NextResponse, type NextRequest } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'You must be signed in to send an invite' }, { status: 401 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'PairWise <team@mail.ugonkwocha.com>';

  if (!resendApiKey) {
    return NextResponse.json({ error: 'Email sending is not configured' }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const to = String(body?.to || '').trim().toLowerCase();
  const name = String(body?.name || '').trim() || to.split('@')[0] || 'there';
  const householdName = String(body?.householdName || '').trim() || 'your household';
  const inviteUrl = String(body?.inviteUrl || '').trim();

  if (!isValidEmail(to)) {
    return NextResponse.json({ error: 'A valid recipient email is required' }, { status: 400 });
  }

  if (!inviteUrl.startsWith('https://') && !inviteUrl.startsWith('http://localhost')) {
    return NextResponse.json({ error: 'A valid invite link is required' }, { status: 400 });
  }

  const inviterName = user.user_metadata?.name || user.email?.split('@')[0] || 'A household member';
  const resend = new Resend(resendApiKey);

  const subject = `${inviterName} invited you to join ${householdName} on PairWise`;
  const safeTo = escapeHtml(to);
  const safeInviterName = escapeHtml(inviterName);
  const safeHouseholdName = escapeHtml(householdName);
  const safeInviteUrl = escapeHtml(inviteUrl);
  const text = [
    `Hi ${name},`,
    '',
    `${inviterName} invited you to join ${householdName} on PairWise.`,
    '',
    `Accept your invite: ${inviteUrl}`,
    '',
    'Use the same email address this invite was sent to when you sign up or sign in.',
  ].join('\n');

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#f7f9fd;padding:32px;color:#0f172a">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:32px">
        <div style="font-size:18px;font-weight:700;color:#2563eb;letter-spacing:.04em;margin-bottom:28px">PAIRWISE</div>
        <h1 style="font-size:24px;line-height:1.3;margin:0 0 12px">Join ${safeHouseholdName}</h1>
        <p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 24px">
          ${safeInviterName} invited you to join their household budget on PairWise.
        </p>
        <a href="${safeInviteUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700">
          Accept invite
        </a>
        <p style="font-size:13px;line-height:1.6;color:#64748b;margin:24px 0 0">
          Use <strong>${safeTo}</strong> when you sign up or sign in. This keeps the invite tied to the right household member.
        </p>
      </div>
    </div>
  `;

  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    text,
    html,
  });

  if (error) {
    return NextResponse.json({ error: error.message || 'Unable to send invite email' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
