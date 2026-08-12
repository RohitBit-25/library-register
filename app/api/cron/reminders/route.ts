import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Member from '@/models/Member';
import AuditLog from '@/models/AuditLog';

// This route should be triggered daily via a Cron Job (e.g., Vercel Cron or AWS EventBridge)
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 1. Verify cron secret. Fail closed: the previous guard was skipped
    //    entirely when CRON_SECRET was unset, leaving this endpoint public.
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error('CRON_SECRET is not set — refusing to run the reminder job.');
      return NextResponse.json({ error: 'Not configured' }, { status: 503 });
    }
    if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // 2. Find members expiring exactly in 3 days
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + 3);
    
    // Format YYYY-MM-DD
    const targetDateStr = targetDate.toISOString().split('T')[0];

    // Find non-vacant members whose expiry is EXACTLY targetDateStr.
    // Plain equality, not $regex: expiry is stored as a bare YYYY-MM-DD string,
    // and $regex cannot use the { vacant, expiry } index.
    const membersToRemind = await Member.find({
      vacant: { $ne: true },
      expiry: targetDateStr,
    }).lean();

    if (membersToRemind.length === 0) {
      return NextResponse.json({ message: 'No members expire in exactly 3 days.' });
    }

    let notificationsSent = 0;

    // 3. Process each member (Simulated WhatsApp Integration)
    for (const member of membersToRemind) {
      if (!member.phone) continue;

      const message = `Hi ${member.name}, your library fee for Seat ${member.seat} expires in 3 days (${targetDateStr}). Please renew to keep your seat.`;
      
      // ====================================================================
      // TODO: Replace this block with your Twilio/Meta WhatsApp API call
      // Example using Twilio:
      // await twilioClient.messages.create({
      //   body: message,
      //   from: 'whatsapp:+14155238886',
      //   to: `whatsapp:+91${member.phone}`
      // });
      // ====================================================================

      console.log(`[WhatsApp API Simulated] Sending to ${member.phone}: ${message}`);
      notificationsSent++;
    }

    // 4. Log the action
    if (notificationsSent > 0) {
      await AuditLog.create({
        action: 'Automated Reminders',
        details: `Sent expiry reminder to ${notificationsSent} members.`,
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Simulated sending ${notificationsSent} WhatsApp reminders.` 
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
