import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import { DEFAULT_PACKAGES, Room, Seat, Member, Payment, Expense, NotificationItem, AdminProfile } from "./types";

// Seed baseline configurations ONLY (essential structure - packages and admin credentials)
export async function seedInitialDataIfNeeded(userEmail?: string | null, userId?: string | null) {
  try {
    // 1. Seed structural hostel Packages if missing
    const packageSnap = await getDocs(collection(db, "packages"));
    if (packageSnap.empty) {
      console.log("Seeding baseline packages...");
      for (const pkg of DEFAULT_PACKAGES) {
        await setDoc(doc(db, "packages", pkg.id), pkg);
      }
    }

    // 2. Seed Admin Profile for current user if logging in and missing
    if (userEmail && userId) {
      const adminSnap = await getDocs(collection(db, "admins"));
      const userAdminDoc = doc(db, "admins", userId);
      
      const emailLower = userEmail.toLowerCase();
      // Auto assign Super Admin role
      const isPredefinedSuperAdmin = emailLower === "fnusaib@gmail.com";
      
      if (adminSnap.empty || isPredefinedSuperAdmin) {
        await setDoc(userAdminDoc, {
          id: userId,
          email: userEmail,
          name: userEmail.split("@")[0].toUpperCase() || "Admin Officer",
          role: "Super Admin",
          status: "Active"
        } as AdminProfile);
      }
    }

    console.log("Baseline structure validated correctly.");
  } catch (error) {
    console.error("Failed to seed initial baseline data:", error);
  }
}

// Clear all active tracking records so the owner can start with an empty and professional live system
export async function clearDatabaseRoomsMembersAndLogs() {
  const collectionsToClear = ["rooms", "seats", "members", "payments", "expenses", "notifications"];
  for (const collName of collectionsToClear) {
    const snap = await getDocs(collection(db, collName));
    for (const docSnap of snap.docs) {
      await deleteDoc(doc(db, collName, docSnap.id));
    }
  }
  console.log("Database cleared to 100% fresh status with success!");
}

// Optional: seed dummy/template data on request for playground purposes
export async function seedDemoTemplateData() {
  console.log("Seeding rooms & seats demo content...");
  const dummyRooms: Room[] = [
    {
      id: "room-101",
      blockName: "Niloy Mansion (Main)",
      floor: 1,
      roomNo: "101",
      seatsTotal: 4,
      seatsBooked: 2,
      seatsReserved: 1,
      status: "Booked",
      updatedAt: new Date().toISOString()
    },
    {
      id: "room-102",
      blockName: "Niloy Mansion (Main)",
      floor: 1,
      roomNo: "102",
      seatsTotal: 4,
      seatsBooked: 0,
      seatsReserved: 0,
      status: "Available",
      updatedAt: new Date().toISOString()
    },
    {
      id: "room-201",
      blockName: "Annex Block B",
      floor: 2,
      roomNo: "201",
      seatsTotal: 2,
      seatsBooked: 1,
      seatsReserved: 0,
      status: "Booked",
      updatedAt: new Date().toISOString()
    },
    {
      id: "room-202",
      blockName: "Annex Block B",
      floor: 2,
      roomNo: "202",
      seatsTotal: 2,
      seatsBooked: 0,
      seatsReserved: 0,
      status: "Maintenance",
      updatedAt: new Date().toISOString()
    }
  ];

  for (const r of dummyRooms) {
    await setDoc(doc(db, "rooms", r.id), r);
  }

  const dummySeats: Seat[] = [
    { id: "seat-101-a", roomId: "room-101", roomNo: "101", seatNo: "A", status: "Booked", rentPrice: 3800, memberId: "m-1", currentMemberName: "Shahriar Kabir" },
    { id: "seat-101-b", roomId: "room-101", roomNo: "101", seatNo: "B", status: "Booked", rentPrice: 8500, memberId: "m-2", currentMemberName: "Nayem Islam" },
    { id: "seat-101-c", roomId: "room-101", roomNo: "101", seatNo: "Reserved", status: "Reserved", rentPrice: 3800, memberId: null, currentMemberName: null },
    { id: "seat-101-d", roomId: "room-101", roomNo: "101", seatNo: "D", status: "Available", rentPrice: 3800, memberId: null, currentMemberName: null },

    { id: "seat-102-a", roomId: "room-102", roomNo: "102", seatNo: "A", status: "Available", rentPrice: 2500, memberId: null, currentMemberName: null },
    { id: "seat-102-b", roomId: "room-102", roomNo: "102", seatNo: "B", status: "Available", rentPrice: 2500, memberId: null, currentMemberName: null },
    { id: "seat-102-c", roomId: "room-102", roomNo: "102", seatNo: "C", status: "Available", rentPrice: 2500, memberId: null, currentMemberName: null },
    { id: "seat-102-d", roomId: "room-102", roomNo: "102", seatNo: "D", status: "Available", rentPrice: 2500, memberId: null, currentMemberName: null },

    { id: "seat-201-a", roomId: "room-201", roomNo: "201", seatNo: "A", status: "Booked", rentPrice: 5800, memberId: "m-3", currentMemberName: "Fahim Ahmed" },
    { id: "seat-201-b", roomId: "room-201", roomNo: "201", seatNo: "B", status: "Available", rentPrice: 5800, memberId: null, currentMemberName: null },

    { id: "seat-202-a", roomId: "room-202", roomNo: "202", seatNo: "A", status: "Maintenance", rentPrice: 5800, memberId: null, currentMemberName: null },
    { id: "seat-202-b", roomId: "room-202", roomNo: "202", seatNo: "B", status: "Available", rentPrice: 5800, memberId: null, currentMemberName: null },
  ];

  for (const s of dummySeats) {
    await setDoc(doc(db, "seats", s.id), s);
  }

  const tenDaysLater = new Date();
  tenDaysLater.setDate(tenDaysLater.getDate() + 10);
  const tenDaysLaterStr = tenDaysLater.toISOString().split("T")[0];

  const dummyMembers: Member[] = [
    {
      id: "m-1",
      fullName: "Shahriar Kabir",
      phone: "+8801712345678",
      nidOrStudentId: "NID-199834215682",
      guardianName: "Md. Rafiqul Islam",
      guardianPhone: "+8801710987654",
      emergencyContact: "01725544332",
      roomId: "room-101",
      roomNo: "101",
      seatId: "seat-101-a",
      seatNo: "A",
      packageName: "Standard",
      joiningDate: "2025-01-10",
      leavingDate: null,
      status: "Active",
      dueAmount: 1200,
      totalPaid: 15300,
      photoUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
    },
    {
      id: "m-2",
      fullName: "Nayem Islam",
      phone: "+8801987654321",
      nidOrStudentId: "STU-DU-4125586",
      guardianName: "Abul Kalam",
      guardianPhone: "+8801912345678",
      emergencyContact: "01855663322",
      roomId: "room-101",
      roomNo: "101",
      seatId: "seat-101-b",
      seatNo: "B",
      packageName: "VIP",
      joiningDate: "2025-03-01",
      leavingDate: null,
      status: "Active",
      dueAmount: 0,
      totalPaid: 25500,
      photoUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80"
    },
    {
      id: "m-3",
      fullName: "Fahim Ahmed",
      phone: "+8801524316719",
      nidOrStudentId: "NID-20004512963",
      guardianName: "Shamsul Huq",
      guardianPhone: "+8801554545454",
      emergencyContact: "01522223333",
      roomId: "room-201",
      roomNo: "201",
      seatId: "seat-201-a",
      seatNo: "A",
      packageName: "Premium",
      joiningDate: "2025-02-15",
      leavingDate: tenDaysLaterStr,
      status: "Active",
      dueAmount: 2500,
      totalPaid: 18000,
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
    }
  ];

  for (const m of dummyMembers) {
    await setDoc(doc(db, "members", m.id), m);
  }

  const dummyPayments: Payment[] = [
    {
      id: "p-101",
      memberId: "m-1",
      memberName: "Shahriar Kabir",
      roomNo: "101",
      seatNo: "A",
      amount: 3800,
      type: "Rent",
      method: "bKash",
      transactionId: "BK992857410",
      month: "May 2026",
      timestamp: new Date().toISOString(),
      status: "Paid"
    },
    {
      id: "p-102",
      memberId: "m-2",
      memberName: "Nayem Islam",
      roomNo: "101",
      seatNo: "B",
      amount: 8500,
      type: "Rent",
      method: "Nagad",
      transactionId: "NG88410295",
      month: "May 2026",
      timestamp: new Date().toISOString(),
      status: "Paid"
    },
    {
      id: "p-103",
      memberId: "m-3",
      memberName: "Fahim Ahmed",
      roomNo: "201",
      seatNo: "A",
      amount: 5800,
      type: "Rent",
      method: "Cash",
      transactionId: "CSH-M524",
      month: "April 2026",
      timestamp: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      status: "Paid"
    }
  ];

  for (const pay of dummyPayments) {
    await setDoc(doc(db, "payments", pay.id), pay);
  }

  const dummyExpenses: Expense[] = [
    { id: "e-1", title: "Monthly Catering Bill (Meals)", category: "Food", type: "Expense", amount: 12500, date: "2026-05-10", note: "April catering split", recordedBy: "Manager Asif" },
    { id: "e-2", title: "DESCO Electricity Bill", category: "Electricity", type: "Expense", amount: 4800, date: "2026-05-12", note: "Main block aircon consumption", recordedBy: "Manager Asif" },
    { id: "e-3", title: "Titas Gas Connection", category: "Gas", type: "Expense", amount: 1500, date: "2026-05-15", note: "Catering stove", recordedBy: "Staff Joy" },
    { id: "e-4", title: "Dot Internet Broadband Speed", category: "WiFi", type: "Expense", amount: 2400, date: "2026-05-01", note: "100Mbps dedicated fiber", recordedBy: "Manager Asif" },
    { id: "e-5", title: "Cook & Cleaning Staff Salaries", category: "Salary", type: "Expense", amount: 18500, date: "2026-05-20", note: "May payout for 3 support members", recordedBy: "Super Admin" },
    { id: "e-6", title: "Clogged toilet & basin plumbing", category: "Maintenance", type: "Expense", amount: 3200, date: "2026-05-22", note: "Plumber visit room 101", recordedBy: "Staff Joy" },
    { id: "e-7", title: "Catering Meal Subsidies Profit", category: "Others", type: "Income", amount: 4800, date: "2026-05-18", note: "Guest dinner event collection", recordedBy: "Staff Joy" }
  ];

  for (const exp of dummyExpenses) {
    await setDoc(doc(db, "expenses", exp.id), exp);
  }

  const dummyNotifications: NotificationItem[] = [
    {
      id: "n-1",
      title: "Rent Due Warning",
      message: "Shahriar Kabir has an overdue balance of 1,200 BDT for rent extras.",
      type: "Due",
      createdAt: new Date().toISOString(),
      read: false
    },
    {
      id: "n-2",
      title: "Seat Scheduled Vacancy Alert",
      message: "Fahim Ahmed (Room 201 Seat A) will vacate on 2026-06-05. Seat status set to leaving status.",
      type: "Vacancy",
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      read: false
    },
    {
      id: "n-3",
      title: "bKash Rent Clearance Receipt",
      message: "Payment receipt updated for Nayem Islam. 8,500 BDT Rent confirmed.",
      type: "Payment",
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      read: true
    }
  ];

  for (const n of dummyNotifications) {
    await setDoc(doc(db, "notifications", n.id), n);
  }

  console.log("Demo seed successfully finished!");
}
