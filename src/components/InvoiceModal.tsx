import { Printer, Download, CreditCard, Check, X, ShieldAlert, Award } from "lucide-react";
import { Payment } from "../types";
import { jsPDF } from "jspdf";

interface InvoiceModalProps {
  payment: Payment;
  onClose: () => void;
}

export function InvoiceModal({ payment, onClose }: InvoiceModalProps) {
  const handlePrint = () => {
    const printContent = document.getElementById("printable-receipt-area")?.innerHTML;

    if (printContent) {
      // Create a temporary hidden iframe for robust, sandbox-safe printing without popup blocks
      const iframe = document.createElement("iframe");
      iframe.id = "print-invoice-iframe";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (iframeDoc) {
        iframeDoc.write(`
          <html>
            <head>
              <title>রসিদ - ব্যাচেলর পয়েন্ট হোস্টেল</title>
              <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                @page {
                  size: A4 portrait;
                  margin: 15mm;
                }
                body {
                  font-family: 'Inter', sans-serif;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  background-color: #ffffff;
                  color: #1e293b;
                  margin: 0;
                  padding: 0;
                }
                .a4-container {
                  width: 100%;
                  margin: 0 auto;
                  box-sizing: border-box;
                }
                /* Ensure all elements enforce background colors and border strokes when printing */
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                /* Hide close buttons or headers that might bleed in */
                button, .no-print {
                  display: none !important;
                }
              </style>
            </head>
            <body>
              <div class="a4-container">
                ${printContent}
              </div>
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                    setTimeout(function() {
                      // Remove iframe from parent document
                      const element = window.parent.document.getElementById("print-invoice-iframe");
                      if (element) {
                        element.parentNode.removeChild(element);
                      }
                    }, 1000);
                  }, 500);
                }
              </script>
            </body>
          </html>
        `);
        iframeDoc.close();
      }
    }
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a5",
      });

      // Colors
      const primaryColor = [6, 78, 59]; // Deep Emerald

      // Draw top header header background
      doc.setFillColor(6, 78, 59);
      doc.rect(0, 0, 148, 28, "F");

      // App Name/Logo
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("BACHELOR POINT HOSTEL", 10, 10);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(167, 243, 208);
      doc.text("Premium Hostel Administrative Ledger & Boarding ERP System", 10, 14);

      // System watermark on right side of top bar
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("PAYMENT RECEIPT", 100, 10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(209, 250, 229);
      doc.text("SECURE SYSTEM GENERATED", 100, 13);

      // Section: Receipt details
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("BILL TO (RESIDENT BOARDER):", 10, 38);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Name: ${payment.memberName}`, 10, 43);
      doc.text(`Room Info: Room ${payment.roomNo} (Bed ${payment.seatNo})`, 10, 48);

      // Receipt Metadata
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("TRANSACTION DETAILS:", 85, 38);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Receipt No: BP-${payment.id.substring(0, 8).toUpperCase()}`, 85, 43);
      doc.text(`Date: ${new Date(payment.timestamp || Date.now()).toLocaleDateString()}`, 85, 48);
      doc.text(`Method: ${payment.method}`, 85, 53);
      doc.text(`TrxID: ${payment.transactionId || "N/A"}`, 85, 58);

      // Items table header
      doc.setFillColor(241, 245, 249);
      doc.rect(10, 65, 128, 7, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text("Billing Item Description", 12, 70);
      doc.text("Period", 85, 70);
      doc.text("Paid Amount", 112, 70);

      // Items content
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Hostel seat rent & amenities (${payment.type})`, 12, 78);
      doc.text(payment.month, 85, 78);
      doc.text(`BDT ${payment.amount.toLocaleString()}`, 112, 78);

      // Divider line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(10, 83, 138, 83);

      // Summary payment info
      doc.setFillColor(240, 253, 250);
      doc.rect(10, 88, 128, 12, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(6, 78, 59);
      doc.text("NET AMOUNT PAID:", 14, 95);
      doc.text(`BDT ${payment.amount.toLocaleString()} Taka`, 85, 95);

      // Stamp section
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("This is an electronically verified real-time voucher log.", 10, 110);
      doc.text("Thank you for choosing Bachelor Point Hostel.", 10, 114);

      // Beautiful green seal stamp layout
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.5);
      doc.rect(100, 105, 38, 10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(16, 185, 129);
      doc.text("PAID RECEIVED", 106, 111);

      // Save generated pdf file
      doc.save(`Receipt_BP_${payment.id.substring(0, 8).toUpperCase()}.pdf`);
    } catch (err: any) {
      console.error("PDF download error:", err);
      alert("রসিদ পিডিএফ ডাউনলোড করার সময় ত্রুটি ঘটেছে: " + err.message);
    }
  };

  const getPaymentTypeInBengali = (type: string) => {
    switch (type) {
      case "AdvanceBooking":
        return "অগ্রিম বুকিং";
      case "Package1":
        return "প্যাকেজ ১";
      case "Package2":
        return "প্যাকেজ ২";
      case "Package3":
        return "প্যাকেজ ৩";
      case "Package4":
        return "প্যাকেজ ৪";
      case "SeatRent":
      case "Basic":
        return "সিট ভাড়া";
      case "Penalty":
        return "জরিমানা/ ফেনাল্টি ফাইন";
      case "OldGoodsSale":
        return "পুরাতন মালামাল বিক্রয়";
      case "Rent":
        return "সাধারণ রুম ভাড়া";
      case "Food":
        return "খাবার বিল";
      default:
        return type || "অন্যান্য";
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
    // English month mapping
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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg border border-slate-100 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header toolbar */}
        <div className="bg-emerald-950 p-4 text-white flex justify-between items-center shrink-0">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">ডিজিটাল চালান ও রসিদ খতিয়ান</span>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="p-1.5 hover:bg-emerald-900 rounded-lg text-emerald-300 hover:text-emerald-50 transition-colors cursor-pointer"
              title="রসিদ প্রিন্ট করুন"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownloadPDF}
              className="p-1.5 hover:bg-emerald-900 rounded-lg text-emerald-300 hover:text-emerald-50 transition-colors cursor-pointer"
              title="পিডিএফ ডাউনলোড করুন"
            >
              <Download className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="text-white hover:text-red-400 cursor-pointer pl-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Printable Area */}
        <div className="p-6 overflow-y-auto flex-1 font-sans bg-slate-50/50" id="printable-receipt-area">
          <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-6">
            
            {/* Logo and metadata header */}
            <div className="flex justify-between items-start border-b border-dashed border-gray-100 pb-5">
              <div>
                <span className="text-lg font-extrabold text-emerald-950 block tracking-tight">ব্যাচেলর পয়েন্ট</span>
                <span className="text-[10px] font-bold text-emerald-600 block tracking-widest uppercase">
                  হোস্টেল ও বোর্ডিং ইআরপি
                </span>
                <p className="text-[10px] text-gray-500 max-w-[200px] leading-tight mt-1">
                  প্লট ১৫, সেক্টর ১০, উত্তরা, ঢাকা-১২৩০, বাংলাদেশ
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold font-mono py-1 px-2 text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-md">
                  পরিশোধিত রসিদ
                </span>
                <p className="text-[10px] text-gray-400 mt-2">রসিদ নং: BP-{payment.id.substring(0, 8).toUpperCase()}</p>
                <p className="text-[10px] text-gray-400">তারিখ: {new Date(payment.timestamp).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Bill to Section */}
            <div className="grid grid-cols-2 gap-4 text-xs font-sans">
              <div>
                <span className="text-[10px] font-bold text-gray-400 block tracking-wider uppercase">আবাসিক বর্ডার</span>
                <span className="font-extrabold text-gray-800 text-sm block">{payment.memberName}</span>
                <p className="text-gray-500 mt-0.5">বুকিং রুম: {payment.roomNo}</p>
                <p className="text-gray-500">বুকিং সিট: বেড-{payment.seatNo}</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-400 block tracking-wider uppercase">লেনদেনের বিবরণ</span>
                <p className="text-gray-800 font-semibold">{getPaymentMethodInBengali(payment.method)}</p>
                <p className="text-gray-500 font-mono text-[10px]">লেনদেন (ID): {payment.transactionId}</p>
                <p className="text-gray-500">বকেয়া মাস: {getMonthInBengali(payment.month)}</p>
              </div>
            </div>

            {/* Invoice Line Items */}
            <div className="border border-slate-100 rounded-xl overflow-hidden mt-2 font-sans">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b">
                  <tr>
                    <th className="p-3">বিবরণ</th>
                    <th className="p-3 text-center">মাস</th>
                    <th className="p-3 text-right">টাকার পরিমাণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700">
                  <tr>
                    <td className="p-3 font-semibold text-gray-800">
                      হোস্টেল প্যাকেজ সিট ভাড়া এবং আনুষঙ্গিক সুবিধাদি বিল ({getPaymentTypeInBengali(payment.type)})
                      <span className="block text-[10px] font-medium text-gray-400 mt-0.5">
                        রুম সার্ভিস, বিদ্যুৎ, ওয়াইফাই এবং নিরাপত্তা বিলসহ খাবার খরচ
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono">{getMonthInBengali(payment.month)}</td>
                    <td className="p-3 text-right font-extrabold">৳{payment.amount}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-between items-center bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100 text-emerald-950 font-sans">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Check className="w-4 h-4 text-emerald-600 border border-emerald-300 rounded-full bg-white p-0.5 animate-none" />
                <span>লেনদেন সম্পন্ন হয়েছে</span>
              </div>

              <div className="text-right text-xs">
                <span className="font-medium text-emerald-800 block">মোট আদায়কৃত পরিমাণ</span>
                <span className="text-lg font-black">৳{payment.amount} টাকা</span>
              </div>
            </div>

            {/* Footer stamp block */}
            <div className="flex justify-between items-end pt-4 text-[9px] text-gray-400 border-t border-dashed font-sans">
              <div>
                <p>ডিজিটাল সিস্টেম দ্বারা স্বয়ংক্রিয়ভাবে অনুমোদিত রসিদ।</p>
                <p>© ব্যাচেলর পয়েন্ট হোস্টেল ম্যানেজমেন্ট প্ল্যাটফর্ম।</p>
              </div>

              <div className="text-center font-serif text-emerald-800 font-bold border-2 border-emerald-600/30 rounded px-2.5 py-1 uppercase tracking-widest rotate-[-3deg] shrink-0">
                টাকা জমা হয়েছে
              </div>
            </div>

          </div>
        </div>

        {/* Bottom controls */}
        <div className="bg-slate-50 p-4 border-t flex flex-col sm:flex-row justify-between gap-3 shrink-0 items-stretch sm:items-center font-sans">
          <span className="text-[10px] text-gray-400 self-center leading-tight">
            প্রিন্ট প্রিভিউ দেখতে অথবা A4 মাপে সরাসরি প্রিন্ট করতে প্রিন্ট বাটন চাপুন।
          </span>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs"
            >
              <Printer className="w-4 h-4 text-emerald-600" />
              প্রিন্ট করুন (Print)
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
            >
              রসিদ বন্ধ করুন
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
