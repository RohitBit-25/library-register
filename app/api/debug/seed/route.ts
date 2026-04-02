import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Member from '@/models/Member';
import { getDefaultMembers } from '@/lib/defaultData';

export async function GET() {
  try {
    await dbConnect();
    
    // Clear existing
    await Member.deleteMany({});
    
    // Insert default data
    const defaultData = getDefaultMembers();
    await Member.insertMany(defaultData);
    
    return NextResponse.json({ message: 'Database seeded successfully', count: defaultData.length });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}
