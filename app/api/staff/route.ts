import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import Staff from '@/models/Staff';
import AuditLog from '@/models/AuditLog';
import { getSession } from '@/lib/auth-server';
import { createStaff, isPinTaken, listStaff, PIN_PATTERN } from '@/lib/pin-store';
import { formatZodError } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(40),
  pin: z.string().regex(PIN_PATTERN, 'PIN must be 4-8 digits'),
  role: z.enum(['owner', 'staff']).default('staff'),
});

const updateSchema = z.object({
  id: z.string().min(1),
  active: z.boolean(),
});

/** GET — list staff. Any signed-in member can see who else has access. */
export async function GET() {
  if (!await getSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const staff = await listStaff();
    // Never the pinHash. It is excluded by the projection in listStaff, but
    // stated here too because leaking it would be unrecoverable.
    return NextResponse.json(
      staff.map((s) => ({ ...s, id: String(s._id), _id: undefined })),
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Staff GET error:', error);
    return NextResponse.json({ error: 'Failed to load staff' }, { status: 500 });
  }
}

/** POST — add a staff member. Owner only. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'owner') {
    return NextResponse.json({ error: 'Only an owner can add staff' }, { status: 403 });
  }

  try {
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { name, pin, role } = parsed.data;

    // The PIN is the only identifier at sign-in, so a duplicate would make
    // both the login and the resulting audit trail ambiguous.
    if (await isPinTaken(pin)) {
      return NextResponse.json(
        { error: 'That PIN is already in use. Choose a different one.' },
        { status: 409 }
      );
    }

    const created = await createStaff(name, pin, role);
    await AuditLog.create({
      user: session.name,
      action: 'Added Staff',
      details: `${session.name} added ${created.name} as ${created.role}`,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Staff POST error:', error);
    return NextResponse.json({ error: 'Failed to add staff' }, { status: 500 });
  }
}

/** PATCH — activate or deactivate. Owner only. Never deletes. */
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'owner') {
    return NextResponse.json({ error: 'Only an owner can change access' }, { status: 403 });
  }

  try {
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { id, active } = parsed.data;

    await dbConnect();

    if (id === session.staffId && !active) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own account' },
        { status: 400 }
      );
    }

    // Locking out the last owner would leave nobody able to manage staff, and
    // no way back in short of editing the database by hand.
    if (!active) {
      const target = await Staff.findById(id).select('role name');
      if (!target) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
      if (target.role === 'owner') {
        const owners = await Staff.countDocuments({ role: 'owner', active: true });
        if (owners <= 1) {
          return NextResponse.json(
            { error: 'Cannot deactivate the last owner' },
            { status: 400 }
          );
        }
      }
    }

    const updated = await Staff.findByIdAndUpdate(id, { $set: { active } }, { new: true })
      .select('name role active');
    if (!updated) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });

    await AuditLog.create({
      user: session.name,
      action: active ? 'Reactivated Staff' : 'Deactivated Staff',
      details: `${session.name} ${active ? 'restored' : 'revoked'} access for ${updated.name}`,
    });

    return NextResponse.json({
      id: String(updated._id),
      name: updated.name,
      role: updated.role,
      active: updated.active,
    });
  } catch (error) {
    console.error('Staff PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 });
  }
}
