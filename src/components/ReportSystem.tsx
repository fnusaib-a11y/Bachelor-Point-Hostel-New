import React, { useState } from "react";
import { Member, Room, Payment, Expense, HostelPackage } from "../types";
import { ClipboardList, Printer, Download, CreditCard, PieChart, Users, Star, SquareDot, ShieldAlert, Sparkles, AlertCircle } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const MONTHS_LIST = [
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

export const getMonthYearString = (yearMonth: string) => {
  if (!yearMonth) return "";
  const [year, month] = yearMonth.split("-");
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthIdx = parseInt(month, 10) - 1;
  return `${monthNames[monthIdx]} ${year}`;
};

export const getCategoryLabelInBengali = (category: string) => {
  const mapping: Record<string, string> = {
    Food: "খাবার ও ক্যাটারিং",
    Electricity: "বিদ্যুৎ বিল (DESCO)",
    Gas: "গ্যাস বিল (Titas)",
    WiFi: "ব্রডব্যান্ড ইন্টারনেট",
    Salary: "স্টাফ বেতন",
    Maintenance: "রক্ষণাবেক্ষণ ও প্লাম্বিং",
    Others: "অন্যান্য খরচ",
  };
  return mapping[category] || category;
};

interface ReportSystemProps {
  members: Member[];
  rooms: Room[];
  payments: Payment[];
  expenses: Expense[];
  packages: HostelPackage[];
  onScanDues?: (threshold: number) => Promise<{ scannedCount: number; alertsCreated: number }>;
}

export function ReportSystem({ members, rooms, payments, expenses, packages, onScanDues }: ReportSystemProps) {
  const [activeTab, setActiveTab] = useState<"monthly" | "due" | "occupancy" | "financial" | "monthly_statement">("monthly");
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-05");

  // States for interactive balance due limit scanner
  const [scanThreshold, setScanThreshold] = useState(3000);
  const [scanResult, setScanResult] = useState<{ ran: boolean; scannedCount: number; alertsCreated: number } | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const totalDuesList = members.filter((m) => m.dueAmount > 0 && m.status === "Active");
  const activeMembersList = members.filter((m) => m.status === "Active");

  // Sum calculations
  const totalDuesAmount = totalDuesList.reduce((sum, m) => sum + m.dueAmount, 0);
  const totalIncomePaid = payments.reduce((sum, p) => p.status === "Paid" ? sum + p.amount : sum, 0);
  const totalExpensePaid = expenses.reduce((sum, e) => e.type === "Expense" ? sum + e.amount : sum, 0);

  const totalBeds = rooms.reduce((sum, r) => sum + r.seatsTotal, 0);
  const occupiedBeds = rooms.reduce((sum, r) => sum + r.seatsBooked, 0);
  const occupancyPercentage = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const handleTriggerScanner = async () => {
    if (!onScanDues) return;
    setIsScanning(true);
    setScanResult(null);
    try {
      const res = await onScanDues(scanThreshold);
      setScanResult({
        ran: true,
        scannedCount: res.scannedCount,
        alertsCreated: res.alertsCreated,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const handlePrint = (elementId: string) => {
    const printContent = document.getElementById(elementId)?.innerHTML;
    const printWindow = window.open("", "_blank");
    if (printWindow && printContent) {
      printWindow.document.write(`
        <html>
          <head>
            <title>ব্যাচেলর পয়েন্ট হোস্টেল - প্রশাসনিক রিপোর্ট</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          </head>
          <body class="bg-white p-8">
            <h1 class="text-2xl font-bold tracking-tight text-emerald-950 text-center mb-6">ব্যাচেলর পয়েন্ট হোস্টেল - প্রশাসনিক ও হিসাব রিপোর্ট</h1>
            ${printContent}
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownloadReport = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Colors
      const primaryColor = [16, 185, 129]; // Emerald 500
      const secondaryColor = [6, 78, 59]; // Emerald 900
      const textColor = [30, 41, 59]; // Slate 800

      // Header Banner
      doc.setFillColor(6, 78, 59); // deep emerald background
      doc.rect(0, 0, 210, 38, "F");

      // App Name/Logo text
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("BACHELOR POINT HOSTEL", 15, 16);

      // Meta details
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(167, 243, 208); // light green
      doc.text("Premium Hostel Administrative Management Ledger Dashboard System", 15, 22);
      doc.text(`Generated on: ${new Date().toLocaleString()} (UTC)`, 15, 28);
      
      // Right-aligned status in header banner
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("SECURE ADMINISTRATIVE EXPORT", 140, 16);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(209, 250, 229);
      doc.text("System Level Admin Audit Log Proof", 140, 21);

      // Reset text configurations
      doc.setTextColor(30, 41, 59);

      if (activeTab === "monthly_statement") {
        const monthLabel = MONTHS_LIST.find(m => m.id === selectedMonth)?.label || selectedMonth;
        const selectedMonthEng = getMonthYearString(selectedMonth);

        // Render Title Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(6, 78, 59);
        doc.text(`MONTHLY COMPREHENSIVE COMPLIANCE & OCCUPANCY LEDGER`, 15, 48);

        // Render Summary Description Text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105); // slate-600
        const summaryText = `Comprehensive financial accounting statement and space utilization report for ${monthLabel} (${selectedMonthEng}). Focuses on collected rental revenues, guest/auxiliary incomes, operational expense outlays (internet, electricity, gas, staff salaries, repairs), and net profit margin balances.`;
        const splitText = doc.splitTextToSize(summaryText, 180);
        doc.text(splitText, 15, 54);

        // Draw horizontal line separator
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.5);
        doc.line(15, 68, 195, 68);

        // Calculate occupancy totals
        const totalRooms = rooms.length;
        const totalBeds = rooms.reduce((sum, r) => sum + r.seatsTotal, 0);
        const occupiedBeds = rooms.reduce((sum, r) => sum + r.seatsBooked, 0);
        const occupancyPercentage = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

        // Financial groupings
        const monthPayments = payments.filter(p => p.status === "Paid" && p.month === selectedMonthEng);
        const monthGenIncomes = expenses.filter(e => e.type === "Income" && e.date.startsWith(selectedMonth));
        const monthExpenses = expenses.filter(e => e.type === "Expense" && e.date.startsWith(selectedMonth));

        const rentIncomeSum = monthPayments.reduce((sum, p) => sum + p.amount, 0);
        const extraIncomeSum = monthGenIncomes.reduce((sum, e) => sum + e.amount, 0);
        const totalInc = rentIncomeSum + extraIncomeSum;
        const totalExp = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
        const netProfit = totalInc - totalExp;

        const execHeaders = [["Executive Performance Index", "Calculated Value / Audit Status Indicator"]];
        const execRows = [
          ["Ledger Reporting Period", selectedMonthEng],
          ["Hostel Room Units Count", `${totalRooms} Confired Units`],
          ["Bed Space Occupancy Status", `${occupiedBeds} occupied out of ${totalBeds} total seats (${occupancyPercentage}% Space Utilization)`],
          ["Monthly Rent Ledger collections", `BDT ${rentIncomeSum.toLocaleString()}`],
          ["Monthly Auxiliary Inward Rents/Profit", `BDT ${extraIncomeSum.toLocaleString()}`],
          ["Gross Business Income (Total Incomes)", `BDT ${totalInc.toLocaleString()}`],
          ["Gross Operating Expenses (Total Outflows)", `BDT ${totalExp.toLocaleString()}`],
          ["Operating Margin Balance Margin (Net Profit)", `BDT ${netProfit.toLocaleString()}`]
        ];

        autoTable(doc, {
          head: execHeaders,
          body: execRows,
          startY: 72,
          theme: "striped",
          headStyles: { fillColor: [6, 78, 59], textColor: [255, 255, 255], fontSize: 9, fontStyle: "bold" },
          bodyStyles: { fontSize: 8.5, textColor: [51, 65, 85] },
          margin: { left: 15, right: 15 }
        });

        // Table 2: Chronological ledger rows
        const y2 = (doc as any).lastAutoTable.finalY + 12;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(6, 78, 59);
        doc.text("INCOME VS OPERATIONAL EXPENSES LINE ITEMS", 15, y2);

        const ledgerHeaders = [["Date", "Ledger Item Description", "Category Map", "Type Classification", "Value"]];
        const ledgerRows: any[][] = [];

        monthPayments.forEach(p => {
          ledgerRows.push([
            p.timestamp ? p.timestamp.substring(0, 10) : p.month,
            `Rent Paid - Member: ${p.memberName} (Room ${p.roomNo} - ${p.seatNo})`,
            "Room Rent Inflow",
            "Inflow (Income)",
            `+ BDT ${p.amount.toLocaleString()}`
          ]);
        });

        monthGenIncomes.forEach(e => {
          ledgerRows.push([
            e.date,
            e.title,
            "Auxiliary Income",
            "Inflow (Income)",
            `+ BDT ${e.amount.toLocaleString()}`
          ]);
        });

        monthExpenses.forEach(e => {
          ledgerRows.push([
            e.date,
            e.title,
            getCategoryLabelInBengali(e.category),
            "Outflow (Expense)",
            `- BDT ${e.amount.toLocaleString()}`
          ]);
        });

        if (ledgerRows.length === 0) {
          ledgerRows.push(["No ledger records logged for this reporting month.", "N/A", "N/A", "N/A", "BDT 0"]);
        }

        autoTable(doc, {
          head: ledgerHeaders,
          body: ledgerRows,
          startY: y2 + 4,
          theme: "striped",
          headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: "bold" },
          bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
          margin: { left: 15, right: 15 },
          didDrawPage: (data) => {
            const str = "Page " + doc.getNumberOfPages();
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(148, 163, 184); // slate-400
            doc.text(str, 195 - doc.getTextWidth(str), 285);
            doc.text("© Bachelor Point Hostels Ltd. Admin Cloud - Secure Workspace Access Audit", 15, 285);
          }
        });

        doc.save(`BachelorPoint_FinancialStatement_${selectedMonth}.pdf`);
        return;
      }

      // Dynamic Title and Content relative to Active Tab
      let tableHeaders: string[][] = [];
      let tableRows: any[][] = [];
      let reportName = "";
      let summaryText = "";

      if (activeTab === "monthly") {
        reportName = "MONTHLY GENERAL OPERATIONAL AUDIT";
        summaryText = `This report lists general hostel occupancy level counts, outstanding boarder dues, revenue invoices collected, and maintenance operation expenses recorded up to the current date. Under supervision of Master Administrator.`;

        tableHeaders = [["Operational Audit Metric", "Status Representation / Count Statistics"]];
        
        const occupancyRate = rooms.length > 0
          ? `${rooms.reduce((sum, r) => sum + r.seatsBooked, 0)} out of ${rooms.reduce((sum, r) => sum + r.seatsTotal, 0)} Seats Occupied`
          : "0 / 0 Seats";
        const totalNetProfit = totalIncomePaid - totalExpensePaid;

        tableRows = [
          ["Total Active Boarders", `${activeMembersList.length} Active Boarders Registered`],
          ["Total Room Inventory Count", `${rooms.length} Hostels Rooms Configured`],
          ["Interactive Bed Layout State", occupancyRate],
          ["Outstanding Balance (Arrears)", `BDT ${totalDuesAmount.toLocaleString()}`],
          ["Accumulated Revenues Paid", `BDT ${totalIncomePaid.toLocaleString()}`],
          ["Operational Expenses Recorded", `BDT ${totalExpensePaid.toLocaleString()}`],
          ["Net Income Margin (Inflows - Outflows)", `BDT ${totalNetProfit.toLocaleString()}`]
        ];
      } 
      else if (activeTab === "due") {
        reportName = "OVERDUE ACCOUNT ARREARS & DEFAULTERS SHEET";
        summaryText = `Contains a chronological roster of registered boarders with active status possessing non-zero overdue financial balances. Urgent notification triggers must be initialized for accounts exceeding nominal thresholds.`;

        tableHeaders = [["Boarder Full Name", "Phone Contact", "Room & Bed", "Package Rate Plan", "Overdue Balance"]];
        tableRows = totalDuesList.map(m => [
          m.fullName,
          m.phone,
          `Room ${m.roomNo} (Bed ${m.seatNo})`,
          m.packageName,
          `BDT ${m.dueAmount.toLocaleString()}`
        ]);

        if (totalDuesList.length === 0) {
          tableRows.push(["Perfect Status Verified", "N/A", "N/A", "N/A", "BDT 0 (No Active Dues)"]);
        }
      } 
      else if (activeTab === "occupancy") {
        reportName = "ROOM ALLOCATION MAP & VACANCY METRICS";
        summaryText = `Systematic overview of hostel space utilization. Lists individual wing blocks, levels, maximum seating configurations, current active inhabitants density ratio, and room maintenance status values.`;

        tableHeaders = [["Wing Block (Floor Info)", "Room Number", "Beds Sized", "Occupied Beds", "Ratios", "Current State"]];
        tableRows = rooms.map(r => [
          `${r.blockName} (${r.floor} Floor)`,
          `Room ${r.roomNo}`,
          `${r.seatsTotal} Beds`,
          `${r.seatsBooked} Occupied`,
          `${Math.round((r.seatsBooked / (r.seatsTotal || 1)) * 100)}% Occupancy`,
          r.status
        ]);
      } 
      else if (activeTab === "financial") {
        reportName = "FINANCIAL LEDGER (INFLOW REVENUES & OUTFLOW EXPENSES)";
        summaryText = `Dual ledger display aggregating recent cash inflows fetched from paid rental invoices and verified maintenance or food provisioning expenses registered on the system database.`;

        // We will make a consolidated chronological transactional summary table
        tableHeaders = [["Date / Period", "Ledger Subject", "Classification Account", "Method/Channel", "Transaction Value"]];
        
        const inflowRows = payments.slice(0, 10).map(p => [
          p.timestamp ? p.timestamp.substring(0, 10) : p.month,
          `Rent Payment - ${p.memberName}`,
          `Revenues Inflow (${p.type})`,
          p.method,
          `+ BDT ${p.amount.toLocaleString()}`
        ]);

        const outflowRows = expenses.slice(0, 10).map(e => [
          e.date,
          e.title,
          `Expenses Outflow (${e.category})`,
          "Direct Cashout",
          `- BDT ${e.amount.toLocaleString()}`
        ]);

        tableRows = [...inflowRows, ...outflowRows];

        if (tableRows.length === 0) {
          tableRows.push(["No records found", "N/A", "N/A", "N/A", "BDT 0"]);
        }
      }

      // Render Title Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(6, 78, 59);
      doc.text(reportName, 15, 48);

      // Render Summary Description Text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // slate-600
      const splitText = doc.splitTextToSize(summaryText, 180);
      doc.text(splitText, 15, 54);

      // Draw horizontal line separator
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(15, 68, 195, 68);

      // Generate Table using autotable
      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 72,
        theme: "striped",
        headStyles: {
          fillColor: [6, 78, 59],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold",
          halign: "left",
        },
        bodyStyles: {
          fontSize: 8.5,
          textColor: [51, 65, 85],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { left: 15, right: 15 },
        didDrawPage: (data) => {
          // Footer watermark
          const str = "Page " + doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(148, 163, 184); // slate-400
          doc.text(str, 195 - doc.getTextWidth(str), 285);
          doc.text("© Bachelor Point Hostels Ltd. Admin Cloud - Strict Access Controlled Ledger System", 15, 285);
        }
      });

      // Saving generated output file
      doc.save(`BachelorPoint_Hostel_${activeTab}_Report_${Date.now()}.pdf`);
    } catch (e: any) {
      console.error("Failed to export PDF:", e);
      alert("পিডিএফ জেনারেট করার সময় কোনো ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন। " + e.message);
    }
  };

  const getPackageLabelInBengali = (pkgName: string) => {
    switch (pkgName) {
      case "Basic": return "বেসিক (Basic)";
      case "Standard": return "স্ট্যান্ডার্ড (Standard)";
      case "Premium": return "প্রিমিয়াম (Premium)";
      case "VIP": return "ভিআইপি (VIP)";
      default: return pkgName;
    }
  };

  const getCategoryLabelInBengali = (catName: string) => {
    switch (catName) {
      case "Food": return "খাদ্য ও খাবার";
      case "Electricity": return "বিদ্যুৎ বিল";
      case "Gas": return "গ্যাস বিল";
      case "WiFi": return "ওয়াইফাই";
      case "Salary": return "স্টাফ বেতন";
      case "Maintenance": return "রক্ষণাবেক্ষণ";
      case "Others": return "অন্যান্য খরচ";
      default: return catName;
    }
  };

  const getPaymentMethodInBengali = (method: string) => {
    switch (method) {
      case "bKash": return "বিকাশ (bKash)";
      case "Nagad": return "নগদ (Nagad)";
      case "Rocket": return "রকেট (Rocket)";
      case "Cash": return "নগদ পে (Cash)";
      default: return method;
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

  const getRoomStatusInBengali = (status: string) => {
    switch (status) {
      case "Available": return "ফাঁকা আছে";
      case "Maintenance": return "রক্ষণাবেক্ষণ";
      case "Full": return "সম্পূর্ণ ভর্তি";
      default: return status;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-6" id="report_system_main">
      
      {/* Tab controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-950 font-sans tracking-tight">ই-অ্যাকাউন্টিং এবং সিস্টেম রিপোর্ট</h2>
          <p className="text-xs text-slate-500">রিয়েল-টাইম ব্যবসা ও বর্ডার তালিকা এবং প্রিন্টযোগ্য রিপোর্ট তৈরি করুন।</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handlePrint(`report_content_${activeTab}`)}
            className="p-2.5 bg-slate-50 border hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            রিপোর্ট প্রিন্ট করুন
          </button>
          
          <button
            onClick={handleDownloadReport}
            className="p-2.5 bg-slate-50 border hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            তথ্যাদি ডাউনলোড করুন
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "monthly", label: "মাসিক সারসংক্ষেপ", icon: ClipboardList },
          { id: "monthly_statement", label: "মাসিক আর্থিক ও সিট বিবরণী (PDF)", icon: Sparkles },
          { id: "due", label: "বকেয়া ও জরিমানার তালিকা", icon: ShieldAlert },
          { id: "occupancy", label: "সিট ও রুম বরাদ্দ তালিকা", icon: SquareDot },
          { id: "financial", label: "আয় ও ব্যয় খতিয়ান", icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                activeTab === tab.id
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Report Dynamic Content boxes */}
      <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-2xl">
        
        {/* 1. Monthly summary report layout */}
        {activeTab === "monthly" && (
          <div id="report_content_monthly" className="space-y-4">
            <div className="bg-white p-6 rounded-xl border border-slate-100">
              <span className="text-xs uppercase font-bold text-gray-400 font-sans tracking-widest block">মাসভিত্তিক হোস্টেল প্রশাসনিক খতিয়ান</span>
              <h3 className="text-lg font-bold text-gray-800">কার্য পরিচালন পরিসংখ্যান</h3>
              <p className="text-xs text-gray-500 mt-0.5">বর্তমান সময় পর্যন্ত হোস্টেলের সিট এবং হিসাব নিকাশের সম্যক বিবরণ।</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="p-4 bg-emerald-500/5 border border-emerald-100 rounded-xl">
                  <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">মোট সক্রিয় বর্ডার</span>
                  <span className="text-lg font-extrabold text-emerald-950 font-sans">{activeMembersList.length} জন সক্রিয়</span>
                </div>
                
                <div className="p-4 bg-amber-500/5 border border-amber-100 rounded-xl">
                  <span className="text-[10px] text-amber-900 font-bold block uppercase tracking-wider">চলতি মোট বকেয়া</span>
                  <span className="text-lg font-extrabold text-amber-700 font-sans">৳{totalDuesAmount.toLocaleString()}</span>
                </div>

                <div className="p-4 bg-blue-500/5 border border-emerald-100 rounded-xl">
                  <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">আদায়কৃত সর্বমোট টাকা</span>
                  <span className="text-lg font-extrabold text-emerald-950 font-sans">৳{totalIncomePaid.toLocaleString()}</span>
                </div>

                <div className="p-4 bg-red-500/5 border border-red-100 rounded-xl">
                  <span className="text-[10px] text-red-900 font-bold block uppercase tracking-wider">ব্যয়কৃত সর্বমোট টাকা</span>
                  <span className="text-lg font-extrabold text-red-700 font-sans">৳{totalExpensePaid.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-6 border-t border-dashed border-gray-100 pt-4 text-xs text-gray-500 space-y-1">
                <p>∙ সক্রিয় রুম ও সিট বুকিং অনুপাত: {rooms.reduce((sum, r) => sum + r.seatsBooked, 0)} / {rooms.reduce((sum, r) => sum + r.seatsTotal, 0)} টি সিট বুকড হয়েছে।</p>
                <p>∙ নিট অপারেটিং মার্জিন (মোট আদায় - পরিচালনা ব্যয়): <strong className="text-emerald-700">৳{(totalIncomePaid - totalExpensePaid).toLocaleString()} টাকা</strong>।</p>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Financial & Occupancy Custom Direct PDF Statement Panel */}
        {activeTab === "monthly_statement" && (
          <div id="report_content_monthly_statement" className="space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-5 shadow-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 font-sans tracking-widest block">আবাসিক ও আর্থিক নিরীক্ষা বিবরণী (Comprehensive Statement Audit)</span>
                <h3 className="text-lg font-extrabold text-slate-900 font-sans mt-0.5">মাসিক সমন্বিত পিডিএফ বিবরণী জেনারেটর</h3>
                <p className="text-xs text-slate-550 leading-relaxed max-w-2xl mt-1">
                  একটি নির্দিষ্ট মাসের হোস্টেলের সমস্ত আদায়কৃত ভাড়া (ইনফ্লো), ও যাবতীয় অফিসিয়াল খরচাবলি (আউটফ্লো)-সহ বর্তমান সামগ্রিক সিট ও বাংক অকুপেন্সির বিবরণীর একটি পূর্ণাঙ্গ লেজার পিডিএফ ও অ্যাকাউন্ট স্টেটমেন্ট জেনারেট করুন।
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-4.5 bg-slate-50 border border-slate-200/80 rounded-2xl w-full max-w-2xl">
                <div className="space-y-1.5 flex-1">
                  <label className="text-[10.5px] font-extrabold text-slate-700 block font-sans">বিবরণী তৈরির মাস নির্ধারণ করুন:</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full sm:w-60 p-2.5 bg-white border border-slate-200 text-xs rounded-xl font-bold font-sans text-slate-800 cursor-pointer focus:border-emerald-600 focus:ring-1 focus:ring-emerald-250 focus:outline-none"
                  >
                    {MONTHS_LIST.map((m) => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:self-end">
                  <button
                    type="button"
                    onClick={handleDownloadReport}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-650 hover:bg-emerald-700 text-white font-sans font-bold text-xs rounded-xl cursor-pointer shadow-sm transition-all hover:translate-y-[-1px] active:translate-y-[0px] flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    পিডিএফ ডাউনলোড করুন (Monthly PDF)
                  </button>
                </div>
              </div>

              {/* Real-time calculated KPIs directly on screen */}
              <div>
                <h4 className="text-[10px] font-bold text-[#475569] uppercase tracking-widest mb-3 font-sans">চলতি মাসের রিয়েল-টাইম তথ্য ও অডিট পূর্বাভাস</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-[11.5px]">
                  <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-100/70 space-y-1">
                    <span className="text-[9.5px] font-bold text-emerald-800 block uppercase tracking-wider">সিট অকুপেনসি লেভেল</span>
                    <span className="text-base font-extrabold text-emerald-950 block">
                      {occupiedBeds} / {totalBeds} বেড বরাদ্দ আছে ({occupancyPercentage}%)
                    </span>
                    <p className="text-[10px] text-gray-550">হোস্টেল বেড বা অকুপেনসি হাড় অনুকূল অবস্থানে আছে।</p>
                  </div>

                  <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-100/70 space-y-1">
                    <span className="text-[9.5px] font-bold text-blue-800 block uppercase tracking-wider">চলতি মাসের আনুমানিক আয় (Inflows)</span>
                    <span className="text-base font-extrabold text-blue-950 block">
                      ৳{(
                        payments.filter(p => p.status === "Paid" && p.month === getMonthYearString(selectedMonth)).reduce((sum, p) => sum + p.amount, 0) +
                        expenses.filter(e => e.type === "Income" && e.date.startsWith(selectedMonth)).reduce((sum, e) => sum + e.amount, 0)
                      ).toLocaleString()} BDT
                    </span>
                    <p className="text-[10px] text-gray-550">ভাড়া আদায় ও অন্যান্য আনুষঙ্গিক উপার্জন থেকে প্রাপ্ত।</p>
                  </div>

                  <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-100/70 space-y-1">
                    <span className="text-[9.5px] font-bold text-rose-800 block uppercase tracking-wider">চলতি মাসের আনুমানিক ব্যয় (Outflows)</span>
                    <span className="text-base font-extrabold text-rose-950 block">
                      ৳{(expenses.filter(e => e.type === "Expense" && e.date.startsWith(selectedMonth)).reduce((sum, e) => sum + e.amount, 0)).toLocaleString()} BDT
                    </span>
                    <p className="text-[10px] text-gray-550">বিদ্যুৎ বিল, গ্যাস বিল, ক্যাটারিং ও স্টাফ বেতন বাবদ ব্যয়।</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Dues Arrears List Tab */}
        {activeTab === "due" && (
          <div id="report_content_due" className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
              <div className="p-4 bg-slate-50/50 border-b flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-amber-700 block uppercase tracking-wider">চলতি বকেয়ার খতিয়ান</span>
                  <h3 className="text-xs font-extrabold text-gray-900 font-sans">বোর্ডারের ওভারডিউ বকেয়া শিট</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-100 font-bold text-red-700">৳{totalDuesAmount} বকেয়া আছে</span>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafc]/80 text-gray-500 text-[10px] uppercase font-bold border-b">
                  <tr>
                    <th className="p-3">বোর্ডারের বিবরণ</th>
                    <th className="p-3 text-center">রুম নম্বর (সিট)</th>
                    <th className="p-3 text-center">প্যাকেজ প্ল্যান</th>
                    <th className="p-3 text-right">বকেয়ার পরিমাণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700 font-sans">
                  {totalDuesList.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/40">
                      <td className="p-3">
                        <div className="font-semibold text-gray-900">{m.fullName}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{m.phone}</div>
                      </td>
                      <td className="p-3 text-center font-mono">রুম {m.roomNo} ({m.seatNo})</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-gray-800 text-[10px] rounded font-bold">
                          {getPackageLabelInBengali(m.packageName)}
                        </span>
                      </td>
                      <td className="p-3 text-right font-extrabold text-red-600">৳{m.dueAmount}</td>
                    </tr>
                  ))}
                  {totalDuesList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400 italic">
                        অভিনন্দন! সব বোর্ডারের বকেয়া পরিশোধিত রয়েছে।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Occupancy Layout List Tab */}
        {activeTab === "occupancy" && (
          <div id="report_content_occupancy" className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
              <div className="p-4 bg-slate-50/50 border-b">
                <span className="text-[10px] font-bold text-emerald-800 block uppercase tracking-wider">রুম বরাদ্দ খতিয়ান</span>
                <h3 className="text-xs font-extrabold text-gray-900 font-sans">রুম ও সিট বরাদ্দ রিয়েল-টাইম তালিকা</h3>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafc]/80 text-gray-500 text-[10px] uppercase font-bold border-b">
                  <tr>
                    <th className="p-3">বিল্ডিং উইং</th>
                    <th className="p-3 text-center">রুম নম্বর</th>
                    <th className="p-3 text-center">সিটের ধারণক্ষমতা</th>
                    <th className="p-3 text-center">আবাসিক বুকিং সংখ্যা</th>
                    <th className="p-3 text-right">রুমের স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700 font-sans">
                  {rooms.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/40">
                      <td className="p-3 font-semibold text-gray-900">{r.blockName} ({r.floor} তলা)</td>
                      <td className="p-3 text-center font-mono">রুম {r.roomNo}</td>
                      <td className="p-3 text-center">{r.seatsTotal} টি সিট</td>
                      <td className="p-3 text-center text-emerald-700 font-semibold">{r.seatsBooked} টি সিট ভর্তি</td>
                      <td className="p-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === "Maintenance"
                              ? "bg-red-50 text-red-700"
                              : r.seatsBooked === r.seatsTotal
                              ? "bg-blue-50 text-blue-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {getRoomStatusInBengali(r.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Financial Inflows and Outflows Tab */}
        {activeTab === "financial" && (
          <div id="report_content_financial" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Payment entries list (Inflows) */}
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="p-4 bg-slate-50/50 border-b">
                  <span className="text-[10px] font-bold text-emerald-800 block uppercase tracking-wider">টাকা আদায়ের রেকর্ড (আয়)</span>
                  <h3 className="text-xs font-extrabold text-gray-900 font-sans">ভাড়া আদায়ের সংক্ষিপ্ত খতিয়ান</h3>
                </div>
                <table className="w-full text-left text-[11px] font-sans">
                  <thead className="bg-[#f8fafc]/80 text-gray-500 uppercase text-[9px] font-bold border-b animate-none">
                    <tr>
                      <th className="p-2">বর্ডার</th>
                      <th className="p-2 text-center">মাধ্যম</th>
                      <th className="p-2 text-right">টাকা</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y animate-none">
                    {payments.slice(0, 5).map((p) => (
                      <tr key={p.id}>
                        <td className="p-2 font-medium text-gray-800">
                          {p.memberName}
                          <span className="block text-[9px] text-gray-400 font-mono">{getMonthInBengali(p.month)}</span>
                        </td>
                        <td className="p-2 text-center font-semibold text-emerald-800">{getPaymentMethodInBengali(p.method)}</td>
                        <td className="p-2 text-right font-extrabold text-gray-900">৳{p.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Expense entries list (Outflows) */}
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="p-4 bg-slate-50/50 border-b">
                  <span className="text-[10px] font-bold text-red-800 block uppercase tracking-wider">পরিচালনা ব্যয় রেকর্ড (ব্যয়)</span>
                  <h3 className="text-xs font-extrabold text-gray-900 font-sans text-right shrink-0">মাসিক খরচের সংক্ষিপ্ত খতিয়ান</h3>
                </div>
                <table className="w-full text-left text-[11px] font-sans">
                  <thead className="bg-[#f8fafc]/80 text-gray-500 uppercase text-[9px] font-bold border-b">
                    <tr>
                      <th className="p-2">ব্যয়ের খতিয়ান</th>
                      <th className="p-2 text-center">খাত</th>
                      <th className="p-2 text-right">খরচ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-sans text-gray-750">
                    {expenses.slice(0, 5).map((e) => (
                      <tr key={e.id}>
                        <td className="p-2 font-medium text-gray-800">
                          {e.title}
                          <span className="block text-[9px] font-mono text-gray-400">{e.date}</span>
                        </td>
                        <td className="p-2 text-center">
                          <span className="px-1.5 py-0.5 bg-slate-100 text-gray-600 rounded text-[9px]">
                            {getCategoryLabelInBengali(e.category)}
                          </span>
                        </td>
                        <td className="p-2 text-right font-extrabold text-red-600">৳{e.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* 5. OVERDUE BALANCE LIMIT AUTO-NOTIFIER SCANNER */}
      <div className="bg-emerald-50/40 rounded-2xl border-2 border-dashed border-emerald-200 p-5 mt-6 space-y-4 font-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md inline-block font-sans">
              রিয়েল-টাইম অটোমেটেড ইন্টেলিজেন্ট স্ক্যানার
            </span>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 pt-0.5 font-sans">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
              বকেয়া সীমা অটো-নোটিফায়ার উইজার্ড (Overdue Scanner)
            </h3>
            <p className="text-[11.5px] leading-relaxed text-slate-500 font-sans">
              নির্ধারিত বকেয়া সীমার (Threshold Limit) বেশি বকেয়া থাকা বর্ডারদের সরাসরি স্বয়ংক্রিয়ভাবে নোটিফিকেশন সিস্টেমের মাধ্যমে অ্যালার্ট পাঠান।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shrink-0">
            <div className="space-y-0.5 min-w-[140px] font-sans">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                <span>বকেয়া সীমা নির্ধারণ</span>
                <span className="text-emerald-700 font-mono font-extrabold">৳{scanThreshold}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="5000"
                step="500"
                value={scanThreshold}
                onChange={(e) => {
                  setScanThreshold(Number(e.target.value));
                  setScanResult(null);
                }}
                className="w-full accent-emerald-600 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none mt-1"
              />
            </div>

            <button
              onClick={handleTriggerScanner}
              disabled={isScanning}
              className={`py-2 px-4 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs font-sans ${
                isScanning
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]"
              }`}
            >
              {isScanning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>স্ক্যানিং হচ্ছে...</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>নোটিফিকেশন স্ক্যান শুরু করুন</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time feedback statistics preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-sans">
          <div className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <span className="text-[11px] text-slate-500 font-sans">
              সীমা অতিক্রমকারী বর্ডার:{" "}
              <strong className="text-slate-800 font-extrabold">
                {members.filter((m) => m.status === "Active" && m.dueAmount >= scanThreshold).length} জন
              </strong>
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center gap-2 mt-0.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-[11px] text-slate-500 font-sans">
              অ্যালার্টযোগ্য মোট টাকা:{" "}
              <strong className="text-amber-700 font-extrabold">
                ৳
                {members
                  .filter((m) => m.status === "Active" && m.dueAmount >= scanThreshold)
                  .reduce((sum, m) => sum + m.dueAmount, 0)
                  .toLocaleString()}
              </strong>
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center gap-2 mt-0.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] text-slate-500 font-sans">
              অটোমেটিক ব্যাকগ্রাউন্ড ওয়াচ:{" "}
              <strong className="text-emerald-700 font-bold">সক্রিয় (Active)</strong>
            </span>
          </div>
        </div>

        {/* Scan outcome banner */}
        {scanResult && scanResult.ran && (
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2.5 animate-fadeIn font-sans">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[11.5px] font-bold text-emerald-950 font-sans">
                বকেয়া খতিয়ান স্ক্যান সফলভাবে সম্পন্ন হয়েছে 🎉
              </p>
              <p className="text-[11px] text-slate-600 leading-normal font-sans">
                ৳{scanThreshold} বা তার বেশি বকেয়া থাকা সব বর্ডারদের তথ্য যাচাই করা হয়েছে। 
                সীমা অতিক্রম করা <strong className="text-emerald-800 font-extrabold">{scanResult.scannedCount} জনের</strong> মধ্যে নতুনভাবে{" "}
                <strong className="text-emerald-700 font-black underline">{scanResult.alertsCreated} টি সতর্কতা নোটিফিকেশন</strong> অ্যাডমিন ইনবক্সে ও ডাটাবেজে যুক্ত করা হয়েছে!
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
