import { daysUntil } from './seat-status.ts';
import { logInfo } from './log.ts';

// ─── Outbound notifications ─────────────────────────────────────
// One seam for every message the system sends. The cron previously inlined a
// console.log next to a TODO, so there was nowhere to plug a real provider in
// and no way for a caller to know whether a message actually went out.

export interface ReminderTarget {
  name: string;
  phone: string;
  seat: number;
  expiry: string;
  today?: string;
}

export type SendResult = { ok: true; via: string } | { ok: false; error: string };

export function buildExpiryMessage(t: ReminderTarget): string {
  const days = daysUntil(t.expiry, t.today);
  const when =
    days <= 0 ? 'expires today'
    : days === 1 ? 'expires tomorrow'
    : `expires in ${days} days`;

  return (
    `Hi ${t.name.split(' ')[0] || 'there'}, your Gangaur Library seat ` +
    `#${String(t.seat).padStart(2, '0')} ${when} (${t.expiry}). ` +
    `Please visit us to renew and keep your seat.`
  );
}

/** Digits only, with the country code, as WhatsApp/Twilio expect. */
export function normalisePhone(phone: string, countryCode = '91'): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return countryCode + digits;
  if (digits.length === 12 && digits.startsWith(countryCode)) return digits;
  return null;
}

/**
 * Send one expiry reminder.
 *
 * No provider is wired up yet, so this logs and reports which mode it ran in.
 * It deliberately returns a result rather than throwing or silently
 * succeeding: the cron only marks a member as reminded when `ok` is true, so
 * whatever replaces the stub here must report failure honestly or people will
 * be recorded as notified when they were not.
 *
 * To go live, implement the branch below (Twilio, Meta Cloud API, Gupshup…)
 * and return { ok: false, error } on a non-2xx response.
 */
export async function sendExpiryReminder(
  target: ReminderTarget,
  /** The reminder run's id, so a dry-run line greps out with the run's
   * failures rather than floating unattached in the log. */
  reqId?: string,
): Promise<SendResult> {
  const to = normalisePhone(target.phone);
  if (!to) return { ok: false, error: `Unusable phone number: ${target.phone}` };

  const body = buildExpiryMessage(target);

  if (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_API_TOKEN) {
    logInfo('reminder', 'dry-run — no WhatsApp provider configured', {
      reqId, to: `+${to}`, seat: target.seat, body,
    });
    return { ok: true, via: 'dry-run' };
  }

  try {
    const res = await fetch(process.env.WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body },
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `Provider returned ${res.status}: ${await res.text()}` };
    }
    return { ok: true, via: 'whatsapp' };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
