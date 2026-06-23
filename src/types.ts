export interface Room {
  id: string;
  blockName: string;
  floor: number;
  roomNo: string;
  seatsTotal: number;
  seatsBooked: number;
  seatsReserved: number;
  status: "Available" | "Booked" | "Reserved" | "Maintenance";
  updatedAt: string;
}

export interface Seat {
  id: string;
  roomId: string;
  roomNo: string;
  seatNo: string; // e.g. "A", "B", "C"
  status: "Available" | "Booked" | "Reserved" | "Maintenance";
  rentPrice: number;
  memberId: string | null;
  currentMemberName: string | null;
}

export interface OccupancyLog {
  id: string;
  roomNo: string;
  seatNo: string;
  assignedAt: string;
  releasedAt: string | null;
  remarks?: string;
}

export interface Member {
  id: string;
  fullName: string;
  phone: string;
  nidOrStudentId: string;
  guardianName: string;
  guardianPhone: string;
  emergencyContact: string;
  roomId: string;
  roomNo: string;
  seatId: string;
  seatNo: string;
  packageName: string;
  joiningDate: string;
  leavingDate: string | null; // Used for automatic vacancy tracking!
  leavingNextMonth?: boolean; // Toggled if member is leaving next month
  status: "Active" | "Inactive";
  dueAmount: number;
  totalPaid: number;
  photoUrl: string;
  profession?: "Student" | "Job Holder";
  institutionName?: string;
  idCardNo?: string;
  advancePaid?: number;
  occupancyHistory?: OccupancyLog[];
}

export interface HostelPackage {
  id: string;
  name: string;
  price: number;
  foodSystem: string;
  mealCount: number;
  facilities: string[];
  status?: "Active" | "Inactive";
}

export interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  roomNo: string;
  seatNo: string;
  amount: number;
  type: string;
  method: "Cash" | "bKash" | "Nagad" | "Rocket";
  transactionId: string;
  month: string; // e.g. "May 2026"
  timestamp: string; // ISO String
  status: "Paid" | "Pending";
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  type: "Expense" | "Income";
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
  recordedBy: string;
  totalAmount?: number; // Total cost (e.g. 100)
  paidAmount?: number;  // Paid amount (e.g. 60)
  dueAmount?: number;   // Outstanding due (e.g. 40)
  merchantName?: string; // Vendor/Shopkeeper/Merchant name
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "Due" | "Payment" | "Vacancy" | "General";
  createdAt: string; // ISO String
  userId?: string; // Targeted to specific user, or general if omitted
  read: boolean;
}

export interface AdminProfile {
  id: string;
  email: string;
  name: string;
  role: "Super Admin" | "Manager" | "Staff";
  status: "Active" | "Inactive";
}

export const DEFAULT_PACKAGES: HostelPackage[] = [
  {
    id: "basic",
    name: "Basic",
    price: 2500,
    foodSystem: "Self-paid / Extra",
    mealCount: 0,
    facilities: ["Shared Washroom", "High-speed WiFi", "Ceiling Fan", "Weekly Cleaning"]
  },
  {
    id: "standard",
    name: "Standard",
    price: 3800,
    foodSystem: "Dinner Included",
    mealCount: 1,
    facilities: ["Shared Washroom", "High-speed WiFi", "Ceiling Fan", "Locker Room access", "Daily Cleaning"]
  },
  {
    id: "premium",
    name: "Premium",
    price: 5800,
    foodSystem: "Lunch + Dinner Included",
    mealCount: 2,
    facilities: ["Semi-private Washroom", "Study Table", "Personal Locker", "High-speed WiFi", "Daily Cleaning", "Purified Water"]
  },
  {
    id: "vip",
    name: "VIP",
    price: 8500,
    foodSystem: "3 Meals/Day Included",
    mealCount: 3,
    facilities: ["Private AC Room", "Attached Washroom", "Laundry Service", "Smart TV Access", "Premium Food Choice", "Daily Cleaning", "24/7 Power Backup"]
  }
];
