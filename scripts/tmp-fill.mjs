// Scratch helper: occupy every seat but the ones named, so the waitlist branch
// (whole library full) can be exercised against a real server.
import mongoose from 'mongoose';
import Member from '../models/Member.ts';

const leaveVacant = process.argv.slice(2).map(Number);
await mongoose.connect(process.env.MONGODB_URI);
await Member.updateMany({}, {
  $set: { name: 'Filler', phone: '9000000000', joinDate: '2026-08-01',
          duration: '3M', expiry: '2026-11-01', fee: 'paid', shift: 'full', vacant: false },
});
if (leaveVacant.length) {
  await Member.updateMany({ seat: { $in: leaveVacant } }, {
    $set: { name: '', phone: '', joinDate: '', duration: '', expiry: '', fee: '', vacant: true },
  });
}
console.log('occupied:', await Member.countDocuments({ vacant: false }),
            'vacant:', await Member.countDocuments({ vacant: true }));
await mongoose.disconnect();
