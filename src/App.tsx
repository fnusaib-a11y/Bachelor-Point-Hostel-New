import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import {
  Room,
  Seat,
  Member,
  HostelPackage,
  Payment,
  Expense,
  NotificationItem,
  AdminProfile,
  DEFAULT_PACKAGES,
} from "./types";
import { seedInitialDataIfNeeded, clearDatabaseRoomsMembersAndLogs, seedDemoTemplateData } from "./mockDataSeeder";

// Components
import { SplashAndAuth } from "./components/SplashAndAuth";
import { RoomSelector } from "./components/RoomSelector";
import { MemberProfileCard } from "./components/MemberProfileCard";
import { BachelorPointLogo } from "./components/BachelorPointLogo";
import { DashboardCharts } from "./components/DashboardCharts";
import { InvoiceModal } from "./components/InvoiceModal";
import { ReportSystem } from "./components/ReportSystem";

// Icons
import {
  Users,
  ShieldAlert,
  Award,
  CreditCard,
  Plus,
  Home,
  Bell,
  LogOut,
  Building,
  UserCheck,
  Search,
  Filter,
  Package,
  DollarSign,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Settings,
  X,
  FileSpreadsheet,
  CheckCircle,
  Trash2,
  Edit2,
  Sparkles,
  Shield,
  Check,
  Megaphone,
  Send,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [userSession, setUserSession] = useState<{ email: string | null; uid: string } | null>(null);
  const [activeAdmin, setActiveAdmin] = useState<AdminProfile | null>(null);

  // Firestore Sync States
  const [rooms, setRooms] = useState<Room[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [packages, setPackages] = useState<HostelPackage[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // UI Selection & Form States
  const [dashboardTab, setDashboardTab] = useState<"dashboard" | "rooms" | "members" | "packages" | "payments" | "expenses" | "reports">("dashboard");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Payment | null>(null);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  // Search/Filters states
  const [memberSearch, setMemberSearch] = useState("");
  const [memberStatusFilter, setMemberStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("All");

  // Multi-Form Toggles
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isAddingPackage, setIsAddingPackage] = useState(false);

  // New member profile form states
  const [newMemName, setNewMemName] = useState("");
  const [newMemPhone, setNewMemPhone] = useState("");
  const [newMemNid, setNewMemNid] = useState("");
  const [newMemGuardianName, setNewMemGuardianName] = useState("");
  const [newMemGuardianPhone, setNewMemGuardianPhone] = useState("");
  const [newMemEmergency, setNewMemEmergency] = useState("");
  const [newMemRoomId, setNewMemRoomId] = useState("");
  const [newMemSeatId, setNewMemSeatId] = useState("");
  const [newMemPackageName, setNewMemPackageName] = useState<string>("Standard");
  const [newMemPhotoUrl, setNewMemPhotoUrl] = useState("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80");
  const [newMemProfession, setNewMemProfession] = useState<"Student" | "Job Holder">("Student");
  const [newMemInstitution, setNewMemInstitution] = useState("");
  const [newMemIdCardNo, setNewMemIdCardNo] = useState("");
  const [newMemAdvancePaid, setNewMemAdvancePaid] = useState<number>(0);

  // New expense form states
  // Helpers for running month and date
  const getRunningMonthAndDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return {
      month: `${yyyy}-${mm}`,
      date: `${yyyy}-${mm}-${dd}`
    };
  };
  const { month: runningMonth, date: runningDate } = getRunningMonthAndDate();

  const [newExpTitle, setNewExpTitle] = useState("");
  const [newExpAmount, setNewExpAmount] = useState(0);
  const [newExpCategory, setNewExpCategory] = useState<Expense["category"]>("Food");
  const [newExpType, setNewExpType] = useState<"Expense" | "Income">("Expense");
  const [newExpDate, setNewExpDate] = useState(runningDate);
  const [expenseMonthFilter, setExpenseMonthFilter] = useState(runningMonth);

  // Custom Dynamic Expense/Income categories state
  const [expenseCategories, setExpenseCategories] = useState<{ id: string; name: string; type: "Expense" | "Income" }[]>([]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState<string>("");
  const [editingCategoryType, setEditingCategoryType] = useState<"Expense" | "Income">("Expense");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"Expense" | "Income">("Expense");

  // Partial Payments logic (দোকানদার/বাকি হিসাব)
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [expTotalAmount, setExpTotalAmount] = useState<number>(0);
  const [expPaidAmount, setExpPaidAmount] = useState<number>(0);
  const [expMerchantName, setExpMerchantName] = useState("");

  // Paying back supplier due balance
  const [payingDueExpense, setPayingDueExpense] = useState<Expense | null>(null);
  const [repayAmount, setRepayAmount] = useState<number>(0);

  // Dynamic Category Wise spending reports state
  const [reportPeriodType, setReportPeriodType] = useState<"daily" | "monthly" | "yearly">("monthly");
  const [reportDailyDate, setReportDailyDate] = useState<string>(runningDate);
  const [reportMonthlyPeriod, setReportMonthlyPeriod] = useState<string>(runningMonth);
  const [reportYearlyPeriod, setReportYearlyPeriod] = useState<string>("2026");
  const [reportExpandedCategory, setReportExpandedCategory] = useState<string | null>(null);

  // New dynamic Package configuration panel
  const [newPkgName, setNewPkgName] = useState<string>("Standard");
  const [newPkgPrice, setNewPkgPrice] = useState(4000);
  const [newPkgMeals, setNewPkgMeals] = useState("Lunch Included");
  const [newPkgMealCount, setNewPkgMealCount] = useState(1);
  const [newPkgFacilities, setNewPkgFacilities] = useState("Shared Bath, High Speed WiFi, Fan, Cleaning");
  const [newPkgStatus, setNewPkgStatus] = useState<"Active" | "Inactive">("Active");
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);

  // Broadcast messaging states
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState("আসন্ন জরুরি নোটিশ ও আপডেট");
  const [broadcastCategory, setBroadcastCategory] = useState<"Maintenance" | "Due" | "Dining" | "General">("General");
  const [broadcastContent, setBroadcastContent] = useState("");
  const [broadcastChannel, setBroadcastChannel] = useState<"System" | "Email" | "Both">("Both");
  const [broadcastSendingStatus, setBroadcastSendingStatus] = useState<"Idle" | "Sending" | "Success">("Idle");
  const [broadcastProgress, setBroadcastProgress] = useState(0);

  // Publishing/Database management states
  const [dbActionLoading, setDbActionLoading] = useState(false);
  const [dbActionStatus, setDbActionStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Submitting states for buttons to show spin feedback
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [isSubmittingPackage, setIsSubmittingPackage] = useState(false);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  // Custom alert/confirm modal state to replace iframe-disabled window/safari alerts
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; title: string; message: string; type: "alert" | "success" | "error" }>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert"
  });

  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({
    isOpen: false,
    title: "নিশ্চিত করুন",
    message: "",
    onConfirm: () => {}
  });

  const showAlert = (message: string, title = "সতর্কতা / তথ্য", type: "alert" | "success" | "error" = "alert") => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type
    });
  };

  const showConfirm = (message: string, onConfirm: () => void, title = "নিশ্চিত করুন") => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      }
    });
  };

  // 1. Listen for Authentication Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserSession({
          email: user.email,
          uid: user.uid,
        });

        // Initialize/seed baseline database
        await seedInitialDataIfNeeded(user.email, user.uid);
      } else {
        setUserSession(null);
        setActiveAdmin(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Synchronization listeners from Firestore
  useEffect(() => {
    if (!userSession) return;

    const pathRooms = "rooms";
    const unsubRooms = onSnapshot(
      collection(db, pathRooms),
      (snap) => {
        const list: Room[] = [];
        snap.forEach((doc) => list.push(doc.data() as Room));
        // Sort rooms by number ascending
        list.sort((a, b) => a.roomNo.localeCompare(b.roomNo));
        setRooms(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, pathRooms)
    );

    const pathSeats = "seats";
    const unsubSeats = onSnapshot(
      collection(db, pathSeats),
      (snap) => {
        const list: Seat[] = [];
        snap.forEach((doc) => list.push(doc.data() as Seat));
        // Sort seats by bed number asc
        list.sort((a, b) => a.seatNo.localeCompare(b.seatNo));
        setSeats(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, pathSeats)
    );

    const pathMembers = "members";
    const unsubMembers = onSnapshot(
      collection(db, pathMembers),
      (snap) => {
        const list: Member[] = [];
        snap.forEach((doc) => list.push(doc.data() as Member));
        setMembers(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, pathMembers)
    );

    const pathPackages = "packages";
    const unsubPackages = onSnapshot(
      collection(db, pathPackages),
      (snap) => {
        const list: HostelPackage[] = [];
        snap.forEach((doc) => list.push(doc.data() as HostelPackage));
        setPackages(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, pathPackages)
    );

    const pathPayments = "payments";
    const unsubPayments = onSnapshot(
      collection(db, pathPayments),
      (snap) => {
        const list: Payment[] = [];
        snap.forEach((doc) => list.push(doc.data() as Payment));
        // Sort payments by timestamp descending
        list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        setPayments(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, pathPayments)
    );

    const pathExpenses = "expenses";
    const unsubExpenses = onSnapshot(
      collection(db, pathExpenses),
      (snap) => {
        const list: Expense[] = [];
        snap.forEach((doc) => list.push(doc.data() as Expense));
        // Sort expenses by date descending
        list.sort((a, b) => b.date.localeCompare(a.date));
        setExpenses(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, pathExpenses)
    );

    const pathCategories = "expense_categories";
    const unsubCategories = onSnapshot(
      collection(db, pathCategories),
      (snap) => {
        const list: { id: string; name: string; type: "Expense" | "Income" }[] = [];
        snap.forEach((doc) => {
          const data = doc.data();
          if (data && data.name) {
            list.push({
              id: doc.id,
              name: data.name,
              type: data.type || "Expense"
            });
          }
        });

        if (snap.empty) {
          const defaultCategoriesList = [
            { id: "def_food", name: "Food", type: "Expense" },
            { id: "def_elec", name: "Electricity", type: "Expense" },
            { id: "def_gas", name: "Gas", type: "Expense" },
            { id: "def_wifi", name: "WiFi", type: "Expense" },
            { id: "def_salary", name: "Salary", type: "Expense" },
            { id: "def_maint", name: "Maintenance", type: "Expense" },
            { id: "def_others", name: "Others", type: "Expense" },
            { id: "def_rent_inc", name: "Room Rent", type: "Income" },
            { id: "def_food_inc", name: "Food Payment", type: "Income" },
            { id: "def_adv_inc", name: "AdvanceBooking", type: "Income" },
          ];
          defaultCategoriesList.forEach(async (c) => {
            try {
              await setDoc(doc(db, "expense_categories", c.id), {
                id: c.id,
                name: c.name,
                type: c.type,
                createdAt: new Date().toISOString()
              });
            } catch (err) {
              console.error("Fails to seed:", c.id, err);
            }
          });
          return;
        }

        setExpenseCategories(list);
      },
      (error) => console.log("Failed to sync custom categories table:", error)
    );

    const pathNotifs = "notifications";
    const unsubNotifs = onSnapshot(
      collection(db, pathNotifs),
      (snap) => {
        const list: NotificationItem[] = [];
        snap.forEach((doc) => {
          const data = doc.data() as NotificationItem;
          list.push({ ...data, id: doc.id });
        });
        // Sort by time desc
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setNotifications(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, pathNotifs)
    );

    // Get signed in admin profile info
    const adminPath = `admins/${userSession.uid}`;
    const unsubAdmin = onSnapshot(
      doc(db, "admins", userSession.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          setActiveAdmin(docSnap.data() as AdminProfile);
        } else {
          // Fallback if record is missing
          setActiveAdmin({
            id: userSession.uid,
            name: "সুপার এডমিন (Super Admin)",
            email: userSession.email || "admin@bachelorpoint.com",
            role: "Super Admin",
          });
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, adminPath)
    );

    return () => {
      unsubRooms();
      unsubSeats();
      unsubMembers();
      unsubPackages();
      unsubPayments();
      unsubExpenses();
      unsubCategories();
      unsubNotifs();
      unsubAdmin();
    };
  }, [userSession]);

  // Automated background dues scanner: scans members' due amounts and automatically generates a notification if a balance exceeds ৳3,000 threshold
  useEffect(() => {
    if (userSession && members.length > 0) {
      // Small delayed debounce to wait for stable state fetch alignments
      const timer = setTimeout(() => {
        handleScanDuesAndNotify(3000)
          .then((res) => {
            if (res.alertsCreated > 0) {
              console.log(`[Auto-Due Scanner] Scanned ${res.scannedCount} overdue accounts, generated ${res.alertsCreated} alert notifications.`);
            }
          })
          .catch((err) => console.error("Auto dues check crashed in background:", err));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [userSession, members.length]);

  // Auth helper
  const handleAuthComplete = (user: { email: string | null; uid: string }) => {
    setUserSession(user);
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  // Add Room Flow
  const handleAddRoom = async (roomData: Partial<Room> & { defaultRentPrice?: number }) => {
    try {
      const generatedRoomId = `room_${Date.now()}`;
      const newRoom: Room = {
        id: generatedRoomId,
        blockName: roomData.blockName || "উইং-এ",
        floor: roomData.floor || 1,
        roomNo: roomData.roomNo || "১০১",
        seatsTotal: roomData.seatsTotal || 4,
        seatsBooked: 0,
        seatsReserved: 0,
        status: "Available",
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "rooms", generatedRoomId), newRoom);

      // Dynamically auto seed individual seats
      for (let i = 1; i <= newRoom.seatsTotal; i++) {
        const seatId = `seat_${generatedRoomId}_${i}`;
        const newSeat: Seat = {
          id: seatId,
          roomId: generatedRoomId,
          roomNo: newRoom.roomNo,
          seatNo: `${newRoom.roomNo}-${String.fromCharCode(64 + i)}`,
          status: "Available",
          rentPrice: roomData.defaultRentPrice !== undefined ? roomData.defaultRentPrice : (newRoom.seatsTotal === 1 ? 6500 : newRoom.seatsTotal === 2 ? 4500 : 3500),
          memberId: null,
          currentMemberName: null,
        };
        await setDoc(doc(db, "seats", seatId), newSeat);
      }

      // Notification
      await addDoc(collection(db, "notifications"), {
        id: `notif_${Date.now()}`,
        title: "নতুন রুম ও সিট ম্যাট্রিক্স",
        message: `উইং ${newRoom.blockName}-এ রুম ${newRoom.roomNo} যোগ করা হয়েছে। ${newRoom.seatsTotal}টি সিট স্বয়ংক্রিয়ভাবে তৈরি হয়েছে।`,
        type: "General",
        createdAt: new Date().toISOString(),
        read: false,
      } as NotificationItem);

    } catch (err) {
      console.error("Failed to add room matrix:", err);
    }
  };

  // Update dynamic custom seat status (reserved, maintenance, etc.)
  const handleUpdateSeatStatus = async (seatId: string, status: Seat["status"]) => {
    try {
      await updateDoc(doc(db, "seats", seatId), { status });
    } catch (err) {
      console.error("Failed to update seat status:", err);
    }
  };

  // Delete dynamic room and its seats
  const handleDeleteRoom = async (roomId: string) => {
    showConfirm(
      "আপনি কি নিশ্চিতভাবে এই রুম এবং এর অন্তর্গত সকল খালি সিট মুছে ফেলতে চান?",
      async () => {
        try {
          // Find if there is any active member currently in this room
          const activeInRoom = members.some((m) => m.roomId === roomId && m.status === "Active");
          if (activeInRoom) {
            showAlert("এই রুমে এখনো সক্রিয় বর্ডার আছেন! রুম মুছতে হলে প্রথমে বর্ডারদের অন্য রুমে স্থানান্তরিত করতে হবে।", "রুম মুছতে ব্যর্থ");
            return;
          }

          // Delete seats in Firestore
          const roomSeats = seats.filter((s) => s.roomId === roomId);
          for (const seat of roomSeats) {
            await deleteDoc(doc(db, "seats", seat.id));
          }

          // Delete room
          await deleteDoc(doc(db, "rooms", roomId));

          // Notification
          await addDoc(collection(db, "notifications"), {
            id: `notif_${Date.now()}`,
            title: "রুম মুছে ফেলা হয়েছে",
            message: "একটি রুম ও তার সংশ্লিষ্ট সিটগুলো রেকর্ড থেকে সফলভাবে মুছে ফেলা হয়েছে।",
            type: "General",
            createdAt: new Date().toISOString(),
            read: false,
          } as NotificationItem);

          showAlert("রুমটি সফলভাবে মুছে ফেলা হয়েছে!", "রুম ডিলিট সম্পন্ন", "success");
        } catch (err) {
          console.error("Failed to delete room:", err);
          showAlert("রুম মুছতে ত্রুটি হয়েছে।", "ত্রুটি", "error");
        }
      },
      "রুম মুছে ফেলার নিশ্চিতকরণ"
    );
  };

  // Add a dynamic bed under a room
  const handleAddSeat = async (roomId: string, seatNo: string, rentPrice: number) => {
    try {
      const parentRoom = rooms.find((r) => r.id === roomId);
      if (!parentRoom) return;

      const newSeatId = `seat_${roomId}_${Date.now()}`;
      const newSeat: Seat = {
        id: newSeatId,
        roomId: roomId,
        roomNo: parentRoom.roomNo,
        seatNo: seatNo,
        status: "Available",
        rentPrice: rentPrice,
        memberId: null,
        currentMemberName: null,
      };

      await setDoc(doc(db, "seats", newSeatId), newSeat);

      // Update room seats counter
      const newSeatsTotal = parentRoom.seatsTotal + 1;
      await updateDoc(doc(db, "rooms", roomId), {
        seatsTotal: newSeatsTotal,
        updatedAt: new Date().toISOString(),
      });

      // Notification
      await addDoc(collection(db, "notifications"), {
        id: `notif_${Date.now()}`,
        title: "নতুন সিট যোগ করা হয়েছে",
        message: `রুম ${parentRoom.roomNo}-এ নতুন সিট ${seatNo} যোগ করা হয়েছে। ভাড়া: ৳${rentPrice}`,
        type: "General",
        createdAt: new Date().toISOString(),
        read: false,
      } as NotificationItem);

      showAlert("সিটটি সফলভাবে রুমের মধ্যে যুক্ত করা হয়েছে!", "সিট যোগ সম্পন্ন", "success");
    } catch (err) {
      console.error("Failed to add seat:", err);
      showAlert("সিট যোগ করতে ত্রুটি হয়েছে।", "ত্রুটি", "error");
    }
  };

  // Delete a bed from a room
  const handleDeleteSeat = async (seatId: string) => {
    showConfirm(
      "আপনি কি নিশ্চিতভাবে এই সিটটি মুছে ফেলতে চান?",
      async () => {
        try {
          const targetSeat = seats.find((s) => s.id === seatId);
          if (!targetSeat) return;

          if (targetSeat.status === "Booked" || targetSeat.memberId) {
            showAlert("এই সিটে এখনো বর্ডার আছেন! সিটটি মুছতে হলে প্রথমে বর্ডারকে রিলিজ বা শিফট করতে হবে।", "সিট ডিলিট সতর্ক বার্তা");
            return;
          }

          const parentRoom = rooms.find((r) => r.id === targetSeat.roomId);
          if (parentRoom) {
            const newSeatsTotal = Math.max(0, parentRoom.seatsTotal - 1);
            await updateDoc(doc(db, "rooms", targetSeat.roomId), {
              seatsTotal: newSeatsTotal,
              updatedAt: new Date().toISOString(),
            });
          }

          await deleteDoc(doc(db, "seats", seatId));
          showAlert("সিট সফলভাবে মুছে ফেলা হয়েছে!", "সিট ডিলিট সম্পন্ন", "success");
        } catch (err) {
          console.error("Failed to delete seat:", err);
          showAlert("সিট মুছতে ত্রুটি হয়েছে।", "ত্রুটি", "error");
        }
      },
      "সিট মুছে ফেলার নিশ্চিতকরণ"
    );
  };

  // Update dynamic bed rent price
  const handleUpdateSeatRent = async (seatId: string, rentPrice: number) => {
    try {
      await updateDoc(doc(db, "seats", seatId), { rentPrice });
    } catch (err) {
      console.error("Failed to update seat rent:", err);
      showAlert("সিটের ভাড়া আপডেট করতে ত্রুটি হয়েছে।", "ত্রুটি", "error");
    }
  };

  // Scan active members' due amounts and generate automatic warnings on exceeding a threshold
  const handleScanDuesAndNotify = async (threshold: number): Promise<{ scannedCount: number; alertsCreated: number }> => {
    try {
      const activeOverdueMembers = members.filter(
        (m) => m.status === "Active" && m.dueAmount >= threshold
      );

      let alertsCreated = 0;
      for (const member of activeOverdueMembers) {
        // Compose unique warning title to check if there is an unread duplicate about dues
        const warningTitle = `বকেয়া নোটিশ সতর্কতা: ${member.fullName}`;
        
        const hasBeenNotified = notifications.some(
          (n) => n.title === warningTitle && !n.read
        );

        if (!hasBeenNotified) {
          await addDoc(collection(db, "notifications"), {
            id: `notif_auto_due_${member.id}_${Date.now()}`,
            title: warningTitle,
            message: `বর্ডার ${member.fullName}-এর আউটস্ট্যান্ডিং হোস্টেল বকেয়া ৳${member.dueAmount} টাকা ছাড়িয়েছে, যা সিস্টেমের নির্ধারিত বকেয়া সতর্কতা সীমা ৳${threshold}-এর সমান বা বেশি। নোটিশ পাঠানো হলো।`,
            type: "Due",
            createdAt: new Date().toISOString(),
            read: false,
          } as NotificationItem);
          alertsCreated++;
        }
      }

      return { scannedCount: activeOverdueMembers.length, alertsCreated };
    } catch (err) {
      console.error("Dues scanner failure:", err);
      return { scannedCount: 0, alertsCreated: 0 };
    }
  };

  const handleDownloadDashboardStatsCSV = () => {
    const totalSeats = seats.length;
    const bookedSeats = seats.filter((s) => s.status === "Booked").length;
    const availableSeats = seats.filter((s) => s.status === "Available").length;
    const reservedSeats = seats.filter((s) => s.status === "Reserved").length;
    const maintenanceSeats = seats.filter((s) => s.status === "Maintenance").length;
    const occupancyPercent = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

    const duesAmount = members
      .filter((m) => m.dueAmount > 0 && m.status === "Active")
      .reduce((sum, m) => sum + m.dueAmount, 0);
    const incomePaid = payments
      .filter((p) => p.status === "Paid")
      .reduce((sum, p) => sum + p.amount, 0);
    const expensePaid = expenses
      .filter((e) => e.type === "Expense")
      .reduce((sum, e) => sum + e.amount, 0);

    const headers = [
      "Metric Title",
      "Calculated Value",
      "Description Notes"
    ];
    const dataRows = [
      ["Total Hostel Bed Seats", totalSeats, "Total bed spots across all formatted layouts"],
      ["Booked Bed Seats", bookedSeats, `${occupancyPercent}% seat occupancy percentage`],
      ["Available Bed Seats", availableSeats, "Ready for immediate member check-in onboarding"],
      ["Reserved Bed Seats", reservedSeats, "On reservation locks"],
      ["Maintenance Bed Seats", maintenanceSeats, "Offline for scheduled maintenance"],
      ["Total Income processed", `BDT ${incomePaid}`, "Sum of paid rent and dining receipts"],
      ["Total Expenses recorded", `BDT ${expensePaid}`, "Total operation cash outflows"],
      ["Net Hostel Operation Profit", `BDT ${incomePaid - expensePaid}`, "Net operating balance remaining"],
      ["Total Arrears (Outstanding Dues)", `BDT ${duesAmount}`, "Unpaid balances from active members"]
    ];

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...dataRows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BachelorPoint_DashboardStats_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert("ড্যাশবোর্ড পরিসংখ্যানের CSV ফাইল সফলভাবে ডাউনলোড হয়েছে!", "ডাউনলোড সম্পন্ন", "success");
  };

  const handleDownloadDashboardStatsJSON = () => {
    const totalSeats = seats.length;
    const bookedSeats = seats.filter((s) => s.status === "Booked").length;
    const availableSeats = seats.filter((s) => s.status === "Available").length;
    const reservedSeats = seats.filter((s) => s.status === "Reserved").length;
    const maintenanceSeats = seats.filter((s) => s.status === "Maintenance").length;
    const occupancyPercent = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

    const duesAmount = members
      .filter((m) => m.dueAmount > 0 && m.status === "Active")
      .reduce((sum, m) => sum + m.dueAmount, 0);
    const incomePaid = payments
      .filter((p) => p.status === "Paid")
      .reduce((sum, p) => sum + p.amount, 0);
    const expensePaid = expenses
      .filter((e) => e.type === "Expense")
      .reduce((sum, e) => sum + e.amount, 0);

    const statsObj = {
      reportingDate: new Date().toISOString(),
      source: "Bachelor Point Hostels Admin Ledger",
      summaryMetrics: {
        totalSeats: totalSeats,
        seatCounts: {
          booked: bookedSeats,
          available: availableSeats,
          reserved: reservedSeats,
          maintenance: maintenanceSeats,
          occupancyPercentage: occupancyPercent
        },
        financials: {
          totalIncomePaid: incomePaid,
          totalExpensePaid: expensePaid,
          netProfit: incomePaid - expensePaid,
          totalOutstandingDues: duesAmount
        }
      }
    };

    const strJson = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(statsObj, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", strJson);
    link.setAttribute("download", `BachelorPoint_DashboardStats_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert("ড্যাশবোর্ড পরিসংখ্যানের JSON ফাইল সফলভাবে ডাউনলোড হয়েছে!", "ডাউনলোড সম্পন্ন", "success");
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject || !broadcastContent) return;

    const activeMembers = members.filter((m) => m.status === "Active");
    if (activeMembers.length === 0) {
      showAlert("হোস্টেলে কোনো সক্রিয় মেম্বার মেম্বারশিপে নেই। ব্রডকাস্ট পাঠানো যাবে না।", "কোনো মেম্বার পাওয়া যায়নি");
      return;
    }

    setBroadcastSendingStatus("Sending");
    setBroadcastProgress(0);

    try {
      // Create a general notification for the admin notifications center
      await addDoc(collection(db, "notifications"), {
        id: `broadcast_${Date.now()}`,
        title: `📢 ব্রডকাস্ট: ${broadcastSubject}`,
        message: `${broadcastContent} (প্রাপক: ${activeMembers.length} জন সক্রিয় বর্ডার)`,
        type: broadcastCategory === "Due" ? "Due" : "General",
        createdAt: new Date().toISOString(),
        read: false,
      } as NotificationItem);

      // Simulate sending notifications to active members sequentially
      for (let i = 0; i < activeMembers.length; i++) {
        const member = activeMembers[i];
        
        // Short timeout simulation
        await new Promise((resolve) => setTimeout(resolve, i === 0 ? 50 : 200));
        setBroadcastProgress(Math.min(100, Math.round(((i + 1) / activeMembers.length) * 100)));

        // Write a specific entry
        await addDoc(collection(db, "notifications"), {
          id: `notif_member_${member.id}_${Date.now()}`,
          title: `মেম্বার নোটিশ (${member.fullName})`,
          message: `[ব্রডকাস্ট] ${broadcastSubject} - ${broadcastContent}`,
          type: "General",
          createdAt: new Date().toISOString(),
          read: true,
        } as NotificationItem);
      }

      setBroadcastSendingStatus("Success");
      setTimeout(() => {
        setIsBroadcasting(false);
        setBroadcastSendingStatus("Idle");
        setBroadcastContent("");
        setBroadcastSubject("আসন্ন জরুরি নোটিশ ও আপডেট");
        showAlert(`সক্রিয় বর্ডারদের নোটিফিকেশন ও ইমেইল ব্রডকাস্ট সফলভাবে বিতরণ করা হয়েছে! ${activeMembers.length} জন সক্রিয় সদস্যের কাছে বার্তা পৌঁছেছে।`, "ব্রডকাস্ট সম্পন্ন", "success");
      }, 1000);

    } catch (err) {
      console.error("Failed to distribute broadcast notifications:", err);
      showAlert("ব্রডকাস্ট পাঠাতে সমস্যা হয়েছে। ডাটাবেস সংযোগ পরীক্ষা করুন।", "ত্রুটি", "error");
      setBroadcastSendingStatus("Idle");
    }
  };

  // Register Enrolled Active Boarder Flow
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemName.trim()) {
      showAlert("দয়া করে বর্ডারের পুরো নাম লিখুন।", "তথ্য অসম্পূর্ণ", "alert");
      return;
    }
    if (!newMemPhone.trim()) {
      showAlert("দয়া করে সক্রিয় মোবাইল নম্বর লিখুন।", "তথ্য অসম্পূর্ণ", "alert");
      return;
    }
    if (!newMemRoomId) {
      showAlert("দয়া করে একটি রুম নম্বর নির্বাচন করুন।", "তথ্য অসম্পূর্ণ", "alert");
      return;
    }
    if (!newMemSeatId) {
      showAlert("দয়া করে একটি সিট বরাদ্দ করুন।", "তথ্য অসম্পূর্ণ", "alert");
      return;
    }

    setIsSubmittingMember(true);
    try {
      const activeSeatObj = seats.find((s) => s.id === newMemSeatId);
      const activeRoomObj = rooms.find((r) => r.id === newMemRoomId);
      const pkgObj = (packages.length > 0 ? packages : DEFAULT_PACKAGES).find((p) => p.name === newMemPackageName);

      if (!activeSeatObj || !activeRoomObj || !pkgObj) {
        showAlert("রুম বা সিটের তথ্য পাওয়া যায়নি। অনুগ্রহ করে পুনরায় সঠিক তথ্য নির্বাচন করুন।", "ত্রুটি", "error");
        setIsSubmittingMember(false);
        return;
      }

      const newMemberId = `member_${Date.now()}`;
      const rentCharge = activeSeatObj.rentPrice;
      const packagePrice = pkgObj.price;
      const totalInitialBill = rentCharge + packagePrice;

      if (newMemAdvancePaid > totalInitialBill) {
        showAlert("অগ্রিম বুকিং ফি সর্বমোট চার্জের চেয়ে বেশি হতে পারে না!", "ভুল তথ্য", "error");
        setIsSubmittingMember(false);
        return;
      }

      const outstandingDue = Math.max(0, totalInitialBill - newMemAdvancePaid);

      const newMember: Member = {
        id: newMemberId,
        fullName: newMemName,
        phone: newMemPhone,
        photoUrl: newMemPhotoUrl,
        roomId: newMemRoomId,
        roomNo: activeRoomObj.roomNo,
        seatId: newMemSeatId,
        seatNo: activeSeatObj.seatNo,
        status: "Active",
        nidOrStudentId: newMemNid || "প্রদান করা হয়নি",
        joiningDate: new Date().toLocaleDateString(),
        leavingDate: null,
        packageName: newMemPackageName,
        totalPaid: newMemAdvancePaid,
        dueAmount: outstandingDue, // Composite dues: (Rent + Package) - Advance Booking
        guardianName: newMemGuardianName || "অজানা",
        guardianPhone: newMemGuardianPhone || "অজানা",
        emergencyContact: newMemEmergency || "অজানা",
        profession: newMemProfession,
        institutionName: newMemInstitution || "প্রদান করা হয়নি",
        idCardNo: newMemIdCardNo || "প্রদান করা হয়নি",
        advancePaid: newMemAdvancePaid,
      };

      // Add to Firestore members record
      await setDoc(doc(db, "members", newMemberId), newMember);

      // Book seat as occupied
      await updateDoc(doc(db, "seats", newMemSeatId), {
        status: "Booked",
        memberId: newMemberId,
      });

      // Increment room occupants count
      await updateDoc(doc(db, "rooms", newMemRoomId), {
        seatsBooked: activeRoomObj.seatsBooked + 1,
      });

      // Write payment receipt for dynamic advance booked fee if any
      if (newMemAdvancePaid > 0) {
        const advPaymentId = `pay_adv_${Date.now()}`;
        const currentBdtMonth = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
        const newPaymentDoc: Payment = {
          id: advPaymentId,
          memberId: newMemberId,
          memberName: newMemName,
          roomNo: activeRoomObj.roomNo,
          seatNo: activeSeatObj.seatNo,
          amount: newMemAdvancePaid,
          type: "AdvanceBooking",
          method: "Cash",
          transactionId: `TXN${Date.now().toString().substring(5, 13).toUpperCase()}`,
          month: currentBdtMonth,
          timestamp: new Date().toISOString(),
          status: "Paid"
        };
        await setDoc(doc(db, "payments", advPaymentId), newPaymentDoc);
      }

      // Dynamic notifications
      await addDoc(collection(db, "notifications"), {
        id: `notif_${Date.now()}`,
        title: "নতুন বর্ডার চেক-ইন",
        message: `${newMember.fullName} সফলভাবে সিট ${newMember.seatNo} (রুম ${newMember.roomNo}) এ চেক-ইন সম্পন্ন করেছেন।`,
        type: "General",
        createdAt: new Date().toISOString(),
        read: false,
      } as NotificationItem);

      // Clear forms
      setNewMemName("");
      setNewMemPhone("");
      setNewMemNid("");
      setNewMemInstitution("");
      setNewMemIdCardNo("");
      setNewMemAdvancePaid(0);
      setIsAddingMember(false);
      setSelectedMemberId(newMemberId);
      setDashboardTab("members");
      
      // Artificial short delay to let the user see the "completed" state nicely
      setTimeout(() => {
        setIsSubmittingMember(false);
        showAlert(`${newMember.fullName} সফলভাবে সিট ${newMember.seatNo} (রুম ${newMember.roomNo}) এ চেক-ইন সম্পন্ন করেছেন।`, "চেক-ইন সফল", "success");
      }, 500);

    } catch (err) {
      console.error("Onboarding failed:", err);
      showAlert("ভর্তি সম্পন্ন করা সম্ভব হয়নি। অনুগ্রহ করে ডাটাবেস সংযোগ বা সঠিক তথ্য দিয়ে পুনরায় চেষ্টা করুন।", "ত্রুটি", "error");
      setIsSubmittingMember(false);
    }
  };

  // Collect Outstandings Cash Payment Flow
  const handlePaymentCollect = async (
    memberId: string,
    amount: number,
    type: "Rent" | "Food",
    method: "Cash" | "bKash" | "Nagad" | "Rocket"
  ) => {
    try {
      const mToPay = members.find((m) => m.id === memberId);
      if (!mToPay) return;

      const payObjId = `pay_${Date.now()}`;
      const bdtMonth = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

      const newPayment: Payment = {
        id: payObjId,
        memberId,
        memberName: mToPay.fullName,
        amount,
        type,
        method,
        transactionId: `TXN${Date.now().toString().substring(5, 13).toUpperCase()}`,
        month: bdtMonth,
        timestamp: new Date().toISOString(),
        roomNo: mToPay.roomNo,
        seatNo: mToPay.seatNo,
        status: "Paid",
      };

      // Record to Payment collection
      await setDoc(doc(db, "payments", payObjId), newPayment);

      // Adjust boarder balance ledger
      const newlyPaidOutstanding = Math.max(0, mToPay.dueAmount - amount);
      const totalAccumulatedPaid = mToPay.totalPaid + amount;

      await updateDoc(doc(db, "members", memberId), {
        dueAmount: newlyPaidOutstanding,
        totalPaid: totalAccumulatedPaid,
      });

      // Notification Dispatch
      await addDoc(collection(db, "notifications"), {
        id: `notif_${Date.now()}`,
        title: "বিল পরিশোধ রসিদ",
        message: `${mToPay.fullName} এর বকেয়া ভাড়া বাবদ ৳${amount} টাকা (${method}) সফলভাবে সংগ্রহ হয়েছে।`,
        type: "Payment",
        createdAt: new Date().toISOString(),
        read: false,
      } as NotificationItem);

    } catch (err) {
      console.error("Ledger update failed:", err);
    }
  };

  // Modify family/safety profile dossier
  const handleUpdateMemberProfile = async (memberId: string, updatedFields: Partial<Member>) => {
    try {
      await updateDoc(doc(db, "members", memberId), updatedFields);

      // If member status is updated to Inactive, let's auto-vacate their seat!
      if (updatedFields.status === "Inactive") {
        const targetMember = members.find((m) => m.id === memberId);
        if (targetMember && targetMember.seatId) {
          // Free the seat
          await updateDoc(doc(db, "seats", targetMember.seatId), {
            status: "Available",
            memberId: null,
            currentMemberName: null,
          });

          // Decr booked count in room
          if (targetMember.roomId) {
            const r = rooms.find((room) => room.id === targetMember.roomId);
            if (r) {
              await updateDoc(doc(db, "rooms", targetMember.roomId), {
                seatsBooked: Math.max(0, r.seatsBooked - 1),
              });
            }
          }

          // Trigger a notification
          await addDoc(collection(db, "notifications"), {
            id: `notif_${Date.now()}`,
            title: "সিট খালি করা হয়েছে",
            message: `${targetMember.fullName} ইন-অ্যাক্টিভ হওয়ায় রুম ${targetMember.roomNo}, বেড ${targetMember.seatNo} এখন বুকিংয়ের জন্য উন্মুক্ত।`,
            type: "Vacancy",
            createdAt: new Date().toISOString(),
            read: false,
          } as NotificationItem);
        }
      }
    } catch (err) {
      console.error("Dossier write error:", err);
    }
  };

  // Expense accounting flow
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let resolvedAmount = newExpAmount;
    let totalAmt = newExpAmount;
    let paidAmt = newExpAmount;
    let dueAmt = 0;
    let merchant = "";

    if (newExpType === "Expense" && isPartialPayment) {
      totalAmt = expTotalAmount;
      paidAmt = expPaidAmount;
      dueAmt = Math.max(0, expTotalAmount - expPaidAmount);
      merchant = expMerchantName.trim();
      resolvedAmount = expPaidAmount; // cash outflow is the paid amount
    }

    if (!newExpTitle.trim()) {
      showAlert("দয়া করে বিবরণ (Title) লিখুন।", "তথ্য অসম্পূর্ণ", "alert");
      return;
    }

    if (newExpType === "Expense" && isPartialPayment && expPaidAmount > expTotalAmount) {
      showAlert("নগদ পরিশোধের পরিমাণ মোট ক্রয় মূল্যের চেয়ে বেশি হতে পারে না!", "ভুল তথ্য", "error");
      return;
    }

    if (newExpType === "Expense" && !isPartialPayment && resolvedAmount <= 0) {
      showAlert("দয়া করে ব্যয়ের সঠিক পরিমাণ লিখুন।", "তথ্য অসম্পূর্ণ", "alert");
      return;
    }

    setIsSubmittingExpense(true);
    try {
      const expenseObjId = `exp_${Date.now()}`;
      const newExpense: Expense = {
        id: expenseObjId,
        title: newExpTitle,
        amount: resolvedAmount,
        category: newExpCategory,
        type: newExpType,
        date: newExpDate || new Date().toISOString().split("T")[0],
        recordedBy: activeAdmin?.name || "সুপার এডমিন",
        totalAmount: totalAmt,
        paidAmount: paidAmt,
        dueAmount: dueAmt,
        merchantName: merchant
      };

      await setDoc(doc(db, "expenses", expenseObjId), newExpense);

      // Notification
      let notifMessage = `বিবরণ: ${newExpense.title} বাবদ মোট ৳${newExpense.amount} টাকার হিসাব ক্যাশ লেজারে অন্তর্ভুক্ত হয়েছে।`;
      if (newExpType === "Expense" && isPartialPayment) {
        notifMessage = `বিবরণ: ${newExpense.title} ক্রয় (${merchant || "দোকানদার"})। মোট বাজারমূল্য ৳${totalAmt}, পরিশোধিত ৳${paidAmt}, বকেয়া রয়েছে বাকী ৳${dueAmt}।`;
      }

      await addDoc(collection(db, "notifications"), {
        id: `notif_${Date.now()}`,
        title: newExpType === "Expense" ? "নতুন পরিচালন ব্যয়" : "অতিরিক্ত অনুদান/আয়",
        message: notifMessage,
        type: "General",
        createdAt: new Date().toISOString(),
        read: false,
      } as NotificationItem);

      // Reset
      setNewExpTitle("");
      setNewExpAmount(0);
      setExpTotalAmount(0);
      setExpPaidAmount(0);
      setExpMerchantName("");
      setIsPartialPayment(false);
      setNewExpDate(runningDate);
      setIsAddingExpense(false);
      
      setTimeout(() => {
        setIsSubmittingExpense(false);
        showAlert("লেনদেনটি সফলভাবে ক্যাশ বহিতে পোস্টিং করা হয়েছে!", "লেনদেন পোস্টিং সম্পন্ন", "success");
      }, 500);
    } catch (err) {
      console.error("Failed to post transaction ledger:", err);
      showAlert("ক্যাশ বহিতে পোস্টিং ব্যর্থ হয়েছে। ডাটাবেস পরীক্ষা করুন।", "ত্রুটি", "error");
      setIsSubmittingExpense(false);
    }
  };

  // Add customized sector/category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      showAlert("দয়া করে খাতের নাম লিখুন।", "তথ্য অসম্পূর্ণ", "alert");
      return;
    }
    setIsSubmittingCategory(true);
    try {
      const catId = `cat_${Date.now()}`;
      await setDoc(doc(db, "expense_categories", catId), {
        id: catId,
        name: newCategoryName.trim(),
        type: newCategoryType,
        createdAt: new Date().toISOString()
      });
      const nameSaved = newCategoryName;
      setNewCategoryName("");
      setIsAddingCategory(false);
      setTimeout(() => {
        setIsSubmittingCategory(false);
        showAlert(`নতুন খাত/ক্যাটাগরি "${nameSaved}" সফলভাবে তৈরি হয়েছে!`, "খাত যোগ সম্পন্ন", "success");
      }, 500);
    } catch (err) {
      console.error("Failed to append custom category:", err);
      showAlert("খাত যোগ করতে সমস্যা হয়েছে।", "ত্রুটি", "error");
      setIsSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    if (!confirm(`আপনি কি সত্যিই "${getExpenseCategoryInBengali(catName)}" খাতটি ডিলেট করতে চান?`)) return;
    try {
      await deleteDoc(doc(db, "expense_categories", catId));
      showAlert(`খাত "${getExpenseCategoryInBengali(catName)}" সফলভাবে ডিলেট করা হয়েছে।`, "ডিলেট সম্পন্ন", "success");
    } catch (err) {
      console.error("Failed to delete category:", err);
      showAlert("খাত ডিলেট করতে সমস্যা হয়েছে।", "ত্রুটি", "error");
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategoryId || !editingCategoryName.trim()) return;
    try {
      await updateDoc(doc(db, "expense_categories", editingCategoryId), {
        name: editingCategoryName.trim(),
        type: editingCategoryType,
      });
      setEditingCategoryId(null);
      setEditingCategoryName("");
      showAlert(`খাত সফলভাবে পরিবর্তন করা হয়েছে!`, "হালনাগাদ সম্পন্ন", "success");
    } catch (err) {
      console.error("Failed to update category:", err);
      showAlert("খাত হালনাগাদ করতে সমস্যা হয়েছে।", "ত্রুটি", "error");
    }
  };

  // Pay outstanding vendor dues
  const handleRepayVendorDue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDueExpense || repayAmount <= 0) return;
    if (repayAmount > (payingDueExpense.dueAmount || 0)) {
      showAlert("পরিশোধের পরিমাণ অবশিষ্ট বকেয়ার চেয়ে বেশি হতে পারে না!", "ভুল তথ্য", "error");
      return;
    }
    try {
      const currentPaid = payingDueExpense.paidAmount || payingDueExpense.amount;
      const currentTotal = payingDueExpense.totalAmount || payingDueExpense.amount;
      const newPaid = currentPaid + repayAmount;
      const remainingDue = Math.max(0, currentTotal - newPaid);

      const updatedExpense: Expense = {
        ...payingDueExpense,
        paidAmount: newPaid,
        dueAmount: remainingDue,
        amount: newPaid, // actual cash recorded is the total cash paid out
      };

      await setDoc(doc(db, "expenses", payingDueExpense.id), updatedExpense);

      // Notification
      await addDoc(collection(db, "notifications"), {
        id: `notif_${Date.now()}`,
        title: "দোকানদারের বকেয়া পরিশোধ",
        message: `${payingDueExpense.title} বাবদ ${payingDueExpense.merchantName || "বিক্রেতা"}-কে অতিরিক্ত ৳${repayAmount} বকেয়া পরিশোধ করা হয়েছে। বকেয়া বাকি আছে: ৳${remainingDue}।`,
        type: "General",
        createdAt: new Date().toISOString(),
        read: false,
      } as NotificationItem);

      showAlert(`ধন্যবাদ! বিক্রেতা "${payingDueExpense.merchantName || "বিক্রেতা"}"-কে সফলভাবে ৳${repayAmount} পরিশোধ করা হয়েছে।`, "বকেয়া আপডেট সম্পন্ন", "success");
      setPayingDueExpense(null);
      setRepayAmount(0);
    } catch (err) {
      console.error("Failed to pay supplier due amount:", err);
      showAlert("বকেয়া পরিশোধ বুকিং ব্যর্থ হয়েছে।", "ত্রুটি", "error");
    }
  };

  // Add/Edit customized billing package rules
  const handleAddPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName.trim()) {
      showAlert("দয়া করে প্যাকেজের নাম লিখুন।", "তথ্য অসম্পূর্ণ", "alert");
      return;
    }
    if (newPkgPrice <= 0) {
      showAlert("দয়া করে প্যাকেজের সঠিক মূল্য লিখুন।", "তথ্য অসম্পূর্ণ", "alert");
      return;
    }

    setIsSubmittingPackage(true);
    try {
      // Dynamic ID generation if not editing
      const pkgId = editingPkgId || `pkg_${Date.now()}`;
      
      const newPkg: HostelPackage = {
        id: pkgId,
        name: newPkgName,
        price: Number(newPkgPrice),
        foodSystem: newPkgMeals,
        mealCount: Number(newPkgMealCount),
        facilities: typeof newPkgFacilities === "string" 
          ? newPkgFacilities.split(",").map((s) => s.trim()).filter(Boolean)
          : newPkgFacilities,
        status: newPkgStatus,
      };

      await setDoc(doc(db, "packages", pkgId), newPkg);
      setIsAddingPackage(false);
      setEditingPkgId(null);
      
      setTimeout(() => {
        setIsSubmittingPackage(false);
        showAlert("প্যাকেজ সংক্রান্ত তথ্য সফলভাবে সংরক্ষণ করা হয়েছে!", "সফল", "success");
      }, 500);
    } catch (err) {
      console.error("Failed to setup package tier:", err);
      showAlert("প্যাকেজ সংরক্ষণ করতে ব্যর্থ হয়েছে।", "ত্রুটি", "error");
      setIsSubmittingPackage(false);
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    const isDefault = ["basic", "standard", "premium", "vip"].includes(packageId.toLowerCase());
    const confirmMsg = isDefault 
      ? "এটি একটি সিস্টেম ডিফল্ট প্যাকেজ। আপনি কি সত্যিই এটি ডিলিট করতে চান?" 
      : "আপনি কি নিশ্চিতভাবে এই প্যাকেজটি ডিলিট করতে চান?";
    
    showConfirm(
      confirmMsg,
      async () => {
        try {
          await deleteDoc(doc(db, "packages", packageId));
          showAlert("প্যাকেজটি সফলভাবে মুছে ফেলা হয়েছে!", "প্যাকেজ ডিলিট সম্পন্ন", "success");
        } catch (err) {
          console.error("Failed to delete package:", err);
          showAlert("প্যাকেজ মুছতে ব্যর্থ হয়েছে।", "ত্রুটি", "error");
        }
      },
      "প্যাকেজ মুছে ফেলার নিশ্চিতকরণ"
    );
  };

  const handleToggleReadNotif = async (notifId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notifId), { read: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearDatabase = async () => {
    showConfirm(
      "আপনি কি নিশ্চিত যে আপনি সমস্ত ডেমো ডাটা (রুম, সিটস, মেম্বার এবং লেনদেনের হিসাব) মুছে ফেলে সম্পূর্ণ ফ্রেশ প্রোডাকশন ডাটাবেস তৈরি করতে চান?\nএই অ্যাকশনটি সফল হলে এই ডেমোগুলো চিরতরে মুছে যাবে।",
      async () => {
        setDbActionLoading(true);
        setDbActionStatus(null);
        try {
          await clearDatabaseRoomsMembersAndLogs();
          setDbActionStatus({ 
            type: "success", 
            message: "অভিনন্দন! ডেমো ডাটাবেস সফলভাবে পরিষ্কার করা হয়েছে। আপনার ব্যাচেলর পয়েন্ট হোস্টেল অ্যাপ্লিকেশন এখন সম্পূর্ণ ফ্রেশ লাইভ সিস্টেম হিসেবে ব্যবহার করার জন্য প্রস্তুত।" 
          });
        } catch (err) {
          console.error(err);
          setDbActionStatus({ 
            type: "error", 
            message: "ডাটাবেস পরিষ্কার করতে ব্যর্থ হয়েছে। দয়া করে ফায়ারবেস রুলস বা ইন্টারনেট কানেকশন চেক করুন।" 
          });
        } finally {
          setDbActionLoading(false);
        }
      },
      "ডাটাবেস রিসেট নিশ্চিতকরণ"
    );
  };

  const handleSeedDemoData = async () => {
    setDbActionLoading(true);
    setDbActionStatus(null);
    try {
      await seedDemoTemplateData();
      setDbActionStatus({ 
        type: "success", 
        message: "টেমপ্লেট ডেমো ডাটা ডাটাবেসে অত্যন্ত সুন্দরভাবে রিলোড করা হয়েছে। ড্যাশবোর্ড এখন ডেমো ভিজুয়ালাইজেশন প্রদর্শন করার জন্য প্রস্তুত।" 
      });
    } catch (err) {
      console.error(err);
      setDbActionStatus({ 
        type: "error", 
        message: "টেমপ্লেট ডাটা লোড করতে সমস্যা হয়েছে। দয়া করে আপনার ফায়ারবেস সেটিংস যাচাই করুন।" 
      });
    } finally {
      setDbActionLoading(false);
    }
  };

  // Calculations for Admin board overview
  const totalSeatsCount = seats.length;
  const seatStatusCounts = {
    available: seats.filter((s) => s.status === "Available").length,
    booked: seats.filter((s) => s.status === "Booked").length,
    reserved: seats.filter((s) => s.status === "Reserved").length,
    maintenance: seats.filter((s) => s.status === "Maintenance").length,
  };

  const totalDuesAmount = members
    .filter((m) => m.dueAmount > 0 && m.status === "Active")
    .reduce((sum, m) => sum + m.dueAmount, 0);
  const totalIncomePaid = payments
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalExpensePaid = expenses
    .filter((e) => e.type === "Expense")
    .reduce((sum, e) => sum + e.amount, 0);

  // Filtered members mapping representation
  const activeSelectedMember = members.find((m) => m.id === selectedMemberId);

  const filteredMembersList = members.filter((m) => {
    const searchLower = memberSearch.toLowerCase();
    const matchesSearch =
      m.fullName.toLowerCase().includes(searchLower) ||
      m.phone.includes(memberSearch) ||
      (m.roomNo && m.roomNo.toLowerCase().includes(searchLower)) ||
      (m.seatNo && m.seatNo.toLowerCase().includes(searchLower));
    const matchesStatus =
      memberStatusFilter === "All" ||
      (memberStatusFilter === "Active" && m.status === "Active") ||
      (memberStatusFilter === "Inactive" && m.status === "Inactive");

    return matchesSearch && matchesStatus;
  });

  // Calculate leaves alerts listings (automatic check out monitor)
  const todayDateObj = new Date();
  const checkoutAlerts = members.filter((m) => {
    if (!m.leavingDate || m.status !== "Active") return false;
    const lDate = new Date(m.leavingDate);
    const fifteenDays = new Date();
    fifteenDays.setDate(todayDateObj.getDate() + 15);
    return lDate >= todayDateObj && lDate <= fifteenDays;
  });

  // Calculate upcoming vacancies for next month
  const nextMonthVacancyMembers = members.filter((m) => m.status === "Active" && m.leavingNextMonth === true);

  const nextMonthVacanciesByRoom: { [roomNo: string]: number } = {};
  nextMonthVacancyMembers.forEach((m) => {
    if (m.roomNo) {
      nextMonthVacanciesByRoom[m.roomNo] = (nextMonthVacanciesByRoom[m.roomNo] || 0) + 1;
    }
  });

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  const getPackageLabelInBengali = (pkgName: string) => {
    switch (pkgName) {
      case "Basic": return "बेसिक (Basic)";
      case "Standard": return "স্ট্যান্ডার্ড (Standard)";
      case "Premium": return "প্রিমিয়াম (Premium)";
      case "VIP": return "ভিআইপি (VIP)";
      default: return pkgName;
    }
  };

  const getMonthInBengali = (monthStr: string) => {
    let result = monthStr;
    result = result.replace("January", "জানুয়ারি").replace("Jan", "জানু");
    result = result.replace("February", "ফেব্রুয়ারি").replace("Feb", "ফেব্রু");
    result = result.replace("March", "মার্চ").replace("Mar", "মার্চ");
    result = result.replace("April", "এপ্রিল").replace("Apr", "এপ্রি");
    result = result.replace("May", "মে");
    result = result.replace("June", "জুন").replace("Jun", "জুন");
    result = result.replace("July", "জুলাই").replace("Jul", "জুলাই");
    result = result.replace("August", "আগস্ট").replace("Aug", "আগ");
    result = result.replace("September", "সেপ্টেম্বর").replace("Sep", "সেপ্টে");
    result = result.replace("October", "অক্টোবর").replace("Oct", "অক্টো");
    result = result.replace("November", "নভেম্বর").replace("Nov", "নভে");
    result = result.replace("December", "ডিসেম্বর").replace("Dec", "ডিসে");
    return result;
  };

  const getPaymentTypeInBengali = (type: string) => {
    switch (type) {
      case "AdvanceBooking": return "ক) অগ্রিম বুকিং";
      case "Package1": return "খ) প্যাকেজ ১";
      case "Package2": return "গ) প্যাকেজ ২";
      case "Package3": return "ঘ) প্যাকেজ ৩";
      case "Package4": return "ঙ) প্যাকেজ ৪";
      case "SeatRent":
      case "Basic":
        return "চ) সিট ভাড়া";
      case "Penalty": return "ছ) জরিমানা/পেনাল্টি";
      case "OldGoodsSale": return "জ) পুরাতন মালামাল বিক্রয়";
      case "Rent": return "রুম ভাড়া (সাধারণ)";
      case "Food": return "খাবারের বিল";
      default: return type || "অন্যান্য";
    }
  };

  const getPaymentMethodInBengali = (method: string) => {
    switch (method) {
      case "bKash": return "বিকাশ";
      case "Nagad": return "নগদ";
      case "Rocket": return "রকেট";
      case "Cash": return "ক্যাশ";
      default: return method;
    }
  };

  const getExpenseCategoryInBengali = (catName: string) => {
    switch (catName) {
      case "Food": return "বাজার / খাবার রসদ";
      case "Electricity": return "বিদ্যুৎ বিল";
      case "Gas": return "গ্যাস বিল";
      case "WiFi": return "ইন্টারনেট বিল";
      case "Salary": return "বুয়া/স্টাফ বেতন";
      case "Maintenance": return "রক্ষণাবেক্ষণ";
      case "Others": return "অন্যান্য খুচরা খরচ";
      case "Room Rent": return "সিট ও রুম ভাড়া আদায়";
      case "Food Payment": return "খাবার বিল আদায়";
      case "AdvanceBooking": return "ক) অগ্রিম বুকিং ফি আদায়";
      case "Package1": return "খ) প্যাকেজ ১ আদায়";
      case "Package2": return "গ) প্যাকেজ ২ আদায়";
      case "Package3": return "ঘ) প্যাকেজ ৩ আদায়";
      case "Package4": return "ঙ) প্যাকেজ ৪ আদায়";
      case "SeatRent": return "চ) সিট ভাড়া আদায়";
      case "Penalty": return "ছ) জরিমানা / পেনাল্টি আদায়";
      case "OldGoodsSale": return "জ) পুরাতন মালামাল বিক্রয়";
      default: return catName;
    }
  };

  if (!userSession) {
    return <SplashAndAuth onAuthSuccess={handleAuthComplete} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex" id="hostel_management_app">
      
      {/* 2. Left Sidebar Panel */}
      <aside className="w-64 bg-emerald-950 text-white flex-col shrink-0 hidden md:flex font-sans border-r border-emerald-900 z-10">
        <div className="p-5 border-b border-emerald-900 flex flex-col items-center justify-center bg-slate-950/25">
          <BachelorPointLogo size="sm" theme="dark" />

          {/* Connected User identity card */}
          {activeAdmin && (
            <div className="mt-4 w-full p-3 bg-emerald-900/40 rounded-xl border border-emerald-800/40 text-xs">
              <span className="text-[9px] font-bold text-emerald-400 block tracking-widest">
                {activeAdmin.role === "Super Admin" ? "সুপার এডমিন (Super Admin)" : "ম্যানেজার (Admin Manager)"}
              </span>
              <p className="font-semibold text-white truncate max-w-[180px]">{activeAdmin.name}</p>
            </div>
          )}
        </div>

        {/* Navigation lists */}
        <nav className="p-4 space-y-1.5 flex-1">
          {[
            { id: "dashboard", label: "স্মার্ট ড্যাশবোর্ড", icon: Home },
            { id: "rooms", label: "রুম এবং সিট লেআউট", icon: Building },
            { id: "members", label: "বর্ডার প্রোফাইল", icon: Users },
            { id: "packages", label: "পরিশোধের প্যাকেজ", icon: Package },
            { id: "payments", label: "ক্যাশ আদায় ও রসিদ", icon: CreditCard },
            { id: "expenses", label: "পরিচালন ব্যয় ও হিসাব", icon: DollarSign },
            { id: "reports", label: "রিপোর্ট এবং খতিয়ান", icon: FileSpreadsheet },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setDashboardTab(item.id as any)}
                className={`w-full text-left px-4.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                  dashboardTab === item.id
                    ? "bg-emerald-600/20 text-emerald-300 border-l-4 border-emerald-500 pl-3.5"
                    : "text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout button */}
        <div className="p-4 border-t border-emerald-900 shrink-0">
          <button
            onClick={handleSignOut}
            className="w-full py-2.5 px-4 bg-emerald-900/60 hover:bg-red-950/40 text-emerald-300 hover:text-red-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            সিস্টেম লগ-আউট করুন
          </button>
        </div>
      </aside>

      {/* 3. Main Dashboard Board Content Frame */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        
        {/* Top interactive Action Header */}
        <header className="bg-white px-4 py-3 sm:px-6 border-b border-emerald-50 flex items-center justify-between sticky top-0 z-20 shrink-0">
          <div className="md:hidden flex items-center gap-2">
            <BachelorPointLogo size="sm" variant="icon" theme="light" />
            <span className="text-sm font-black text-emerald-950 font-sans tracking-tight">ব্যাচেলর পয়েন্ট হোস্টেল</span>
          </div>

          <div className="hidden md:block">
            <span className="text-xs text-gray-500">ডাটাবেজ স্ট্যাটাস:</span>
            <span className="text-xs font-bold text-emerald-500 ml-1.5 flex items-center gap-1 inline-flex">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" /> রিয়েল-টাইম ডাটা কানেক্টেড (Live)
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Quick alert indicator */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationCenter(!showNotificationCenter)}
                className="p-2 border rounded-xl hover:bg-slate-50 transition-colors relative cursor-pointer"
              >
                <Bell className="w-4 h-4 text-gray-600" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-[9px] text-white font-extrabold flex items-center justify-center rounded-full">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {/* Notification Center panel */}
              <AnimatePresence>
                {showNotificationCenter && (
                  <>
                    {/* Backdrop cover for click-outside dismissal on mobile */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.5 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowNotificationCenter(false)}
                      className="fixed inset-0 bg-slate-900/40 md:hidden z-40"
                    />

                    <motion.div
                      initial={{ y: "100%", opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: "100%", opacity: 0 }}
                      transition={{ type: "spring", damping: 25, stiffness: 350 }}
                      className="fixed md:absolute bottom-0 md:bottom-auto top-auto md:top-full left-0 md:left-auto right-0 md:right-0 mt-0 md:mt-2.5 w-full md:w-80 max-w-full bg-white border border-slate-150 rounded-t-3xl md:rounded-2xl shadow-2xl md:shadow-xl z-50 p-5 md:p-4 max-h-[80vh] md:max-h-96 overflow-y-auto font-sans"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
                        <span className="text-xs font-bold text-gray-800">ডায়নামিক নোটিফিকেশন সেন্টার</span>
                        <button
                          onClick={() => setShowNotificationCenter(false)}
                          className="text-xs text-emerald-600 font-bold hover:underline cursor-pointer"
                        >
                          বন্ধ করুন
                        </button>
                      </div>
                      <div className="space-y-2">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleToggleReadNotif(notif.id)}
                            className={`p-3 rounded-xl border text-left transition-colors cursor-pointer break-words whitespace-normal ${
                              notif.read ? "bg-slate-50 border-transparent text-gray-400" : "bg-emerald-50/50 border-emerald-100 text-gray-700"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <span className="text-xs font-bold font-sans break-words pr-2">{notif.title}</span>
                              {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1 shrink-0" />}
                            </div>
                            <p className="text-[10px] leading-relaxed mb-1 break-words whitespace-normal text-gray-600">
                              {notif.message}
                            </p>
                            <span className="text-[8px] font-mono block text-gray-400 font-sans">
                              {new Date(notif.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                        {notifications.length === 0 && (
                          <p className="text-xs text-center text-gray-400 italic py-6">কোনো নোটিফিকেশন নেই</p>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Dropdown Options */}
            <select
              value={dashboardTab}
              onChange={(e) => setDashboardTab(e.target.value as any)}
              className="md:hidden text-xs py-1.5 px-3 border border-gray-200 rounded-xl bg-white text-emerald-800 font-bold focus:outline-none"
            >
              <option value="dashboard">স্মার্ট ড্যাশবোর্ড</option>
              <option value="rooms">রুম লেআউট</option>
              <option value="members">বর্ডার সমূহ</option>
              <option value="packages">প্যাকেজ সমূহ</option>
              <option value="payments">আদায়ের হিসাব</option>
              <option value="expenses">খরচের হিসাব</option>
              <option value="reports">পিডিএফ রিপোর্ট</option>
            </select>
          </div>
        </header>

        {/* Dynamic Inner views switch boxes */}
        <div className="flex-1 p-6 space-y-6">
          
          {/* 1. VIEW A: SMART DASHBOARD OVERVIEW */}
          {dashboardTab === "dashboard" && (
            <div className="space-y-6">
              
              {/* Checkout monitor list alert */}
              {checkoutAlerts.length > 0 && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top font-sans">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-amber-900 block font-sans">পূর্বঘোষিত সিট খালি হওয়ার নোটিশ</span>
                      <p className="text-[11px] text-amber-800/95 leading-normal max-w-xl font-sans">
                        {checkoutAlerts[0].fullName} (রুম নম্বর {checkoutAlerts[0].roomNo}, বেড {checkoutAlerts[0].seatNo}) আগামী {checkoutAlerts[0].leavingDate} তারিখে হোস্টেল ত্যাগ করবেন। সিটটি ফাঁকা হওয়ার নোটিশ তালিকায় যুক্ত হয়েছে।
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDashboardTab("rooms")}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[10px] rounded-lg cursor-pointer shrink-0 font-sans"
                  >
                    সিট বরাদ্দ করুন
                  </button>
                </div>
              )}

              {/* Next Month Vacancies Alert Box */}
              {nextMonthVacancyMembers.length > 0 && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top font-sans">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <span className="text-xs font-bold text-emerald-950 block font-sans">পরবর্তী মাসের ভ্যাকেন্সি সতর্কতা (ঝুলন্ত চেকআউট)</span>
                      <div className="text-[11px] text-emerald-800 leading-normal max-w-xl font-sans mt-1 flex flex-wrap gap-2 items-center">
                        <span className="font-bold">আগামী মাসে খালি হবে:</span>
                        {Object.entries(nextMonthVacanciesByRoom).map(([roomNo, count], idx, arr) => (
                          <span key={roomNo} className="bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 font-extrabold text-[#047857]">
                            রুম {roomNo} ({count}টি সিট){idx < arr.length - 1 ? "," : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setDashboardTab("rooms")}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] rounded-lg cursor-pointer shrink-0 font-sans transition-colors"
                  >
                    রুম গ্রিড দেখুন
                  </button>
                </div>
              )}

              {/* Stats Cards Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4" id="stats_cards_grid">
                <div className="bg-white p-5 rounded-xl border border-emerald-50 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="font-sans">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">মোট সক্রিয় বর্ডার</span>
                    <span className="text-lg font-black text-gray-900 block mt-0.5">
                      {members.filter((m) => m.status === "Active").length} জন
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-emerald-50 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                    <Building className="w-6 h-6" />
                  </div>
                  <div className="font-sans">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">ভর্তি সিট সংখ্যা</span>
                    <span className="text-lg font-black text-gray-900 block mt-0.5">
                      {seatStatusCounts.booked} <span className="text-xs text-gray-400 font-bold">/ {totalSeatsCount} টি মোট</span>
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-emerald-50 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="font-sans">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">ফাঁকা সিট সংখ্যা</span>
                    <span className="text-lg font-black text-gray-900 block mt-0.5">{seatStatusCounts.available}টি সিট খালি</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-emerald-50 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div className="font-sans">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">চলতি মাসে আদায়</span>
                    <span className="text-lg font-black text-gray-900 block mt-0.5">৳{totalIncomePaid.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-emerald-50 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600 shrink-0">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div className="font-sans">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">সর্বমোট বকেয়া</span>
                    <span className="text-lg font-black text-red-600 block mt-0.5">৳{totalDuesAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Data visualizations and charts */}
              <DashboardCharts payments={payments} expenses={expenses} seatStatusCounts={seatStatusCounts} />

              {/* Connected Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Boarder Checkouts & status details */}
                <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 flex flex-col max-h-[460px] font-sans">
                  <div className="pb-4 border-b border-gray-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900">বর্ডার কুইক বুক</h3>
                      <p className="text-[10px] text-gray-400">সর্বমোট আদায় এবং অবস্থা</p>
                    </div>
                    <button
                      onClick={() => setIsAddingMember(true)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> বর্ডার এড করুন
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y font-sans py-2">
                    {members.slice(0, 5).map((m) => {
                      const initialLetters = m.fullName.substring(0, 2).toUpperCase();
                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            setSelectedMemberId(m.id);
                            setDashboardTab("members");
                          }}
                          className="py-3 items-center flex justify-between text-xs hover:bg-slate-50/50 px-2 rounded-lg cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 bg-emerald-50 text-emerald-800 font-bold text-[10px] flex items-center justify-center rounded-full shrink-0">
                              {initialLetters}
                            </span>
                            <div>
                              <span className="font-semibold text-gray-800 block truncate max-w-[120px]">{m.fullName}</span>
                              <span className="text-[9px] text-gray-400">রুম {m.roomNo} • বেড {m.seatNo}</span>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.dueAmount > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {m.dueAmount > 0 ? `৳${m.dueAmount} বকেয়া` : "পরিশোধিত"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Billing Receipts ledger */}
                <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 max-h-[460px] flex flex-col font-sans">
                  <div className="pb-4 border-b border-gray-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900">সাম্প্রতিক আদায়কৃত বিল ও ক্যাশ রসিদ</h3>
                      <p className="text-[10px] text-gray-400">রসিদ ও পরিশোধ খতিয়ান হিসেব</p>
                    </div>

                    <button
                      onClick={() => setDashboardTab("payments")}
                      className="text-xs text-emerald-600 font-bold hover:underline cursor-pointer"
                    >
                      সব রসিদ তথ্য
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#f8fafc]/60 text-gray-400 text-[10px] uppercase font-bold border-b">
                        <tr>
                          <th className="p-3">নাম ও আইডি</th>
                          <th className="p-3">মাস</th>
                          <th className="p-3 text-center">পরিশোধ মাধ্যম</th>
                          <th className="p-3 text-right">টাকার পরিমাণ</th>
                          <th className="p-3">চালান</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-gray-700 font-sans">
                        {payments.slice(0, 5).map((p) => (
                          <tr key={p.id}>
                            <td className="p-3">
                              <span className="font-semibold text-slate-800 block">{p.memberName}</span>
                              <span className="text-[9px] text-gray-400 font-mono">আইডি: {p.id.substring(0, 8).toUpperCase()}</span>
                            </td>
                            <td className="p-3 text-gray-500 font-sans">{getMonthInBengali(p.month)}</td>
                            <td className="p-2 text-center text-emerald-800 font-bold">{getPaymentMethodInBengali(p.method)}</td>
                            <td className="p-3 text-right font-extrabold text-emerald-750">৳{p.amount}</td>
                            <td className="p-3">
                              <button
                                onClick={() => setSelectedInvoice(p)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg text-[10px] text-gray-600 font-bold cursor-pointer transition-colors"
                              >
                                রসিদ (Invoice)
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* 2. VIEW B: ROOM & SEATS SETUPS */}
          {dashboardTab === "rooms" && (
            <RoomSelector
              rooms={rooms}
              seats={seats}
              members={members}
              onAddRoom={handleAddRoom}
              onUpdateSeatStatus={handleUpdateSeatStatus}
              onSelectMember={(mId) => {
                setSelectedMemberId(mId);
                setDashboardTab("members");
              }}
              onDeleteRoom={handleDeleteRoom}
              onAddSeat={handleAddSeat}
              onDeleteSeat={handleDeleteSeat}
              onUpdateSeatRent={handleUpdateSeatRent}
            />
          )}

          {/* 3. VIEW C: ADVANCED MEMBER PROFILES */}
          {dashboardTab === "members" && (
            <div className="space-y-6">
              
              {/* Member filters controls toolbar */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs font-sans">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">বোর্ডিং বর্ডার সমূহ</h2>
                  <p className="text-xs text-gray-400 font-sans">বর্ডারদের তথ্য এবং বকেয়ার রসিদ ট্র্যাক করুন</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400 font-sans" />
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="নাম, রুম বা সিট নম্বর দিয়ে খুঁজুন..."
                      className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:border-emerald-600 w-60"
                    />
                  </div>

                  <div className="flex gap-1.5">
                    {[
                      { id: "All", label: "সবাই" },
                      { id: "Active", label: "সক্রিয়" },
                      { id: "Inactive", label: "নিষ্ক্রিয়" }
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setMemberStatusFilter(st.id as any)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${
                          memberStatusFilter === st.id
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                            : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-gray-500"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setIsBroadcasting(true)}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-extrabold font-sans flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                  >
                    <Megaphone className="w-4 h-4 text-emerald-600" /> ব্রডকাস্ট বার্তা
                  </button>

                  <button
                    onClick={() => setIsAddingMember(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-750 text-white rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" /> বর্ডার চেক-ইন
                  </button>
                </div>
              </div>

              {/* Members card layout details split view */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
                
                {/* Left Active members scroll list block */}
                <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-slate-100 shadow-xs max-h-[70vh] overflow-y-auto">
                  <div className="border-b pb-3 mb-2 px-2 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-serif">বর্ডার সূচি</span>
                    <span className="text-xs font-bold text-emerald-800">{filteredMembersList.length} জন পাওয়া গেছে</span>
                  </div>

                  <div className="space-y-1.5">
                    {filteredMembersList.map((m) => {
                      const isSelected = m.id === selectedMemberId;
                      return (
                        <div
                          key={m.id}
                          onClick={() => setSelectedMemberId(m.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? "bg-emerald-50/20 border-emerald-400 shadow-sm"
                              : "bg-white border-transparent hover:bg-slate-50/70"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={m.photoUrl}
                              alt={m.fullName}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-xl object-cover"
                            />
                            <div>
                              <span className="font-bold text-gray-900 text-xs block">{m.fullName}</span>
                              <span className="text-[10px] text-gray-400 block font-sans">
                                রুম {m.roomNo} ∙ বেড {m.seatNo}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            {m.dueAmount > 0 ? (
                              <span className="text-[10px] text-red-600 font-extrabold block">
                                ৳{m.dueAmount} বকেয়া আছে
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-bold block">পরিশোধ সম্পন্ন</span>
                            )}
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{getPackageLabelInBengali(m.packageName)}</span>
                          </div>
                        </div>
                      );
                    })}

                    {filteredMembersList.length === 0 && (
                      <p className="text-xs italic text-center p-8 text-gray-400 font-sans">কোনো বর্ডার খুঁজে পাওয়া যায়নি</p>
                    )}
                  </div>
                </div>

                {/* Right Active Profile detailed ledger view block */}
                <div className="lg:col-span-7">
                  {activeSelectedMember ? (
                    <MemberProfileCard
                      member={activeSelectedMember}
                      packages={packages.length > 0 ? packages : DEFAULT_PACKAGES}
                      seats={seats}
                      onPaymentCollect={handlePaymentCollect}
                      onUpdateMember={handleUpdateMemberProfile}
                    />
                  ) : (
                    <div className="p-16 border rounded-2xl bg-white text-center text-gray-400">
                      <Users className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                      <p className="text-sm font-semibold">বোর্ডারের বিষদ তথ্য এবং বকেয়ার রসিদ দেখতে তালিকা থেকে নির্বাচন করুন</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* 4. VIEW D: BILLING HOSTEL PACKAGES */}
          {dashboardTab === "packages" && (
            <div className="space-y-6" id="packages_layout_panel">
              <div className="flex justify-between items-center flex-col sm:flex-row gap-4 font-sans">
                <div>
                  <h2 className="text-2xl font-bold text-gray-950 font-sans tracking-tight">হোস্টেল সাবস্ক্রিপশন ও প্যাকেজ</h2>
                  <p className="text-xs text-gray-500 font-sans">রুম ভাড়ার হার, ডাইনিং খাবার ব্যবস্থা এবং হোস্টেল সুবিধা সমূহ কনফিগার ও অ্যাক্টিভেশন কন্ট্রোল করুন।</p>
                </div>

                <button
                  onClick={() => {
                    setEditingPkgId(null);
                    setNewPkgName("");
                    setNewPkgPrice(3500);
                    setNewPkgMeals("Lunch + Dinner Included");
                    setNewPkgMealCount(2);
                    setNewPkgFacilities("Shared Washroom, High-speed WiFi, Ceiling Fan, Daily Cleaning");
                    setNewPkgStatus("Active");
                    setIsAddingPackage(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-750 text-white rounded-xl text-xs font-bold font-sans cursor-pointer shadow-xs self-start flex items-center gap-1.5 hover:scale-[1.01] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  নতুন প্যাকেজ যুক্ত করুন
                </button>
              </div>

              {/* Package columns grids */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
                {(packages.length > 0 ? packages : DEFAULT_PACKAGES).map((pkg) => {
                  const isInactive = pkg.status === "Inactive";
                  return (
                    <div 
                      key={pkg.id} 
                      className={`bg-white rounded-2xl border ${
                        isInactive ? "border-slate-200 bg-slate-50/70 opacity-80" : "border-slate-100 shadow-xs"
                      } p-5 relative overflow-hidden flex flex-col justify-between min-h-[380px] transition-all duration-200 hover:shadow-md`}
                    >
                      
                      <div>
                        {pkg.name === "VIP" && (
                          <div className="absolute top-0 right-0 bg-amber-400 text-amber-950 font-bold text-[9px] uppercase tracking-wider py-1 px-3 rounded-bl-xl">
                            প্রিমিয়াম ভিআইপি সেবা
                          </div>
                        )}

                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-emerald-600 font-mono tracking-widest uppercase">
                            {getPackageLabelInBengali(pkg.name)}
                          </span>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md ${
                            isInactive ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
                          }`}>
                            {isInactive ? "নিষ্ক্রিয়" : "সক্রিয়"}
                          </span>
                        </div>
                        
                        <div className="flex items-baseline mt-1">
                          <span className="text-3xl font-black text-gray-900 font-sans">৳{pkg.price}</span>
                          <span className="text-xs text-gray-400 font-medium ml-1">/ মাস</span>
                        </div>

                        {/* Meal count tracker details indicator */}
                        <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                          <span className="text-[9px] font-bold text-gray-400 block tracking-wider uppercase">খাবার এবং রান্নাঘর</span>
                          <span className="text-xs font-bold text-slate-800">{pkg.foodSystem}</span>
                          <span className="text-[10px] text-emerald-700 font-semibold block">প্রতিদিন {pkg.mealCount} বেলা খাবার অন্তর্ভুক্ত</span>
                        </div>

                        {/* Facilities listings */}
                        <ul className="mt-5 space-y-2">
                          {pkg.facilities && pkg.facilities.map((fac, idx) => (
                            <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                              <span>{fac}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-5 border-t border-dashed border-gray-100 mt-6 space-y-3">
                        <div className="flex justify-between items-center text-[10px] text-gray-400">
                          <span>স্বয়ংক্রিয় মাসিক বিলিং</span>
                          <span className="font-semibold text-slate-800">আইডি: {pkg.id}</span>
                        </div>
                        
                        <div className="flex gap-2 w-full pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPkgId(pkg.id);
                              setNewPkgName(pkg.name);
                              setNewPkgPrice(pkg.price);
                              setNewPkgMeals(pkg.foodSystem);
                              setNewPkgMealCount(pkg.mealCount);
                              setNewPkgFacilities(Array.isArray(pkg.facilities) ? pkg.facilities.join(", ") : "");
                              setNewPkgStatus(pkg.status || "Active");
                              setIsAddingPackage(true);
                            }}
                            className="flex-1 py-1 px-2.5 bg-slate-50 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1"
                            title="প্যাকেজের তথ্য পরিবর্তন করুন"
                          >
                            <Edit2 className="w-3 h-3" />
                            এডিট করুন
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePackage(pkg.id)}
                            className="p-1 px-2 bg-red-50 border border-red-100 hover:bg-red-600 text-red-600 hover:text-white rounded-lg cursor-pointer transition-all"
                            title="প্যাকেজ ডিলিট করুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. VIEW E: CASH COLLECTIONS RECEIPT LOGS */}
          {dashboardTab === "payments" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-6" id="payments_ledg_view">
              <div className="font-sans">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight font-sans">ভাড়া ও বিল আদায় খতিয়ান</h2>
                <p className="text-xs text-gray-450 font-sans">আবাসিক বর্ডারদের পরিশোধিত ভাড়ার ক্যাশ আদায়ের সম্পূর্ণ বিবরণ।</p>
              </div>

              {/* Income Categories Stats & Filter Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-sans" id="income_categories_filter_grid">
                {[
                  { id: "All", label: "সব খাত (All)", color: "border-slate-200 hover:bg-slate-50 text-slate-850" },
                  { id: "AdvanceBooking", label: "অগ্রিম বুকিং", color: "border-amber-200 hover:bg-amber-50/50 text-amber-805" },
                  { id: "Package1", label: "প্যাকেজ ১", color: "border-blue-200 hover:bg-blue-50/50 text-blue-805" },
                  { id: "Package2", label: "প্যাকেজ ২", color: "border-indigo-200 hover:bg-indigo-50/50 text-indigo-805" },
                  { id: "Package3", label: "প্যাকেজ ৩", color: "border-purple-200 hover:bg-purple-50/50 text-purple-805" },
                  { id: "Package4", label: "প্যাকেজ ৪", color: "border-fuchsia-200 hover:bg-fuchsia-50/50 text-fuchsia-805" },
                  { id: "SeatRent", label: "সিট ভাড়া", color: "border-emerald-200 hover:bg-emerald-50/50 text-emerald-805" },
                  { id: "Penalty", label: "জরিমানা/ ফেনাল্টি ফাইন", color: "border-rose-200 hover:bg-rose-50/50 text-rose-805" },
                  { id: "OldGoodsSale", label: "পুরাতন মালামাল বিক্রয়", color: "border-orange-200 hover:bg-orange-50/50 text-orange-805" },
                  { id: "Food", label: "খাবারের বিল", color: "border-teal-200 hover:bg-teal-50/50 text-teal-805" },
                ].map((cat) => {
                  const isSelected = paymentTypeFilter === cat.id;
                  const totalAmt = payments
                    .filter((p) => {
                      if (cat.id === "All") return true;
                      if (cat.id === "SeatRent") {
                        return p.type === "SeatRent" || p.type === "Basic" || p.type === "Rent";
                      }
                      return p.type === cat.id;
                    })
                    .reduce((sum, p) => sum + p.amount, 0);

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setPaymentTypeFilter(cat.id)}
                      className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${cat.color} ${
                        isSelected
                          ? "ring-2 ring-offset-2 ring-emerald-600 bg-emerald-50/10 shadow-sm font-bold"
                          : "bg-white/90"
                      }`}
                    >
                      <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">
                        {cat.label}
                      </span>
                      <span className="text-base font-black block mt-1 font-sans">
                        ৳{totalAmt.toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>

              {(() => {
                const filteredList = payments.filter((p) => {
                  if (paymentTypeFilter === "All") return true;
                  if (paymentTypeFilter === "SeatRent") {
                    return p.type === "SeatRent" || p.type === "Basic" || p.type === "Rent";
                  }
                  return p.type === paymentTypeFilter;
                });

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans">
                      <thead className="bg-[#f8fafc]/80 text-gray-500 uppercase text-[10px] font-bold border-b">
                        <tr>
                          <th className="p-3">বোর্ডার নাম</th>
                          <th className="p-3 text-center">রুম এবং বেড</th>
                          <th className="p-3 text-center">আদায়ের মাস</th>
                          <th className="p-3 text-center">আদায়ের খাত</th>
                          <th className="p-3 text-center">পরিশোধ মাধ্যম</th>
                          <th className="p-3 text-center">লেনদেন আইডি (Trx ID)</th>
                          <th className="p-3 text-right">আদায়কৃত টাকা</th>
                          <th className="p-3">রসিদ ও চালান</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-gray-700 font-sans">
                        {filteredList.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/20">
                            <td className="p-3 font-semibold text-gray-900">{p.memberName}</td>
                            <td className="p-3 text-center font-mono text-gray-500">
                              রুম: {p.roomNo} ({p.seatNo})
                            </td>
                            <td className="p-3 text-center text-gray-500">{getMonthInBengali(p.month)}</td>
                            <td className="p-3 text-center font-bold text-indigo-750">
                              {getPaymentTypeInBengali(p.type)}
                            </td>
                            <td className="p-3 text-center text-emerald-800 font-bold">{getPaymentMethodInBengali(p.method)}</td>
                            <td className="p-3 text-center text-gray-400 font-mono uppercase">{p.transactionId}</td>
                            <td className="p-3 text-right font-extrabold text-emerald-700">৳{p.amount}</td>
                            <td className="p-3">
                              <button
                                onClick={() => setSelectedInvoice(p)}
                                className="bg-slate-50 hover:bg-emerald-50 border hover:text-emerald-800 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                              >
                                ডিজিটাল রসিদ
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredList.length === 0 && (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-gray-400 italic">এই খাতে কোনো আদায়ের তথ্য পোস্ট করা নেই।</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

          {/* 6. VIEW F: FINANCIAL LEDGER TRACKER */}
          {dashboardTab === "expenses" && (() => {
            const MONTHS_LIST = [
              { id: "2026-01", label: "জানুয়ারি ২০২৬" },
              { id: "2026-02", label: "ফেব্রুয়ারি ২০২৬" },
              { id: "2026-03", label: "মার্চ ২০২৬" },
              { id: "2026-04", label: "এপ্রিল ২০২৬" },
              { id: "2026-05", label: "মে ২০২৬" },
              { id: "2026-06", label: "জুন ২০২৬" },
              { id: "2026-07", label: "জুলাই ২০২৬" },
              { id: "2026-08", label: "আগস্ট ২০২৬" },
              { id: "2026-09", label: "সেপ্টেম্বর ২০২৬" },
              { id: "2026-10", label: "অক্টোবর ২০২৬" },
              { id: "2026-11", label: "নভেম্বর ২০২৬" },
              { id: "2026-12", label: "ডিসেম্বর ২০২৬" },
            ];

            const getMonthYearString = (yearMonth: string) => {
              if (!yearMonth) return "";
              const [year, month] = yearMonth.split("-");
              const monthNames = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
              ];
              const monthIdx = parseInt(month, 10) - 1;
              return `${monthNames[monthIdx]} ${year}`;
            };

            const selectedMonthEng = getMonthYearString(expenseMonthFilter);

            // Calculate monthly income from paid boarder payments
            const monthlyIncomesFromPayments = payments
              .filter((p) => p.status === "Paid" && p.month === selectedMonthEng)
              .reduce((sum, p) => sum + p.amount, 0);

            // Calculate monthly income from direct general income records
            const monthlyIncomesFromGeneral = expenses
              .filter((e) => e.type === "Income" && (!expenseMonthFilter || e.date.startsWith(expenseMonthFilter)))
              .reduce((sum, e) => sum + e.amount, 0);

            const totalMonthlyIncome = monthlyIncomesFromPayments + monthlyIncomesFromGeneral;

            // Calculate monthly expense
            const totalMonthlyExpense = expenses
              .filter((e) => e.type === "Expense" && (!expenseMonthFilter || e.date.startsWith(expenseMonthFilter)))
              .reduce((sum, e) => sum + e.amount, 0);

            const netMonthlyProfit = totalMonthlyIncome - totalMonthlyExpense;

            const displayedExpenses = expenses.filter((e) => {
              if (!expenseMonthFilter) return true;
              return e.date.startsWith(expenseMonthFilter);
            });

            return (
              <div className="space-y-6" id="financial_outflow_ledger">
                <div className="flex justify-between items-center flex-col sm:flex-row gap-4 font-sans">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-950 font-sans tracking-tight">পরিচালন আয় ও ব্যয় ট্র্যাকার</h2>
                    <p className="text-xs text-gray-500 font-sans">হোস্টেলের বাজার, কারেন্ট বিল, বুয়ার বেতন ও অন্যান্য খরচসমূহ নিখুঁতভাবে নিরূপণ করুন।</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setNewExpType("Income");
                        setIsAddingExpense(true);
                      }}
                      className="px-3.5 py-2 bg-[#e8f5e9] hover:bg-[#c8e6c9] text-emerald-900 border border-emerald-200 rounded-xl text-xs font-black font-sans cursor-pointer transition-colors"
                    >
                      + আয় যোগ করুন
                    </button>
                    <button
                      onClick={() => {
                        setNewExpType("Expense");
                        setIsAddingExpense(true);
                      }}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-xl text-xs font-black font-sans cursor-pointer transition-colors"
                    >
                      + ব্যয় যোগ করুন
                    </button>
                  </div>
                </div>

                {/* ১ লাইনের মাসিক সামারি ফিল্টার এবং সারসংক্ষেপ */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-sm font-sans">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-[#374151] font-sans shrink-0">মাসিক অলটারনেটিভ ফিল্টার:</span>
                      <select
                        value={expenseMonthFilter}
                        onChange={(e) => setExpenseMonthFilter(e.target.value)}
                        className="p-2 px-3 bg-[#f8fafc] border border-slate-200 text-xs rounded-xl font-bold font-sans text-gray-700 focus:outline outline-emerald-500 cursor-pointer"
                      >
                        <option value="">সকল মাস (All-time)</option>
                        {MONTHS_LIST.map((m) => (
                          <option key={m.id} value={m.id}>{m.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="text-xs font-bold text-slate-800 bg-[#e8f5e9]/70 p-2.5 px-4 rounded-xl border border-emerald-200 flex flex-wrap gap-x-5 gap-y-1.5 items-center">
                      <span className="font-extrabold text-[#065f46]">
                        {expenseMonthFilter ? MONTHS_LIST.find(m => m.id === expenseMonthFilter)?.label : "সকল সময়ের খতিয়ান"}
                      </span>
                      <span>•</span>
                      <span>মোট আয়: <span className="text-emerald-700 text-sm font-extrabold">৳{totalMonthlyIncome.toLocaleString()}</span></span>
                      <span>•</span>
                      <span>মোট ব্যয়: <span className="text-red-600 text-sm font-extrabold">৳{totalMonthlyExpense.toLocaleString()}</span></span>
                      <span>•</span>
                      <span>অবশিষ্ট লাভ: <span className={`text-sm font-black ${netMonthlyProfit >= 0 ? "text-emerald-800" : "text-rose-700"}`}>৳{netMonthlyProfit.toLocaleString()}</span></span>
                    </div>
                  </div>
                </div>

                {/* DYNAMIC CATEGORY SPEND & REPORTS PANEL */}
                {(() => {
                  // Category Spend Grouping calculation
                  const reportFilteredExpenses = expenses.filter((e) => {
                    if (e.type !== "Expense") return false;
                    if (reportPeriodType === "daily") {
                      return e.date === reportDailyDate;
                    } else if (reportPeriodType === "monthly") {
                      return e.date.startsWith(reportMonthlyPeriod);
                    } else { // yearly
                      return e.date.startsWith(reportYearlyPeriod);
                    }
                  });

                  // Group by category string
                  const categorySpendMap: Record<string, {
                    category: string;
                    totalCost: number;
                    paid: number;
                    due: number;
                    records: Expense[];
                  }> = {};

                  reportFilteredExpenses.forEach((exp) => {
                    const catKey = exp.category || "Others";
                    const costAmt = typeof exp.totalAmount === "number" ? exp.totalAmount : exp.amount;
                    const paidAmt = typeof exp.paidAmount === "number" ? exp.paidAmount : exp.amount;
                    const dueAmt = typeof exp.dueAmount === "number" ? exp.dueAmount : 0;

                    if (!categorySpendMap[catKey]) {
                      categorySpendMap[catKey] = {
                        category: catKey,
                        totalCost: 0,
                        paid: 0,
                        due: 0,
                        records: []
                      };
                    }

                    categorySpendMap[catKey].totalCost += costAmt;
                    categorySpendMap[catKey].paid += paidAmt;
                    categorySpendMap[catKey].due += dueAmt;
                    categorySpendMap[catKey].records.push(exp);
                  });

                  const categorySpendList = Object.values(categorySpendMap)
                    .sort((a, b) => b.totalCost - a.totalCost);

                  const reportTotalSpent = categorySpendList.reduce((sum, item) => sum + item.totalCost, 0);
                  const maxCategorySpend = categorySpendList.length > 0 ? categorySpendList[0].totalCost : 1;

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
                      {/* Left Block: Spend Periodic Analytics */}
                      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-800">
                              <TrendingDown className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-slate-900 leading-none">১. খাত ভিত্তিক খরচের নিখুঁত রিপোর্ট</h3>
                              <span className="text-[10px] text-slate-500">আপনার বর্ডারদের ক্যাটাগরি গ্রুপ অনুযায়ী খরচ পর্যালোচনা করুন</span>
                            </div>
                          </div>

                          {/* Period Selector Buttons */}
                          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                            <button
                              onClick={() => {
                                setReportPeriodType("daily");
                                setReportExpandedCategory(null);
                              }}
                              className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                                reportPeriodType === "daily" ? "bg-white text-slate-950 shadow-xs" : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              দৈনিক
                            </button>
                            <button
                              onClick={() => {
                                setReportPeriodType("monthly");
                                setReportExpandedCategory(null);
                              }}
                              className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                                reportPeriodType === "monthly" ? "bg-white text-slate-950 shadow-xs" : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              মাসিক
                            </button>
                            <button
                              onClick={() => {
                                setReportPeriodType("yearly");
                                setReportExpandedCategory(null);
                              }}
                              className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                                reportPeriodType === "yearly" ? "bg-white text-slate-950 shadow-xs" : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              বাৎসরিক
                            </button>
                          </div>
                        </div>

                        {/* Secondary Filter options depending on type */}
                        <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-semibold">
                          <span className="text-slate-500">রিপোর্ট সময়সীমা নির্বাচন:</span>
                          {reportPeriodType === "daily" && (
                            <input
                              type="date"
                              value={reportDailyDate}
                              onChange={(e) => {
                                setReportDailyDate(e.target.value);
                                setReportExpandedCategory(null);
                              }}
                              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold font-sans text-slate-700 cursor-pointer text-xs"
                            />
                          )}
                          {reportPeriodType === "monthly" && (
                            <select
                              value={reportMonthlyPeriod}
                              onChange={(e) => {
                                setReportMonthlyPeriod(e.target.value);
                                setReportExpandedCategory(null);
                              }}
                              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold font-sans text-slate-700 cursor-pointer text-xs"
                            >
                              {MONTHS_LIST.map((m) => (
                                <option key={m.id} value={m.id}>{m.label}</option>
                              ))}
                            </select>
                          )}
                          {reportPeriodType === "yearly" && (
                            <select
                              value={reportYearlyPeriod}
                              onChange={(e) => {
                                setReportYearlyPeriod(e.target.value);
                                setReportExpandedCategory(null);
                              }}
                              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold font-sans text-slate-700 cursor-pointer text-xs"
                            >
                              <option value="2026">২০২৬ অর্থ বছর</option>
                              <option value="2025">২০২৫ অর্থ বছর</option>
                            </select>
                          )}

                          <span className="ml-auto text-[11px] font-black text-rose-850">
                            মোট খরচ: ৳{reportTotalSpent.toLocaleString()}
                          </span>
                        </div>

                        {/* List Grid Categories */}
                        {categorySpendList.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-400 italic bg-slate-50/50 rounded-xl border border-dashed border-slate-150">
                            এই নির্ধারিত সময়ে কোনো খরচের হিসাব ক্যাশ লেজারে পোস্টিং করা নেই।
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {categorySpendList.map((item) => {
                              const percent = Math.round((item.totalCost / reportTotalSpent) * 100);
                              const isExpanded = reportExpandedCategory === item.category;

                              return (
                                <div
                                  key={item.category}
                                  className="border border-slate-100 rounded-xl p-3.5 hover:border-slate-350 transition-all shadow-xs space-y-2 bg-gradient-to-br from-white to-slate-50/20"
                                >
                                  {/* Info row */}
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-black text-slate-800">
                                        {getExpenseCategoryInBengali(item.category)}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                                        {item.records.length}টি লেনদেন
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-xs font-black text-rose-700">৳{item.totalCost.toLocaleString()}</span>
                                      <div className="text-[10px] text-slate-400 font-semibold font-sans">
                                        নগদ: ৳{item.paid.toLocaleString()} | বকেয়া: ৳{item.due.toLocaleString()}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Visual Progress Bar */}
                                  <div className="space-y-1">
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                                      <div
                                        className="bg-rose-500 h-2 rounded-full"
                                        style={{ width: `${percent}%` }}
                                      />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                                      <span>মোট ব্যয়ের অনুপাত: {percent}%</span>
                                      <button
                                        onClick={() => setReportExpandedCategory(isExpanded ? null : item.category)}
                                        className="text-emerald-700 hover:underline cursor-pointer flex items-center gap-1 font-semibold"
                                      >
                                        {isExpanded ? "রেকর্ড লুকান ▲" : "খরচের বিস্তারিত মেমো দেখুন ▼"}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Expandable item list */}
                                  {isExpanded && (
                                    <div className="mt-2 pt-2 border-t border-dashed border-slate-200 animate-fadeIn space-y-2">
                                      <span className="text-[10px] font-bold text-slate-500 block">খরচের খতিয়ান ও মেমো খাতা:</span>
                                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                        {item.records.map((rec) => {
                                          return (
                                            <div
                                              key={rec.id}
                                              className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs bg-white p-2.5 border border-slate-100 rounded-lg hover:border-slate-200 transition-colors gap-2"
                                            >
                                              <div>
                                                <span className="font-bold text-slate-800 block">{rec.title}</span>
                                                <div className="text-[10px] text-slate-400 font-medium">
                                                  তারিখ: {rec.date} | পোস্টিং আইডি: <span className="font-mono font-bold uppercase">{rec.id}</span>
                                                </div>
                                                {rec.merchantName && (
                                                  <div className="text-[10px] text-amber-700 font-bold flex items-center gap-1.5 mt-0.5 bg-amber-50 rounded px-1.5 py-0.5 w-fit">
                                                    বিক্রেতা: {rec.merchantName}
                                                  </div>
                                                )}
                                              </div>

                                              <div className="sm:text-right shrink-0">
                                                <span className="font-extrabold text-slate-800 block">৳{(rec.totalAmount || rec.amount).toLocaleString()}</span>
                                                {rec.dueAmount && rec.dueAmount > 0 ? (
                                                  <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[9px] font-bold text-red-650 bg-red-50 border border-red-200 px-1 py-0.5 rounded">
                                                      বকেয়া বাকি: ৳{rec.dueAmount}
                                                    </span>
                                                    <button
                                                      onClick={() => {
                                                        setPayingDueExpense(rec);
                                                        setRepayAmount(rec.dueAmount || 0);
                                                      }}
                                                      className="text-[9px] font-black text-white bg-amber-600 hover:bg-amber-700 px-1.5 py-0.5 rounded cursor-pointer"
                                                    >
                                                      বকেয়া দিন
                                                    </button>
                                                  </div>
                                                ) : (
                                                  <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-black">
                                                    পরিশোধিত
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Right Block: Sector/Category configuration panel */}
                      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <div className="p-1.5 bg-slate-50 text-slate-700 rounded-lg">
                              <Settings className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-slate-900 leading-none">২. খরচ খাত বা ক্যাটাগরি প্যানেল</h3>
                              <span className="text-[10px] text-slate-400">এখান থেকে আপনি নতুন খরচের খাত যোগ করতে পারবেন</span>
                            </div>
                          </div>

                          {/* Category listing badges */}
                          <div className="mt-4 space-y-4">
                            {/* Expenses List */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-black text-red-600 uppercase tracking-wider block">🔻 ব্যয়ের খাতসমূহ (Expense Categories)</span>
                              <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto">
                                {expenseCategories.filter(c => c.type === "Expense").map((cat) => {
                                  const isEditing = editingCategoryId === cat.id;
                                  const isDefault = cat.id.startsWith("def_");
                                  return (
                                    <div key={cat.id} className="flex justify-between items-center bg-red-50/40 p-2 rounded-lg border border-red-100/50 text-xs">
                                      {isEditing ? (
                                        <form onSubmit={handleUpdateCategory} className="flex gap-1 w-full items-center">
                                          <input
                                            type="text"
                                            value={editingCategoryName}
                                            onChange={(e) => setEditingCategoryName(e.target.value)}
                                            className="flex-1 p-1 bg-white border border-slate-300 rounded text-xs font-bold"
                                            required
                                          />
                                          <button type="submit" className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer">সংরক্ষণ</button>
                                          <button type="button" onClick={() => setEditingCategoryId(null)} className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] cursor-pointer">বাতিল</button>
                                        </form>
                                      ) : (
                                        <div className="flex justify-between items-center w-full">
                                          <span className="font-bold text-slate-800">
                                            ✏️ {getExpenseCategoryInBengali(cat.name)} {isDefault && <span className="text-[8px] text-slate-400 font-normal bg-slate-100 px-1 py-0.5 rounded ml-1">সিস্টেম</span>}
                                          </span>
                                          <div className="flex gap-2">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingCategoryId(cat.id);
                                                setEditingCategoryName(cat.name);
                                                setEditingCategoryType("Expense");
                                              }}
                                              className="text-slate-500 hover:text-emerald-700 font-extrabold cursor-pointer text-[10px]"
                                              title="সম্পাদনা করুন"
                                            >
                                              সম্পাদনা
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                              className="text-slate-400 hover:text-red-700 font-extrabold cursor-pointer text-[10px]"
                                              title="ডিলেট করুন"
                                            >
                                              ডিলেট
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Incomes List */}
                            <div className="space-y-1.5 pt-2 border-t border-slate-200/50">
                              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">🔺 আয়ের খাতসমূহ (Income Categories)</span>
                              <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto">
                                {expenseCategories.filter(c => c.type === "Income").map((cat) => {
                                  const isEditing = editingCategoryId === cat.id;
                                  const isDefault = cat.id.startsWith("def_");
                                  return (
                                    <div key={cat.id} className="flex justify-between items-center bg-emerald-50/30 p-2 rounded-lg border border-emerald-100/50 text-xs">
                                      {isEditing ? (
                                        <form onSubmit={handleUpdateCategory} className="flex gap-1 w-full items-center">
                                          <input
                                            type="text"
                                            value={editingCategoryName}
                                            onChange={(e) => setEditingCategoryName(e.target.value)}
                                            className="flex-1 p-1 bg-white border border-slate-300 rounded text-xs font-bold"
                                            required
                                          />
                                          <button type="submit" className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer">সংরক্ষণ</button>
                                          <button type="button" onClick={() => setEditingCategoryId(null)} className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] cursor-pointer">বাতিল</button>
                                        </form>
                                      ) : (
                                        <div className="flex justify-between items-center w-full">
                                          <span className="font-bold text-slate-800">
                                            💰 {getExpenseCategoryInBengali(cat.name)} {isDefault && <span className="text-[8px] text-slate-400 font-normal bg-slate-100 px-1 py-0.5 rounded ml-1">সিস্টেম</span>}
                                          </span>
                                          <div className="flex gap-2">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingCategoryId(cat.id);
                                                setEditingCategoryName(cat.name);
                                                setEditingCategoryType("Income");
                                              }}
                                              className="text-slate-500 hover:text-emerald-700 font-bold cursor-pointer text-[10px]"
                                              title="সম্পাদনা করুন"
                                            >
                                              সম্পাদনা
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                              className="text-slate-400 hover:text-red-700 font-bold cursor-pointer text-[10px]"
                                              title="ডিলেট করুন"
                                            >
                                              ডিলেট
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Add category inline widget */}
                        <div className="pt-4 border-t border-slate-100 space-y-2">
                          <span className="text-[11px] font-extrabold text-slate-600 block">নতুন খরচ ও আয়ের সূচক এড করুন:</span>
                          <form onSubmit={handleAddCategory} className="space-y-2">
                            <input
                              type="text"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              placeholder="যেমন: সবজি খরিদ, চাউল বাজার, বুয়া"
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline font-extrabold text-slate-700"
                              required
                            />
                            <div className="flex gap-2">
                              <select
                                value={newCategoryType}
                                onChange={(e) => setNewCategoryType(e.target.value as any)}
                                className="p-1.5 bg-slate-50 border border-slate-200 text-[10px] rounded-lg font-bold text-slate-600"
                              >
                                <option value="Expense">ব্যয় সূচক (Expense)</option>
                                <option value="Income">আয় সূচক (Income)</option>
                              </select>
                              <button
                                type="submit"
                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-xl transition-colors cursor-pointer"
                              >
                                + খাত যোগ করুন
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Transactions grid */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden font-sans">
                  <div className="p-4 bg-slate-50/40 border-b flex justify-between items-center font-sans">
                    <span className="text-[10px] font-bold text-[#475569] block uppercase tracking-wider font-sans">তালিকাকৃত আয়-ব্যয় বিবরণী ({expenseMonthFilter ? "ফিল্টার্ড" : "সব হিসাব"})</span>
                    <span className="text-xs font-bold text-slate-800">ব্যয়ের বিবরণী রেকর্ড সংখ্যা: {displayedExpenses.length}টি</span>
                  </div>

                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#f8fafc]/80 text-gray-500 uppercase text-[10px] font-bold border-b">
                      <tr>
                        <th className="p-3">বিবরণী ও ক্যাশ আইডি</th>
                        <th className="p-3 text-center">খাত / ক্যাটাগরি</th>
                        <th className="p-3 text-center">তারিখ</th>
                        <th className="p-3 text-center">অনুমোদনকারী</th>
                        <th className="p-3 text-right">আয় / ব্যয়</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-gray-700 font-sans">
                      {displayedExpenses.map((e, index) => {
                        const hasDues = e.type === "Expense" && typeof e.dueAmount === "number" && e.dueAmount > 0;
                        return (
                          <motion.tr
                            key={e.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.45), ease: "easeOut" }}
                            whileHover={{ 
                              scale: 1.006, 
                              backgroundColor: "rgba(241, 245, 249, 0.5)",
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)"
                            }}
                            className="transition-all duration-200 cursor-pointer relative"
                          >
                            <td className="p-3">
                              <span className="font-semibold text-gray-900 block">{e.title}</span>
                              <span className="text-[9px] text-gray-400 font-mono font-bold uppercase">{e.id}</span>
                              
                              {hasDues && (
                                <div className="flex flex-wrap items-center gap-1.5 mt-1 font-sans">
                                  <span className="text-[9px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    ⚠️ দোকানদারের বকেয়া: ৳{e.dueAmount} ({e.merchantName || "বিক্রেতা"})
                                  </span>
                                  <button
                                    onClick={() => {
                                      setPayingDueExpense(e);
                                      setRepayAmount(e.dueAmount || 0);
                                    }}
                                    className="text-[9px] font-black text-white bg-amber-600 hover:bg-amber-700 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                                  >
                                    বকেয়া পরিশোধ করুন
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="p-2 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold text-xs ${
                                e.type === "Income" ? "bg-emerald-150 text-emerald-850" : "bg-red-50 text-red-800 border border-red-100"
                              }`}>
                                {getExpenseCategoryInBengali(e.category)}
                              </span>
                            </td>
                            <td className="p-3 text-center text-slate-500 font-sans">{e.date}</td>
                            <td className="p-3 text-center text-slate-500">{e.recordedBy || "সুপার এডমিন"}</td>
                            <td className="p-3 text-right">
                              <span className={`font-black block ${
                                e.type === "Expense" ? "text-red-600" : "text-emerald-750"
                              }`}>
                                {e.type === "Expense" ? "-" : "+"}৳{e.amount}
                              </span>
                              {hasDues && (
                                <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                                  (মোট ক্রয়: ৳{e.totalAmount})
                                </span>
                              )}
                            </td>
                          </motion.tr>
                        );
                      })}
                      {displayedExpenses.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-400 italic">এই নির্বাচিত মাসে কোনো আয়/ব্যয়ের তথ্য পোস্ট করা নেই।</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* 7. VIEW G: E-REPORTS ADMINISTRATIVE SYSTEM */}
          {dashboardTab === "reports" && (
            <div className="space-y-6">
              <ReportSystem
                members={members}
                rooms={rooms}
                payments={payments}
                expenses={expenses}
                packages={packages.length > 0 ? packages : DEFAULT_PACKAGES}
                onScanDues={handleScanDuesAndNotify}
              />

              {/* Live Database Operations & Netlify Guide */}
              <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-6 shadow-sm" id="netlify_database_admin_panel">
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-black uppercase text-emerald-800 tracking-widest font-mono">NETLIFY PRODUCTION & LIVE DATABASE SETTINGS</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 font-sans tracking-tight mt-1">পাবলিশ অ্যাডমিন ড্যাশবোর্ড এবং ডাটাবেস উইজার্ড</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    এই অ্যাপ্লিকেশনটি আপনার রিয়েল-টাইম ফায়ারবেস ডাটাবেজের সাথে সরাসরি কানেক্টেড রয়েছে। আপনি যখন এটিকে **Netlify (নেটলিফাই)** থেকে পাবলিশ করবেন, তখন ডেমো ডাটাগুলো সরাতে এবং পরিষ্কার রাখতে নিচের টুলগুলো ব্যবহার করুন।
                  </p>
                </div>

                {/* DB status feedback messages */}
                {dbActionStatus && (
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed font-sans ${
                    dbActionStatus.type === "success" 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}>
                    <p className="font-bold">{dbActionStatus.type === "success" ? "সাকসেস বার্তা:" : "ত্রুটি বার্তা:"}</p>
                    <p className="mt-0.5">{dbActionStatus.message}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Action Card 1: Clear DB */}
                  <div className="border border-slate-100 rounded-xl p-5 bg-gradient-to-br from-white to-slate-50/50 hover:shadow-xs transition-shadow flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-red-600 block">PRODUCTION STANDALONE MODE</span>
                      <h4 className="text-sm font-bold text-slate-800 mt-1 font-sans">১০০% সম্পূর্ণ ফ্রেশ ডেটাবেস স্টার্টিং (ডিপ্লয়মেন্ট ডেডিকেটেড)</h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-sans">
                        এটি আপনার ডেটাবেসে থাকা সব ডেমো মেম্বারদের প্রোফাইল, রুম ভাড়ার লগ এবং ট্রানজেকশন মুছে ফেলবে। এটি চালানোর পর সম্পূর্ণ শূন্য ডাটা নিয়ে আপনার রিয়েল হোস্টেলের মেম্বার ও সিটের এন্ট্রি শুরু করতে পারবেন।
                      </p>
                    </div>

                    <div className="mt-5">
                      <button
                        onClick={handleClearDatabase}
                        disabled={dbActionLoading}
                        className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 disabled:opacity-50 text-xs font-bold rounded-xl border border-red-200 hover:border-red-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {dbActionLoading ? "লোড হচ্ছে..." : "সমস্ত ডেমো ডাটা মুছুন (Clear All Demo Data)"}
                      </button>
                    </div>
                  </div>

                  {/* Action Card 2: Seed DB */}
                  <div className="border border-slate-100 rounded-xl p-5 bg-gradient-to-br from-white to-emerald-50/10 hover:shadow-xs transition-shadow flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-700 block">DEMO PLAYGROUND SEEDER</span>
                      <h4 className="text-sm font-bold text-slate-850 mt-1 font-sans">টেমপ্লেট ডেমো ডাটা পুনরায় লোড করুন (পরীক্ষামূলক ব্যবহার)</h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-sans">
                        যদি আপনি লাইভ ডিপ্লয়মেন্টে এই অ্যাপটির স্পেসিফিকেশন, চার্ট এবং কুইক বুকিং সিস্টেমটি ক্লায়েন্টকে দেখাতে চান, তবে এটি রিলোড করে ৪টি ড্রাফট রুম, ৪টি সীট এবং ৩জন ড্রাফট বর্ডারের হিসাব ইনস্ট্যান্ট তৈরি করতে পারবেন।
                      </p>
                    </div>

                    <div className="mt-5">
                      <button
                        onClick={handleSeedDemoData}
                        disabled={dbActionLoading}
                        className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100/70 text-emerald-800 disabled:opacity-50 text-xs font-bold rounded-xl border border-emerald-200 hover:border-emerald-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {dbActionLoading ? "লোড হচ্ছে..." : "টেমপ্লেট ডেমো ডাটা সীড করুন (Seed Demo Templates)"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Netlify Publishing Checklists */}
                <div className="border-t border-slate-100 pt-5 text-xs text-slate-500 font-sans">
                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest block font-mono">NETLIFY PUBLISHING QUICK CHECKLIST</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div className="p-3 bg-slate-50 rounded-lg space-y-2 text-[11px]">
                      <p className="font-semibold text-slate-700">১. সেটিংস ও গিটহাব কানেকশন</p>
                      <p className="leading-normal">
                        আপনার এই সোর্স কোডটি জিপ অথবা গিটহাব রিপোজিটরি হিসেবে ডাউনলোড করে Netlify-এ আপলোড বা ইমপোর্ট করুন।
                      </p>
                    </div>
                    
                    <div className="p-3 bg-slate-50 rounded-lg space-y-2 text-[11px]">
                      <p className="font-semibold text-slate-700 font-sans">২. বিল্ড কনফিগারেশন সেটিংস</p>
                      <p className="leading-normal font-sans">
                        Netlify-এ <strong>Build Command</strong> হিসেবে দিবেন <code>npm run build</code> এবং <strong>Publish directory</strong> হিসেবে সেট করবেন <code>dist</code>। আপনার অ্যাপ্লিকেশন নিখুঁতভাবে লাইভ হয়ে যাবে।
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </main>

      {/* 4. Invoice Popup Dialogue */}
      {selectedInvoice && (
        <InvoiceModal payment={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}

      {/* 5. ADD MEMBER ENROLL MODAL */}
      {isAddingMember && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md border border-slate-100 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150 flex flex-col max-h-[85vh] font-sans">
            <div className="bg-emerald-950 p-4 text-white flex justify-between items-center shrink-0">
              <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400">বর্ডার চেক-ইন ও ভর্তি ফরম</h3>
              <button onClick={() => setIsAddingMember(false)} className="text-white hover:text-red-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 font-sans">বোর্ডারের পুরো নাম</label>
                <input
                  type="text"
                  value={newMemName}
                  onChange={(e) => setNewMemName(e.target.value)}
                  placeholder="যেমন: শাহরিয়ার কবির"
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 font-sans">সক্রিয় মোবাইল নম্বর</label>
                  <input
                    type="text"
                    value={newMemPhone}
                    onChange={(e) => setNewMemPhone(e.target.value)}
                    placeholder="+৮৮০১৭১XXXXXX"
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 font-sans">জাতীয় পরিচয়পত্র (NID) নম্বর</label>
                  <input
                    type="text"
                    value={newMemNid}
                    onChange={(e) => setNewMemNid(e.target.value)}
                    placeholder="NID-XXXXXX"
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg"
                  />
                </div>
              </div>

              {/* Professional details selector section */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/50 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 font-sans">বোর্ডারের পেশার ধরণ</label>
                  <select
                    value={newMemProfession}
                    onChange={(e) => setNewMemProfession(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-200 text-xs rounded-lg font-bold font-sans cursor-pointer"
                  >
                    <option value="Student">শিক্ষার্থী (Student)</option>
                    <option value="Job Holder">চাকরিজীবী (Job Holder)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 font-sans">
                      {newMemProfession === "Job Holder" ? "কোম্পানির নাম লিখুন" : "শিক্ষা প্রতিষ্ঠানের নাম"}
                    </label>
                    <input
                      type="text"
                      value={newMemInstitution}
                      onChange={(e) => setNewMemInstitution(e.target.value)}
                      placeholder={newMemProfession === "Job Holder" ? "যেমন: গ্রামীণফোন" : "जैसेन: ঢাকা বিশ্ববিদ্যালয়"}
                      className="w-full px-3 py-2 bg-white border border-slate-200 text-xs font-bold rounded-lg text-slate-800"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 font-sans">
                      {newMemProfession === "Job Holder" ? "এমপ্লয়ি আইডি নং" : "স্টুডেন্ট আইডি নং"}
                    </label>
                    <input
                      type="text"
                      value={newMemIdCardNo}
                      onChange={(e) => setNewMemIdCardNo(e.target.value)}
                      placeholder="আইডি কার্ড নম্বর লিখুন"
                      className="w-full px-3 py-2 bg-white border border-slate-200 text-xs font-medium rounded-lg text-slate-800"
                      required
                    />
                  </div>
                </div>
              </div>

              <h4 className="text-[10px] font-bold text-emerald-600 block uppercase tracking-wider pt-2 border-t border-gray-100">
                অভিভাবক এবং জরুরি যোগাযোগ তথ্য
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 font-sans">অভিভাবকের নাম</label>
                  <input
                    type="text"
                    value={newMemGuardianName}
                    onChange={(e) => setNewMemGuardianName(e.target.value)}
                    placeholder="যেমন: মোঃ রফিকুল ইসলাম"
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 font-sans">অভিভাবকের মোবাইল</label>
                  <input
                    type="text"
                    value={newMemGuardianPhone}
                    onChange={(e) => setNewMemGuardianPhone(e.target.value)}
                    placeholder="০১৭১০XXXXXX"
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 font-sans">জরুরী যোগাযোগ নম্বর</label>
                <input
                  type="text"
                  value={newMemEmergency}
                  onChange={(e) => setNewMemEmergency(e.target.value)}
                  placeholder="যেমন: ০১৭১XXXXXXX"
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg"
                />
              </div>

              <h4 className="text-[10px] font-bold text-emerald-600 block uppercase tracking-wider pt-2 border-t border-gray-100">
                রুম এবং সিট বরাদ্দ করুন
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 font-sans">রুম নম্বর নির্বাচন করুন</label>
                  <select
                    value={newMemRoomId}
                    onChange={(e) => {
                      setNewMemRoomId(e.target.value);
                      const roomBeds = seats.filter((s) => s.roomId === e.target.value && s.status === "Available");
                      setNewMemSeatId(roomBeds[0]?.id || "");
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 text-xs rounded-lg"
                    required
                  >
                    <option value="">রুম বাছাই করুন...</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        রুম নম্বর {room.roomNo} ({room.seatsTotal - room.seatsBooked}টি সিট খালি)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 font-sans">সিট বরাদ্দ করুন</label>
                  <select
                    value={newMemSeatId}
                    onChange={(e) => setNewMemSeatId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 text-xs rounded-lg font-bold"
                    required
                    disabled={!newMemRoomId}
                  >
                    <option value="">সিট বাছাই করুন...</option>
                    {seats
                      .filter((s) => s.roomId === newMemRoomId && s.status === "Available")
                      .map((seat) => (
                        <option key={seat.id} value={seat.id}>
                          বেড {seat.seatNo} (ভাড়া ৳{seat.rentPrice})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 font-sans">প্যাকেজ প্ল্যান</label>
                  <select
                    value={newMemPackageName}
                    onChange={(e) => setNewMemPackageName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 text-xs rounded-lg font-bold text-slate-800"
                  >
                    {(packages.length > 0 ? packages : DEFAULT_PACKAGES)
                      .filter((pkg) => pkg.status !== "Inactive")
                      .map((pkg) => (
                        <option key={pkg.id} value={pkg.name}>
                          {getPackageLabelInBengali(pkg.name)} (৳{pkg.price}/মাস)
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 font-sans">বোর্ডারের ছবি আপলোড করুন</label>
                  <div className="flex gap-2 items-center bg-slate-50 border border-slate-100 p-1.5 rounded-lg">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewMemPhotoUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-[10px] text-slate-500 font-sans file:mr-1 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer w-full"
                    />
                    {newMemPhotoUrl && (
                      <img
                        src={newMemPhotoUrl}
                        alt="Preview"
                        className="w-8 h-8 object-cover rounded-full border border-slate-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Admission Dynamic Bill Calculations Segment */}
              {(() => {
                const activeSeatObj = seats.find((s) => s.id === newMemSeatId);
                const pkgPrice = (packages.length > 0 ? packages : DEFAULT_PACKAGES).find((p) => p.name === newMemPackageName)?.price || 0;
                const rentPrice = activeSeatObj?.rentPrice || 0;
                const totalBill = rentPrice + pkgPrice;
                return (
                  <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-3.5 space-y-2.5 font-sans">
                    <span className="text-[11px] font-extrabold text-emerald-800 block uppercase tracking-wider">💳 ভর্তি বিল হিসাব (Admission Bill Summary)</span>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-700 font-medium">
                        <span>১. সিট ভাড়া বিল (Seat Rent):</span>
                        <span className="font-bold text-slate-900">৳{rentPrice}</span>
                      </div>
                      <div className="flex justify-between text-slate-700 font-medium">
                        <span>২. প্যাকেজ প্ল্যান বিল (Package Bill):</span>
                        <span className="font-bold text-slate-900">৳{pkgPrice}</span>
                      </div>
                      <div className="border-t border-emerald-250/40 pt-2 flex justify-between text-emerald-950 font-black text-xs">
                        <span>সর্বমোট চার্জ (Total Amount):</span>
                        <span>৳{totalBill}</span>
                      </div>
                      
                      <div className="border-t border-emerald-250/40 pt-2 space-y-1">
                        <label className="text-[10px] font-black text-emerald-800 block uppercase">অগ্রিম বুকিং ফি প্রদান করুন (৳)</label>
                        <input
                          type="number"
                          value={newMemAdvancePaid || ""}
                          onChange={(e) => setNewMemAdvancePaid(Math.max(0, Number(e.target.value)))}
                          placeholder="যেমন: ৪০০"
                          className={`w-full px-2.5 py-1.5 border ${newMemAdvancePaid > totalBill ? 'border-red-500 bg-red-50 text-red-900' : 'border-emerald-300 bg-white text-slate-900'} text-xs font-black rounded-lg focus:outline-none`}
                        />
                      </div>
                      {newMemAdvancePaid > totalBill && (
                        <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-[10px] font-extrabold rounded-lg animate-pulse">
                          ⚠️ ভুল তথ্য: অগ্রিম পেমেন্ট মোট চার্জ (৳{totalBill}) এর চেয়ে বেশি হতে পারে না!
                        </div>
                      )}
                      <div className="flex justify-between text-red-700 font-extrabold text-[11px] pt-1">
                        <span>বাকি বকেয়া থাকবে (Remaining Dues):</span>
                        <span>৳{Math.max(0, totalBill - newMemAdvancePaid)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-2 pt-4 justify-between shrink-0 font-sans">
                <button
                  type="button"
                  onClick={() => setIsAddingMember(false)}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMember}
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-semibold rounded-xl cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmittingMember ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>প্রক্রিয়াধীন...</span>
                    </>
                  ) : (
                    <span>ভর্তি ও চেক-ইন সম্পন্ন করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. TRANSACTIONS/EXPENSE ENTRY MODAL */}
      {isAddingExpense && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-slate-100 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150 font-sans">
            <div className={`p-4 text-white flex justify-between items-center ${
              newExpType === "Income" ? "bg-emerald-900" : "bg-rose-950"
            }`}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-white">
                {newExpType === "Income" ? "১. নতুন আয় এন্ট্রি করুন" : "২. নতুন ব্যয় এন্ট্রি করুন"}
              </h3>
              <button onClick={() => setIsAddingExpense(false)} className="text-white hover:text-red-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 font-sans">
                  {newExpType === "Income" ? "আয়ের বিবরণ (Title)" : "ব্যয়ের বিবরণ (Title)"}
                </label>
                <input
                  type="text"
                  value={newExpTitle}
                  onChange={(e) => setNewExpTitle(e.target.value)}
                  placeholder={newExpType === "Income" ? "যেমন: অতিরিক্ত অনুদান বা সিকিউরিটি ডিপোজিট" : "যেমন: দৈনিক তরকারি ও আলু বাজার"}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline outline-emerald-500"
                  required
                />
              </div>

              {newExpType === "Expense" && (
                <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-rose-950 font-sans">বাকিতে ক্রয় / আংশিক পরিশোধ?</span>
                    <span className="text-[10px] text-slate-500 font-medium">দোকানদারের কাছে বকেয়া বা বাকি হিসাব রাখতে এটি টিক দিন</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPartialPayment}
                    onChange={(e) => {
                      setIsPartialPayment(e.target.checked);
                      if (e.target.checked) {
                        setExpTotalAmount(newExpAmount || 100);
                        setExpPaidAmount(newExpAmount ? Math.min(newExpAmount, 60) : 60);
                      }
                    }}
                    className="w-4.5 h-4.5 text-rose-650 rounded border-slate-300 focus:ring-rose-550 cursor-pointer"
                  />
                </div>
              )}

              {newExpType === "Expense" && isPartialPayment ? (
                <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-150 rounded-xl font-sans animate-fadeIn">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">মোট ক্রয় মূল্য (৳)</label>
                      <input
                        type="number"
                        value={expTotalAmount === 0 ? "" : expTotalAmount}
                        onChange={(e) => setExpTotalAmount(Number(e.target.value))}
                        min={1}
                        placeholder="যেমন: ১০০"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs rounded-lg font-bold font-sans text-slate-800"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">নগদ প্রদানকৃত (৳)</label>
                      <input
                        type="number"
                        value={expPaidAmount === 0 ? "" : expPaidAmount}
                        onChange={(e) => setExpPaidAmount(Number(e.target.value))}
                        min={0}
                        placeholder="যেমন: ৬০"
                        className={`w-full px-2.5 py-1.5 border ${expPaidAmount > expTotalAmount ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-200 bg-white text-emerald-800'} text-xs rounded-lg font-bold font-sans`}
                        required
                      />
                    </div>
                  </div>

                  {expPaidAmount > expTotalAmount && (
                    <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-[10px] font-extrabold rounded-lg animate-pulse">
                      ⚠️ ভুল তথ্য: নগদ প্রদানকৃত পরিমাণ মোট ক্রয় মূল্যের (৳{expTotalAmount}) চেয়ে বেশি হতে পারে না!
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[11px] bg-amber-50 p-2 border border-amber-200 rounded-lg text-slate-700">
                    <span className="font-bold">দোকান্দারের বকেয়া (বাকি):</span>
                    <span className="font-extrabold text-red-650">৳{Math.max(0, expTotalAmount - expPaidAmount)}</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase">দোকানদার / বিক্রেতার নাম</label>
                    <input
                      type="text"
                      value={expMerchantName}
                      onChange={(e) => setExpMerchantName(e.target.value)}
                      placeholder="যেমন: রহিম মোকার স্টোর / করিম ভাই"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs rounded-lg font-sans text-slate-700"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs font-bold text-gray-500 font-sans">টাকার পরিমাণ (৳)</label>
                    <input
                      type="number"
                      value={newExpAmount === 0 ? "" : newExpAmount}
                      onChange={(e) => setNewExpAmount(Number(e.target.value))}
                      min={1}
                      className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg font-bold font-sans"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-bold text-gray-500 font-sans">তারিখ (Date)</label>
                  <input
                    type="date"
                    value={newExpDate}
                    onChange={(e) => setNewExpDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg font-sans font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 font-sans">খাত বা ক্যাটাগরি</label>
                {newExpType === "Expense" ? (
                  <div className="flex gap-2">
                    <select
                      value={newExpCategory || ""}
                      onChange={(e) => setNewExpCategory(e.target.value as any)}
                      className="flex-1 p-2 bg-slate-50 border border-slate-200 text-xs rounded-lg font-sans font-bold text-slate-700 cursor-pointer"
                    >
                      <option value="">খাত বাছাই করুন...</option>
                      {expenseCategories.filter(c => c.type === "Expense").map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {getExpenseCategoryInBengali(cat.name)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setNewCategoryType("Expense");
                        setIsAddingCategory(true);
                      }}
                      className="px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-black cursor-pointer"
                      title="নতুন খরচ খাত তৈরি করুন"
                    >
                      + নতুন খাত
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={newExpCategory || ""}
                      onChange={(e) => setNewExpCategory(e.target.value as any)}
                      className="flex-1 p-2 bg-slate-50 border border-slate-200 text-xs rounded-lg font-sans font-bold text-slate-700 cursor-pointer"
                    >
                      <option value="">খাত বাছাই করুন...</option>
                      {expenseCategories.filter(c => c.type === "Income").map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {getExpenseCategoryInBengali(cat.name)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setNewCategoryType("Income");
                        setIsAddingCategory(true);
                      }}
                      className="px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-black cursor-pointer"
                      title="নতুন আয়ের খাত তৈরি করুন"
                    >
                      + নতুন খাত
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddingExpense(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExpense}
                  className={`flex-1 py-2 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-colors flex items-center justify-center gap-2 ${
                    isSubmittingExpense 
                      ? "bg-slate-450" 
                      : newExpType === "Income" 
                        ? "bg-emerald-600 hover:bg-emerald-700" 
                        : "bg-rose-650 hover:bg-rose-700"
                  }`}
                >
                  {isSubmittingExpense ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>যোগ হচ্ছে...</span>
                    </>
                  ) : (
                    <span>{newExpType === "Income" ? "আয় হিসাবে যোগ করুন" : "ব্যয় হিসাবে যোগ করুন"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Category Addding Modal */}
      {isAddingCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-slate-100 overflow-hidden shadow-2xl animate-in font-sans">
            <div className="p-4 bg-emerald-950 text-white flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                নতুন ক্যাটাগরি / খরচ খাত যোগ করুন
              </h3>
              <button onClick={() => setIsAddingCategory(false)} className="text-white hover:text-red-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">খাত/ক্যাটাগরির নাম (বাংলায় লিখুন)</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="যেমন: চাল ক্রয়, সবজি বাজার, ডিপিএস ইত্যাদি"
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline outline-emerald-500 font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">খাতের ধরণ</label>
                <select
                  value={newCategoryType}
                  onChange={(e) => setNewCategoryType(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 text-xs rounded-lg font-bold"
                >
                  <option value="Expense">ব্যয় খাত (Expenditure Sector)</option>
                  <option value="Income">আয় খাত (Income Sector)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCategory}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-xl scroll-p-1 flex items-center justify-center gap-2"
                >
                  {isSubmittingCategory ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <span>খাত নিশ্চিত করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Due Repayment Modal */}
      {payingDueExpense && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-slate-100 overflow-hidden shadow-2xl animate-in font-sans">
            <div className="p-4 bg-amber-950 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  দোকানদারের বকেয়া (বাকি) পরিশোধ
                </h3>
                <span className="text-[10px] text-slate-300 font-medium">লেনদেন: {payingDueExpense.title}</span>
              </div>
              <button onClick={() => setPayingDueExpense(null)} className="text-white hover:text-red-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRepayVendorDue} className="p-6 space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-dashed border-slate-100">
                  <span className="text-slate-500">মোট মূল্য:</span>
                  <span className="font-extrabold text-slate-850">৳{payingDueExpense.totalAmount || payingDueExpense.amount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-100">
                  <span className="text-slate-500">পূর্বে পরিশোধিত:</span>
                  <span className="font-extrabold text-emerald-700 font-sans">৳{payingDueExpense.paidAmount || payingDueExpense.amount}</span>
                </div>
                <div className="flex justify-between py-1 bg-rose-50/70 px-2 rounded-lg mt-1">
                  <span className="text-rose-900 font-bold">অবশিষ্ট বকেয়া (বাকি):</span>
                  <span className="font-black text-rose-700 font-sans">৳{payingDueExpense.dueAmount || 0}</span>
                </div>
              </div>

              {payingDueExpense.merchantName && (
                <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg text-xs">
                  <span className="text-slate-500">দোকানদার/বিক্রেতা:</span>{" "}
                  <span className="font-bold text-slate-800">{payingDueExpense.merchantName}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">পরিশোধের পরিমাণ (৳)</label>
                <input
                  type="number"
                  value={repayAmount === 0 ? "" : repayAmount}
                  onChange={(e) => setRepayAmount(Number(e.target.value))}
                  min={1}
                  placeholder={`সর্বোচ্চ ৳${payingDueExpense.dueAmount || 0}`}
                  className={`w-full px-3 py-2 border ${repayAmount > (payingDueExpense.dueAmount || 0) ? 'border-red-500 bg-red-50 text-red-950 font-black' : 'border-slate-200 text-amber-900 font-extrabold'} text-xs rounded-lg focus:outline outline-amber-500`}
                  required
                />
              </div>
              {repayAmount > (payingDueExpense.dueAmount || 0) && (
                <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-[10px] font-extrabold rounded-lg animate-pulse">
                  ⚠️ ভুল তথ্য: পরিশোধের পরিমাণ অবশিষ্ট বকেয়া (৳{payingDueExpense.dueAmount || 0}) এর চেয়ে বেশি হতে পারে না!
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingDueExpense(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl"
                >
                  পরিশোধ এন্ট্রি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. CONFIGURE PLAN TIERS AND MEALS MODAL */}
      {isAddingPackage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-slate-100 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150 font-sans">
            <div className="bg-emerald-950 p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  {editingPkgId ? "প্যাকেজ পরিমার্জন করুন" : "নতুন সাবস্ক্রিপশন প্যাকেজ"}
                </h3>
                {editingPkgId && <span className="text-[10px] text-emerald-200">এডিটিং আইডি: {editingPkgId}</span>}
              </div>
              <button onClick={() => setIsAddingPackage(false)} className="text-white hover:text-red-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPackage} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 font-sans">প্যাকেজের নাম</label>
                  <input
                    type="text"
                    value={newPkgName}
                    onChange={(e) => setNewPkgName(e.target.value)}
                    placeholder="যেমন: Regular, Luxury"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg font-bold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 font-sans">মাসিক ফি (৳)</label>
                  <input
                    type="number"
                    value={newPkgPrice}
                    onChange={(e) => setNewPkgPrice(Number(e.target.value))}
                    min={100}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg font-bold text-emerald-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 font-sans">খাবারের ধরণ</label>
                  <input
                    type="text"
                    value={newPkgMeals}
                    onChange={(e) => setNewPkgMeals(e.target.value)}
                    placeholder="যেমন: ৩ বেলা ভিআইপি ডাইনিং"
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 font-sans">কোটা মিল (প্রতিদিন)</label>
                  <input
                    type="number"
                    value={newPkgMealCount}
                    onChange={(e) => setNewPkgMealCount(Number(e.target.value))}
                    min={0}
                    max={5}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 font-sans">প্যাকেজ স্ট্যাটাস</label>
                  <select
                    value={newPkgStatus}
                    onChange={(e) => setNewPkgStatus(e.target.value as "Active" | "Inactive")}
                    className="w-full p-2 bg-slate-50 border border-slate-200 text-xs rounded-lg font-bold text-slate-700"
                  >
                    <option value="Active">সক্রিয় (Active)</option>
                    <option value="Inactive">নিষ্ক্রিয় (Inactive - সাময়িক বন্ধ)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 font-sans">প্যাকেজের সুবিধাসমূহ (কমা দিয়ে লিখুন)</label>
                <textarea
                  value={newPkgFacilities}
                  onChange={(e) => setNewPkgFacilities(e.target.value)}
                  placeholder="যেমন: এটাচড বাথরুম, ওয়াইফাই, সিলিং ফ্যান, ২৪ ঘন্টা জেনারেটর"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg"
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddingPackage(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPackage}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmittingPackage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <span>সংরক্ষণ করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Overlay custom alert modal */}
      {alertConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-155">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-extrabold text-slate-900">{alertConfig.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">{alertConfig.message}</p>
            </div>
            <button
              onClick={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
              className="w-full py-2.5 bg-emerald-650 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Overlay custom confirm modal */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-xl text-left space-y-4 animate-in fade-in zoom-in-95 duration-155">
            <div className="flex gap-3.5 items-start">
              <div className="w-10 h-10 rounded-full bg-amber-55 text-amber-900 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-extrabold text-slate-900">{confirmConfig.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold whitespace-pre-line">{confirmConfig.message}</p>
              </div>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-750 text-xs font-extrabold rounded-xl cursor-pointer transition-all border border-slate-200/50"
              >
                বাতিল করুন
              </button>
              <button
                onClick={confirmConfig.onConfirm}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-xl cursor-pointer transition-all"
              >
                নিশ্চিত ডিলিট
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. DYNAMIC NOTICE BROADCAST MODAL */}
      {isBroadcasting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl w-full max-w-md border border-slate-100 overflow-hidden shadow-2xl animate-in font-sans duration-150">
            <div className="bg-emerald-950 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#10b981]">
                  সক্রিয় মেম্বার ব্রডকাস্ট প্যানেল
                </h3>
              </div>
              <button onClick={() => setIsBroadcasting(false)} className="text-white hover:text-red-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {broadcastSendingStatus === "Sending" ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-spin">
                  <Megaphone className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-900">মেম্বারদের ব্রডকাস্ট পাঠানো হচ্ছে...</h4>
                  <p className="text-xs text-gray-400 font-medium">{broadcastProgress}% সম্পন্ন হয়েছে</p>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden max-w-xs mx-auto">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${broadcastProgress}%` }}
                  />
                </div>
              </div>
            ) : broadcastSendingStatus === "Success" ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-900">নোটিশ সফলভাবে পাঠানো হয়েছে!</h4>
                  <p className="text-xs text-gray-500 font-medium">সকল সক্রিয় সদস্য তাদের একাউন্টে সিস্টেম মেসেজ ও ইমেইল নোটিফিকেশন পেয়েছেন।</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendBroadcast} className="p-6 space-y-4">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between text-xs font-bold text-emerald-950">
                  <span>প্রেরণযোগ্য প্রাপক তালিকা:</span>
                  <span className="bg-emerald-200 text-emerald-900 px-3 py-1 rounded-lg text-[10px]">
                    {members.filter(m => m.status === "Active").length} জন সক্রিয় বর্ডারসমূহ
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 font-sans">নোটিশ বা বার্তার বিষয় (Subject)</label>
                  <input
                    type="text"
                    value={broadcastSubject}
                    onChange={(e) => setBroadcastSubject(e.target.value)}
                    placeholder="যেমন: জরুরি রক্ষণাবেক্ষণ বা বকেয়া রেন্ট পরিশোধ নোটিশ"
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg font-bold font-sans"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 font-sans">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 font-sans">নোটিশের ক্যাটাগরি</label>
                    <select
                      value={broadcastCategory}
                      onChange={(e) => setBroadcastCategory(e.target.value as any)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 text-xs rounded-lg font-bold text-slate-705"
                    >
                      <option value="General">সাধারণ নোটিশ (General)</option>
                      <option value="Maintenance">রক্ষণাবেক্ষণ সতর্কবার্তা (Maintenance)</option>
                      <option value="Due">ভাড়া ও বকেয়া সময়সীমা (Rent/Dues)</option>
                      <option value="Dining">ডাইনিং বিষয়ক নোটিশ (Dining)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 font-sans">বিতরণ মাধ্যম (Channel)</label>
                    <select
                      value={broadcastChannel}
                      onChange={(e) => setBroadcastChannel(e.target.value as any)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 text-xs rounded-lg font-semibold text-slate-705"
                    >
                      <option value="Both">নোটিফিকেশন ও ইমেইল (Both)</option>
                      <option value="System">শুধুমাত্র সিস্টেম ম্যাসেজ</option>
                      <option value="Email">শুধুমাত্র ইমেইল/এসএমএস</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 font-sans">বার্তা সারসংক্ষেপ / বিস্তারিত বিবরণ</label>
                  <textarea
                    value={broadcastContent}
                    onChange={(e) => setBroadcastContent(e.target.value)}
                    placeholder="আসন্ন নোটিশের মূল বার্তা এখানে বিস্তারিত লিখুন। যেমন: সম্মানিত বর্ডারবৃন্দ, আগামী পরশু আমাদের হোস্টেলের জরুরি পানির মটর মেরামতের কাজ অনুষ্ঠিত হবে..."
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg font-sans"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsBroadcasting(false)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    বাতিল করুন
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> ব্রডকাস্ট বার্তা পাঠান
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
