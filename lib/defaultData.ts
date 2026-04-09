import { type Member } from './types';

function makeDynamicMember(
  seat: number,
  name: string,
  phone: string,
  duration: '1M' | '3M' | '6M' | '1Y',
  fee: 'paid' | 'due',
  shift: 'morning' | 'evening' | 'full',
  daysOffset: number // offset for expiry relative to today
): Member {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const expiry = d.toISOString().split('T')[0];

  // Approximate joinDate based on duration backwards from expiry
  const prevD = new Date(d);
  if (duration === '1M') prevD.setMonth(prevD.getMonth() - 1);
  else if (duration === '3M') prevD.setMonth(prevD.getMonth() - 3);
  else if (duration === '6M') prevD.setMonth(prevD.getMonth() - 6);
  else if (duration === '1Y') prevD.setFullYear(prevD.getFullYear() - 1);
  const joinDate = prevD.toISOString().split('T')[0];

  return { seat, name, phone, joinDate, duration, expiry, fee, shift, vacant: false };
}

function makeVacant(seat: number): Member {
  return {
    seat, name: '', phone: '', joinDate: '', duration: '',
    expiry: '', fee: '', shift: 'morning', vacant: true,
  };
}

export function getDefaultMembers(): Member[] {
  // Generate dynamically relative to today
  return [
    // Active (offset > 7)
    makeDynamicMember(1, 'Shivani Lakhara', '9876543210', '6M', 'paid', 'morning', 45),
    makeDynamicMember(2, 'Sapna Kanwar', '9876543211', '3M', 'paid', 'morning', 14),
    makeVacant(3),
    makeVacant(4),
    
    // Expiring (0 to 7)
    makeDynamicMember(5, 'Mithlesh', '9876543212', '1M', 'paid', 'morning', 5),
    makeVacant(6),
    makeDynamicMember(7, 'Sejal Parihar', '9876543213', '3M', 'paid', 'morning', 2),
    makeVacant(8),
    makeVacant(9),
    
    // Active
    makeDynamicMember(10, 'Chetana Mehta', '9876543214', '6M', 'paid', 'morning', 60),
    makeVacant(11),
    
    // Fee Due
    makeDynamicMember(12, 'Bittu', '9876543215', '1M', 'due', 'morning', 15),
    makeDynamicMember(13, 'Kumawat', '9876543216', '1M', 'due', 'morning', 10),
    makeVacant(14),
    
    // Expiring
    makeDynamicMember(15, 'Nikita Sharma', '9876543217', '3M', 'paid', 'morning', 0),
    
    // Active
    makeDynamicMember(16, 'Alok Raj', '9876543218', '6M', 'paid', 'morning', 30),
    makeDynamicMember(17, 'Ravi Kiran', '9876543219', '1M', 'paid', 'evening', 25),
    makeVacant(18),
    
    // Expired (offset < 0)
    makeDynamicMember(19, 'Priya Gupta', '9876543220', '3M', 'paid', 'evening', -4),
    makeDynamicMember(20, 'Ankit Verma', '9876543221', '1Y', 'paid', 'full', -10),
    
    makeDynamicMember(21, 'Pooja Yadav', '9876543222', '1M', 'paid', 'morning', 12),
    makeDynamicMember(22, 'Deepak Soni', '9876543223', '3M', 'paid', 'morning', 8),
    makeVacant(23),
    makeDynamicMember(24, 'Kavita Jain', '9876543224', '6M', 'paid', 'evening', 22),
    makeDynamicMember(25, 'Rahul Sharma', '9876543225', '3M', 'paid', 'morning', 40),
    makeVacant(26),
    
    // Expiring
    makeDynamicMember(27, 'Sunita Devi', '9876543226', '3M', 'paid', 'morning', 3),
    makeDynamicMember(28, 'Hari Singh', '9876543227', '1Y', 'paid', 'full', 6),
    
    makeDynamicMember(29, 'Meena Kumari', '9876543228', '1M', 'paid', 'evening', 18),
    makeDynamicMember(30, 'Vijay Patel', '9876543229', '3M', 'paid', 'morning', 21),
    makeVacant(31),
    
    // Expired
    makeDynamicMember(32, 'Neha Tiwari', '9876543230', '6M', 'paid', 'morning', -2),
    makeDynamicMember(33, 'Rohit Singh', '9876543231', '1M', 'paid', 'morning', -1),
    
    makeVacant(34),
    makeDynamicMember(35, 'Anjali Mishra', '9876543232', '3M', 'paid', 'evening', 110),
    makeDynamicMember(36, 'Manoj Kumar', '9876543233', '6M', 'paid', 'full', 80),
    makeVacant(37),
    makeDynamicMember(38, 'Rekha Bai', '9876543234', '1M', 'paid', 'morning', 16),
    makeDynamicMember(39, 'Suresh Nagar', '9876543235', '3M', 'paid', 'morning', 44),
    makeDynamicMember(40, 'Lata Pandey', '9876543236', '6M', 'paid', 'morning', 34),
    makeVacant(41),
    
    // Fee Due
    makeDynamicMember(42, 'Gopal Das', '9876543237', '1M', 'due', 'morning', 28),
    makeDynamicMember(43, 'Kamla Devi', '9876543238', '3M', 'paid', 'evening', 55),
    makeVacant(44),
    makeDynamicMember(45, 'Ramesh Chandra', '9876543239', '1Y', 'paid', 'full', 200),
    makeDynamicMember(46, 'Sita Ram', '9876543240', '1M', 'paid', 'morning', 19),
    makeVacant(47),
    makeDynamicMember(48, 'Geeta Rani', '9876543241', '3M', 'paid', 'morning', 77),
    makeDynamicMember(49, 'Ashok Thakur', '9876543242', '6M', 'paid', 'morning', 99),
    
    // Expiring
    makeDynamicMember(50, 'Radha Kumari', '9876543243', '1M', 'paid', 'evening', 4),
    makeVacant(51),
    makeDynamicMember(52, 'Dinesh Rao', '9876543244', '3M', 'paid', 'morning', 29),
    makeDynamicMember(53, 'Urmila Sahu', '9876543245', '6M', 'paid', 'morning', 140),
    makeVacant(54),
    
    // Fee Due & Expired (but fee due takes precedence currently)
    makeDynamicMember(55, 'Jyoti Mali', '9876543246', '1M', 'due', 'morning', -5),
    
    // Active
    makeDynamicMember(56, 'Bhagwan Singh', '9876543247', '3M', 'paid', 'full', 88),
    makeVacant(57),
    makeDynamicMember(58, 'Saroj Bala', '9876543248', '6M', 'paid', 'morning', 17),
    
    // Expired
    makeDynamicMember(59, 'Kailash Nath', '9876543249', '1M', 'paid', 'evening', -12),
    makeDynamicMember(60, 'Rohit Kumawat', '9876543250', '1M', 'paid', 'morning', -30),
    
    makeVacant(61),
    makeDynamicMember(62, 'Sunil Rasganiya', '9876543251', '1M', 'due', 'morning', 12),
    makeDynamicMember(63, 'Piyush Tanwar', '9876543252', '1M', 'paid', 'morning', 26),
    makeVacant(64),
    makeDynamicMember(65, 'Manju Lata', '9876543253', '6M', 'paid', 'morning', 48),
    makeVacant(66),
    
    // Expiring
    makeDynamicMember(67, 'Naresh Kumar', '9876543254', '3M', 'paid', 'evening', 1),
    makeDynamicMember(68, 'Savitri Devi', '9876543255', '3M', 'paid', 'morning', 9),
    makeVacant(69),
    makeDynamicMember(70, 'Prem Singh', '9876543256', '1Y', 'paid', 'full', 150),
    makeVacant(71),
    makeDynamicMember(72, 'Lakshmi Bai', '9876543257', '1M', 'paid', 'morning', 31),
    makeDynamicMember(73, 'Rajendra Prasad', '9876543258', '3M', 'paid', 'morning', 42),
    makeVacant(74),
    makeDynamicMember(75, 'Komal Sharma', '9876543259', '6M', 'paid', 'evening', 68),
    makeVacant(76),
    
    // Expired
    makeDynamicMember(77, 'Devendra Joshi', '9876543260', '1M', 'due', 'morning', -3),
    makeDynamicMember(78, 'Anita Rawat', '9876543261', '3M', 'paid', 'morning', -8),
    
    makeVacant(79),
    makeDynamicMember(80, 'Ghanshyam', '9876543262', '6M', 'paid', 'morning', 49),
    makeVacant(81),
    makeDynamicMember(82, 'Pushpa Rani', '9876543263', '1M', 'paid', 'evening', 13),
    makeDynamicMember(83, 'Yogesh Patel', '9876543264', '3M', 'paid', 'morning', 27),
    makeVacant(84),
    makeDynamicMember(85, 'Sharda Devi', '9876543265', '6M', 'paid', 'full', 81),
    makeVacant(86),
    
    // Expiring
    makeDynamicMember(87, 'Trilok Chand', '9876543266', '1M', 'paid', 'morning', 7),
    makeDynamicMember(88, 'Rina Sen', '9876543267', '3M', 'paid', 'morning', 23),
    
    makeVacant(89),
    makeDynamicMember(90, 'Mahendra Singh', '9876543268', '1Y', 'paid', 'morning', 210),
    makeVacant(91),
    makeDynamicMember(92, 'Usha Kiran', '9876543269', '1M', 'paid', 'evening', 15),
    
    // Expired
    makeDynamicMember(93, 'Balram Yadav', '9876543270', '3M', 'paid', 'morning', -15),
    makeVacant(94),
    makeDynamicMember(95, 'Santosh Kumar', '9876543271', '6M', 'paid', 'morning', 55),
  ];
}
