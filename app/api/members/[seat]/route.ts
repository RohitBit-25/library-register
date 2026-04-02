import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Member from '@/models/Member';

import { verifyAdmin } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ seat: string }> }) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { seat } = await params;
    const seatId = parseInt(seat, 10);
    const body = await request.json();
    
    await dbConnect();
    
    // Check if allotting a seat (vacant: false implies an allotment check)
    if (body.vacant === false) {
      const current = await Member.findOne({ seat: seatId });
      if (current && !current.vacant) {
        return NextResponse.json({ error: 'Seat is currently occupied' }, { status: 409 });
      }
    }

    const updatedMember = await Member.findOneAndUpdate(
      { seat: seatId },
      { $set: body },
      { new: true, upsert: true } // Upsert in case it was somehow deleted
    ).lean();
    
    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error(`Error updating member at seat:`, error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ seat: string }> }) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { seat } = await params;
    const seatId = parseInt(seat, 10);
    
    await dbConnect();
    
    const vacatedMember = await Member.findOneAndUpdate(
      { seat: seatId },
      { 
        $set: {
          name: '', phone: '', joinDate: '', duration: '', 
          expiry: '', fee: '', shift: 'morning', vacant: true,
          paymentMode: null, documentStatus: null, termsAccepted: null
        } 
      },
      { new: true }
    ).lean();
    
    if (!vacatedMember) {
        return NextResponse.json({ error: 'Seat not found' }, { status: 404 });
    }
    
    return NextResponse.json(vacatedMember);
  } catch (error) {
    console.error('Error vacating member:', error);
    return NextResponse.json({ error: 'Failed to vacate member' }, { status: 500 });
  }
}
