import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AuditLog from '@/models/AuditLog';
import { verifyAdmin } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    // Fetch last 100 audit logs
    const logs = await AuditLog.find({}).sort({ timestamp: -1 }).limit(100).lean();
    return NextResponse.json(logs);
  } catch (error) {
    console.error('AuditLog GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
