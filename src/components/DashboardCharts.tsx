import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Expense, Payment } from "../types";

interface DashboardChartsProps {
  payments: Payment[];
  expenses: Expense[];
  seatStatusCounts: {
    available: number;
    booked: number;
    reserved: number;
    maintenance: number;
  };
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6b7280"];

// Category translation mapping helper
const getCategoryLabelInBengali = (catName: string) => {
  switch (catName) {
    case "Food": return "খাদ্য ও খাবার";
    case "Electricity": return "বিদ্যুৎ বিল";
    case "Gas": return "গ্যাস বিল";
    case "WiFi": return "ওয়াইফাই";
    case "Salary": return "কর্মচারী বেতন";
    case "Maintenance": return "রক্ষণাবেক্ষণ";
    case "Others": return "অন্যান্য খরচ";
    default: return catName;
  }
};

// Seat Status translation mapping helper
const getSeatStatusLabelInBengali = (statusName: string) => {
  switch (statusName) {
    case "Occupied": return "আবাসিক ভর্তি";
    case "Available": return "ফাঁকা সিট";
    case "Reserved": return "সংরক্ষিত";
    case "Maintenance": return "রক্ষণাবেক্ষণ";
    default: return statusName;
  }
};

export function DashboardCharts({ payments, expenses, seatStatusCounts }: DashboardChartsProps) {
  const getBengaliMonthName = (monthStr: string) => {
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

  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthNamesInEnglish = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonthEng = `${monthNamesInEnglish[now.getMonth()]} ${now.getFullYear()}`;

  // Calculate monthly income from paid boarder payments
  const currentMonthIncomePayments = payments
    .filter((p) => p.status === "Paid" && p.month === currentMonthEng)
    .reduce((sum, p) => sum + p.amount, 0);

  // Calculate monthly income from direct general income records
  const currentMonthIncomeGeneral = expenses
    .filter((e) => e.type === "Income" && e.date.startsWith(currentYearMonth))
    .reduce((sum, e) => sum + e.amount, 0);

  const totalCurrentMonthIncome = currentMonthIncomePayments + currentMonthIncomeGeneral;

  // Calculate monthly expense
  const totalCurrentMonthExpense = expenses
    .filter((e) => e.type === "Expense" && e.date.startsWith(currentYearMonth))
    .reduce((sum, e) => sum + e.amount, 0);

  const currentMonthProfitLoss = totalCurrentMonthIncome - totalCurrentMonthExpense;

  // 1. Calculate Monthly Revenue Grouped by Month
  const monthlyRevenueMap: { [month: string]: number } = {};
  payments.forEach((p) => {
    if (p.status === "Paid") {
      monthlyRevenueMap[p.month] = (monthlyRevenueMap[p.month] || 0) + p.amount;
    }
  });

  // Convert to chart format
  const revenueData = Object.keys(monthlyRevenueMap).map((month) => {
    // Translate month names in the chart
    let translatedName = month;
    if (month.includes("January") || month.includes("Jan")) translatedName = month.replace("January", "জানুয়ারি").replace("Jan", "জানু");
    else if (month.includes("February") || month.includes("Feb")) translatedName = month.replace("February", "ফেব্রুয়ারি").replace("Feb", "ফেব্রু");
    else if (month.includes("March") || month.includes("Mar")) translatedName = month.replace("March", "মার্চ").replace("Mar", "মার্চ");
    else if (month.includes("April") || month.includes("Apr")) translatedName = month.replace("April", "এপ্রিল").replace("Apr", "এপ্রি");
    else if (month.includes("May")) translatedName = month.replace("May", "মে");
    else if (month.includes("June") || month.includes("Jun")) translatedName = month.replace("June", "জুন").replace("Jun", "জুন");
    else if (month.includes("July") || month.includes("Jul")) translatedName = month.replace("July", "জুলাই").replace("Jul", "জুলাই");
    else if (month.includes("August") || month.includes("Aug")) translatedName = month.replace("August", "আগস্ট").replace("Aug", "আগ");
    else if (month.includes("September") || month.includes("Sep")) translatedName = month.replace("September", "সেপ্টেম্বর").replace("Sep", "সেপ্টে");
    else if (month.includes("October") || month.includes("Oct")) translatedName = month.replace("October", "অক্টোবর").replace("Oct", "অক্টো");
    else if (month.includes("November") || month.includes("Nov")) translatedName = month.replace("November", "নভেম্বর").replace("Nov", "নভে");
    else if (month.includes("December") || month.includes("Dec")) translatedName = month.replace("December", "ডিসেম্বর").replace("Dec", "ডিসে");

    return {
      name: translatedName,
      amount: monthlyRevenueMap[month],
    };
  });

  if (revenueData.length === 0) {
    revenueData.push(
      { name: "জানুয়ারি ২০২৬", amount: 12500 },
      { name: "ফেব্রুয়ারি ২০২৬", amount: 14800 },
      { name: "মার্চ ২০২৬", amount: 16500 },
      { name: "এপ্রিল ২০২৬", amount: 18100 },
      { name: "মে ২০২৬", amount: payments.reduce((sum, p) => p.status === "Paid" ? sum + p.amount : sum, 0) || 18100 }
    );
  }

  // 2. Calculate Expense breakdown
  const expenseBreakdownMap: { [category: string]: number } = {
    Food: 0,
    Electricity: 0,
    Gas: 0,
    WiFi: 0,
    Salary: 0,
    Maintenance: 0,
    Others: 0,
  };

  expenses.forEach((e) => {
    if (e.type === "Expense") {
      expenseBreakdownMap[e.category] = (expenseBreakdownMap[e.category] || 0) + e.amount;
    }
  });

  const expensePieData = Object.keys(expenseBreakdownMap)
    .map((cat) => ({
      name: getCategoryLabelInBengali(cat),
      value: expenseBreakdownMap[cat],
    }))
    .filter((v) => v.value > 0);

  const finalExpensePieData =
    expensePieData.length > 0
      ? expensePieData
      : [
          { name: "খাদ্য ও খাবার", value: 12500 },
          { name: "বিদ্যুৎ বিল", value: 4800 },
          { name: "ওয়াইফাই ও ইন্টারনেট", value: 2400 },
          { name: "রক্ষণাবেক্ষণ", value: 3200 },
          { name: "কর্মচারী বেতন", value: 18550 },
        ];

  // 3. Seat status bar chart
  const seatBarData = [
    { name: "ভর্তি সিট", count: seatStatusCounts.booked, fill: "#10b981" },
    { name: "ফাঁকা সিট", count: seatStatusCounts.available, fill: "#34d399" },
    { name: "সংরক্ষিত", count: seatStatusCounts.reserved, fill: "#f59e0b" },
    { name: "রক্ষণাবেক্ষণ", count: seatStatusCounts.maintenance, fill: "#ef4444" },
  ];

  return (
    <div className="flex flex-col gap-6 mb-8" id="dashboard_charts_container">
      {/* 1. Monthly Revenue Horizontal Card - Widescreen Rectangular Shape */}
      <div className="bg-white p-6 rounded-2xl border border-emerald-50 shadow-sm flex flex-col w-full" id="chart_revenue">
        <div className="flex flex-col mb-4">
          <span className="text-sm font-medium text-gray-500 font-sans">হিসাব খাতা ({getBengaliMonthName(currentMonthEng)})</span>
          <span className="text-xl font-bold text-gray-900 font-sans">চলতি মাসের আয় - ব্যয় এর হিসাব</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {/* Box 1: Total Income */}
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl px-5 py-4 flex items-center justify-between shadow-2xs hover:bg-emerald-50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💰</span>
              <div className="flex flex-col">
                <span className="font-black text-sm text-emerald-950 font-sans">মোট আয়</span>
              </div>
            </div>
            <span className="text-lg font-black text-emerald-700 font-sans">৳ {totalCurrentMonthIncome.toLocaleString()}</span>
          </div>

          {/* Box 2: Total Expense */}
          <div className="bg-rose-50/40 border border-rose-100 rounded-xl px-5 py-4 flex items-center justify-between shadow-2xs hover:bg-rose-50/60 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💸</span>
              <div className="flex flex-col">
                <span className="font-black text-sm text-rose-950 font-sans">মোট ব্যয়</span>
              </div>
            </div>
            <span className="text-lg font-black text-rose-600 font-sans">৳ {totalCurrentMonthExpense.toLocaleString()}</span>
          </div>

          {/* Box 3: Profit / Loss */}
          <div className={`border rounded-xl px-5 py-4 flex items-center justify-between shadow-2xs transition-colors ${
            currentMonthProfitLoss >= 0 
              ? "bg-sky-50/50 border-sky-100 hover:bg-sky-50 text-sky-950" 
              : "bg-amber-50/55 border-amber-100 hover:bg-amber-50 text-amber-950"
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentMonthProfitLoss >= 0 ? "📈" : "📉"}</span>
              <div className="flex flex-col">
                <span className="font-black text-sm font-sans">লাভ / ক্ষতি</span>
              </div>
            </div>
            <span className={`text-lg font-black font-sans ${currentMonthProfitLoss >= 0 ? "text-sky-700" : "text-amber-600"}`}>
              ৳ {currentMonthProfitLoss.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. Expense Category Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-emerald-50 shadow-sm" id="chart_expenses">
        <div className="flex flex-col mb-4">
          <span className="text-sm font-medium text-gray-500 font-sans">খাত অনুসারে খরচের হিসেব</span>
          <span className="text-xl font-bold text-gray-900 font-sans">হোস্টেল পরিচালনা ব্যয়</span>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="w-1/2 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={finalExpensePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {finalExpensePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`৳ ${Number(value).toLocaleString()}`, "খরচের পরিমাণ"]}
                  contentStyle={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-1/2 flex flex-col justify-center gap-1.5 pl-2 font-sans md:font-semibold">
            {finalExpensePieData.slice(0, 5).map((entry, index) => (
              <div key={entry.name} className="flex items-center text-xs text-gray-600 gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="truncate max-w-[80px]" title={entry.name}>
                  {entry.name}
                </span>
                <span className="font-semibold ml-auto text-gray-900">
                  ৳{entry.value > 1000 ? `${(entry.value / 1000).toFixed(1)}k` : entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Seat Distribution Bar Chart */}
      <div className="bg-white p-6 rounded-2xl border border-emerald-50 shadow-sm" id="chart_seats">
        <div className="flex flex-col mb-4">
          <span className="text-sm font-medium text-gray-500 font-sans">সিট বুকিং এবং খালি সিটের অনুপাত</span>
          <span className="text-xl font-bold text-gray-900 font-sans">রিয়েল-টাইম সিট হিসাব</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={seatBarData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                cursor={{ fill: "rgba(16, 185, 129, 0.05)" }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} name="সিট সংখ্যা">
                {seatBarData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </div>
  );
}
