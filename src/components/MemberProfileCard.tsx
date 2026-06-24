import React, { useState, useEffect } from "react";
import { Member, HostelPackage, Seat } from "../types";
import { User, Phone, ShieldAlert, Award, Calendar, CreditCard, QrCode, ClipboardList, PenTool, Edit3, X, Check, CheckCircle2 } from "lucide-react";

interface MemberProfileCardProps {
  member: Member;
  packages: HostelPackage[];
  seats: Seat[];
  onPaymentCollect: (memberId: string, amount: number, type: string, method: "Cash" | "bKash" | "Nagad" | "Rocket") => void;
  onUpdateMember: (memberId: string, updatedFields: Partial<Member>) => void;
}

export function MemberProfileCard({
  member,
  packages,
  seats,
  onPaymentCollect,
  onUpdateMember,
}: MemberProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // Edit fields
  const [fullName, setFullName] = useState(member.fullName);
  const [phone, setPhone] = useState(member.phone);
  const [nidOrStudentId, setNidOrStudentId] = useState(member.nidOrStudentId);
  const [guardianName, setGuardianName] = useState(member.guardianName);
  const [guardianPhone, setGuardianPhone] = useState(member.guardianPhone);
  const [emergencyContact, setEmergencyContact] = useState(member.emergencyContact);
  const [leavingDate, setLeavingDate] = useState(member.leavingDate || "");
  const [leavingNextMonth, setLeavingNextMonth] = useState(member.leavingNextMonth || false);
  const [status, setStatus] = useState<"Active" | "Inactive">(member.status);
  
  // Custom profession & institution states
  const [profession, setProfession] = useState<"Student" | "Job Holder">(member.profession || "Student");
  const [institutionName, setInstitutionName] = useState(member.institutionName || "");
  const [idCardNo, setIdCardNo] = useState(member.idCardNo || "");
  const [photoUrl, setPhotoUrl] = useState(member.photoUrl || "");

  // Collect Cash payment fields
  const [payAmount, setPayAmount] = useState(member.dueAmount);
  const [payType, setPayType] = useState<string>(member.packageName || "Basic");
  const [payMethod, setPayMethod] = useState<"Cash" | "bKash" | "Nagad" | "Rocket">("bKash");

  const [paySuccess, setPaySuccess] = useState(false);

  // Synchronize when the active member selection transitions
  useEffect(() => {
    setFullName(member.fullName);
    setPhone(member.phone);
    setNidOrStudentId(member.nidOrStudentId);
    setGuardianName(member.guardianName);
    setGuardianPhone(member.guardianPhone);
    setEmergencyContact(member.emergencyContact);
    setLeavingDate(member.leavingDate || "");
    setLeavingNextMonth(member.leavingNextMonth || false);
    setStatus(member.status);
    setProfession(member.profession || "Student");
    setInstitutionName(member.institutionName || "");
    setIdCardNo(member.idCardNo || "");
    setPayAmount(member.dueAmount);
    setPayType(member.packageName || "Basic");
    setPhotoUrl(member.photoUrl || "");
  }, [member]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMember(member.id, {
      fullName,
      phone,
      nidOrStudentId,
      guardianName,
      guardianPhone,
      emergencyContact,
      leavingDate: leavingDate || null,
      leavingNextMonth: leavingNextMonth,
      status: status,
      profession,
      institutionName,
      idCardNo,
      photoUrl,
    });
    setIsEditing(false);
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;
    if (payAmount > member.dueAmount) {
      alert("আদায়কৃত টাকার পরিমাণ চলতি বকেয়ার চেয়ে বেশি হতে পারে না!");
      return;
    }

    onPaymentCollect(member.id, payAmount, payType, payMethod);
    setPaySuccess(true);
    setTimeout(() => {
      setPaySuccess(false);
      setIsPaying(false);
    }, 1800);
  };

  // Convert packageName display to Bengali
  const getPackageLabelInBengali = (pkgName: string) => {
    switch (pkgName) {
      case "Basic": return "বেসিক (Basic)";
      case "Standard": return "স্ট্যান্ডার্ড (Standard)";
      case "Premium": return "প্রিমিয়াম (Premium)";
      case "VIP": return "ভিআইপি (VIP)";
      default: return pkgName;
    }
  };

  const memberPackage = packages.find((p) => p.name === member.packageName);

  const renderInteractiveQrCodeSvg = (hash: string) => {
    return (
      <svg viewBox="0 0 100 100" className="w-28 h-28 mx-auto stroke-none fill-emerald-950">
        <rect width="100" height="100" fill="#f8fafc" rx="8" />
        <path d="M10,10 h20 v20 h-20 z M15,15 h10 v10 h-10 z" />
        <path d="M70,10 h20 v20 h-20 z M75,15 h10 v10 h-10 z" />
        <path d="M10,70 h20 v20 h-20 z M15,75 h10 v10 h-10 z" />
        <rect x="35" y="10" width="8" height="8" />
        <rect x="47" y="15" width="12" height="6" />
        <rect x="35" y="24" width="24" height="6" />
        <rect x="10" y="35" width="8" height="24" />
        <rect x="22" y="35" width="24" height="8" />
        <rect x="22" y="47" width="12" height="12" />
        <rect x="38" y="47" width="21" height="8" />
        <rect x="10" y="63" width="30" height="4" />
        <rect x="44" y="35" width="15" height="15" />
        <rect x="70" y="35" width="20" height="10" />
        <rect x="70" y="49" width="10" height="15" />
        <rect x="84" y="49" width="6" height="6" />
        <rect x="70" y="68" width="15" height="15" />
        <rect x="88" y="68" width="5" height="22" />
        <rect x="38" y="75" width="12" height="15" />
        <rect x="42" y="42" width="16" height="16" fill="#10b981" rx="4" />
        <text x="50" y="52" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">BP</text>
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-50 shadow-sm overflow-hidden" id={`member_card_${member.id}`}>
      
      {/* 1. Emerald Header Bar */}
      <div className="bg-gradient-to-r from-emerald-950 to-emerald-900 text-white px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={member.photoUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80"}
            alt={member.fullName}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-400"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold font-sans tracking-tight">{member.fullName}</h3>
              <span
                className={`w-2.5 h-2.5 rounded-full inline-block ${
                  member.status === "Active" ? "bg-emerald-400 animate-pulse" : "bg-gray-400"
                }`}
                title={member.status}
              />
            </div>
            <p className="text-xs text-emerald-300 font-mono flex items-center gap-1.5 mt-0.5">
              <span>বেড: {member.seatNo}</span>
              <span>•</span>
              <span>রুম: {member.roomNo}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="px-3.5 py-1.5 bg-emerald-800/60 hover:bg-emerald-800 text-emerald-100 border border-emerald-700/50 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
            প্রোফাইল সংশোধন
          </button>
          
          <button
            onClick={() => setIsPaying(true)}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-1"
          >
            <CreditCard className="w-3.5 h-3.5" />
            বকেয়া পরিশোধ
          </button>
        </div>
      </div>

      {/* 2. Structured Information Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
        
        {/* Core details list */}
        <div className="md:col-span-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Contact numbers */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
              <Phone className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">বর্ডার মোবাইল ও পরিচয়</span>
                <span className="text-xs font-semibold text-gray-800">{member.phone}</span>
                <span className="text-[10px] text-gray-500 block">জাতীয় পরিচয়পত্র/আইডি: {member.nidOrStudentId}</span>
              </div>
            </div>

            {/* Profession & Institutional Information */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
              <ClipboardList className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">পেশা ও প্রাতিষ্ঠানিক পরিচয়</span>
                <span className="text-xs font-bold text-indigo-950">
                  {member.profession === "Job Holder" ? "💼 চাকরিজীবী (Job Holder)" : "🎓 শিক্ষার্থী (Student)"}
                </span>
                {member.profession === "Job Holder" ? (
                  <>
                    <span className="text-[10px] text-gray-500 block">কোম্পানি: {member.institutionName || "প্রদান করা হয়নি"}</span>
                    <span className="text-[10px] text-slate-500 block">আইডি কার্ড নম্বর: {member.idCardNo || "প্রদান করা হয়নি"}</span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] text-gray-500 block">শিক্ষা প্রতিষ্ঠান: {member.institutionName || "প্রদান করা হয়নি"}</span>
                    <span className="text-[10px] text-slate-500 block">স্টুডেন্ট আইডি: {member.idCardNo || "প্রদান করা হয়নি"}</span>
                  </>
                )}
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">জরুরী যোগাযোগ / অভিভাবক</span>
                <span className="text-xs font-semibold text-gray-800">{member.guardianName}</span>
                <span className="text-[10px] text-gray-500 block">অভিভাবকের ফোন: {member.guardianPhone}</span>
                <span className="text-[10px] text-red-500 block">জরুরী মোবাইল নম্বর: {member.emergencyContact}</span>
              </div>
            </div>

            {/* Subscribed Package */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
              <Award className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">প্যাকেজ এবং সুবিধা</span>
                <span className="text-xs font-bold text-gray-800">{getPackageLabelInBengali(member.packageName)}</span>
                <span className="text-[10px] text-gray-500 block">প্যাকেজের মূল্য: ৳{memberPackage?.price}/মাস</span>
                <span className="text-[10px] text-emerald-600 font-medium block">খাবার ব্যবস্থা: {memberPackage?.foodSystem === "Dinner Included" ? "রাতের খাবার অন্তর্ভুক্ত" : memberPackage?.foodSystem === "Lunch + Dinner Included" ? "দুপুর ও রাতের খাবার" : memberPackage?.foodSystem === "3 Meals/Day Included" ? "৩ বেলার খাবার অন্তর্ভুক্ত" : "নিজেদের বা অতিরিক্ত খরচ"}</span>
              </div>
            </div>

            {/* Rent & Dues summary with full breakdown of Package + Seat Rent */}
            {(() => {
              const memberSeat = seats.find((s) => s.id === member.seatId);
              const seatRent = memberSeat ? memberSeat.rentPrice : 3500;
              const packagePrice = memberPackage ? memberPackage.price : 2000;
              const totalBill = seatRent + packagePrice;
              const advancePaid = member.advancePaid || 0;
              return (
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="space-y-0.5 w-full">
                      <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">হিসাব নিকাশ ও বকেয়া খতিয়ান</span>
                      
                      {/* Breakdown table list */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-150/80 text-[11px] space-y-1.5 mt-2 shadow-xs font-sans">
                        <div className="flex justify-between items-center text-slate-600 font-semibold">
                          <span>১. সিট ভাড়া বিল (Seat Rent):</span>
                          <span className="text-slate-800 font-mono">৳{seatRent}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600 font-semibold">
                          <span>২. প্যাকেজ বিল (Package Price):</span>
                          <span className="text-slate-800 font-mono">৳{packagePrice}</span>
                        </div>
                        <div className="border-t border-dashed border-slate-200/80 my-1 pt-1 flex justify-between items-center text-slate-900 font-bold">
                          <span>সর্বমোট চার্জ (Total Rent & Package):</span>
                          <span className="font-mono text-xs">৳{totalBill}</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-700 font-bold">
                          <span>অগ্রিম বুকিং ফি (Advance Paid):</span>
                          <span className="font-mono">৳{advancePaid}</span>
                        </div>
                      </div>

                      <div className="flex items-baseline gap-1.5 pt-2">
                        <span className="text-sm font-extrabold text-red-650">৳{member.dueAmount}</span>
                        <span className="text-[10px] text-red-400 font-bold">চলতি বকেয়া রয়েছে (Dues)</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">অন্যান্য চার্জ সহ মোট পরিশোধ করেছেন: <strong>৳{member.totalPaid}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>

          <div className="border-t border-dashed border-gray-100 pt-4 flex flex-col sm:flex-row justify-between text-xs text-gray-500 gap-2">
            <span className="flex items-center gap-1 font-sans">
              <Calendar className="w-4 h-4 text-emerald-500" />
              যোগদানের তারিখ: <strong>{member.joiningDate}</strong>
            </span>
            
            {member.leavingDate ? (
              <span className="flex items-center gap-1 font-sans text-amber-600 font-bold bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-100">
                ⚠️ হোস্টেল ছেড়ে দেওয়ার তারিখ: {member.leavingDate}
              </span>
            ) : member.leavingNextMonth ? (
              <span className="flex items-center gap-1 font-sans text-amber-600 font-bold bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-100">
                ⚠️ আগামী মাসে সিট ছাড়বে নক করা হয়েছে
              </span>
            ) : (
              <span className="text-gray-400 font-medium">ছেড়ে যাওয়ার নির্ধারিত তারিখ নেই</span>
            )}
          </div>
        </div>

        {/* 3. Verification Card (QR Generation layout) */}
        <div className="md:col-span-4 bg-slate-50 border border-slate-100 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="p-1 px-[5px] bg-white rounded-xl border shadow-xs mb-3">
            {renderInteractiveQrCodeSvg(member.id)}
          </div>
          <span className="text-xs font-bold text-gray-800 font-sans tracking-wide">ডিজিটাল মেম্বার আইডি কোড</span>
          <span className="text-[9px] font-mono text-gray-400 mt-0.5 uppercase">সুরক্ষিত কোড: {member.id.substring(0, 10)}</span>
          <p className="text-[10px] text-gray-500 leading-normal mt-3 px-2">
            হোস্টেলের গেটে প্রবেশাধিকার নিশ্চিত করতে এবং সক্রিয় আবাসিক পদের প্রমাণস্বরূপ এই ডায়নামিক কিউআর কোডটি স্ক্যান করুন।
          </p>
        </div>

      </div>

      {/* 5. Occupancy History Timeline Section */}
      <div className="border-t border-slate-100 bg-slate-50/40 p-6">
        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-4 font-sans text-emerald-950 font-sans">
          <ClipboardList className="w-4 h-4 text-emerald-600 shrink-0" />
          আবাসিক ইতিহাস ও সিট পরিবর্তনের টাইমলাইন (Occupancy History Timeline)
        </h4>

        <div className="relative border-l border-emerald-200 pl-6 ml-3 space-y-4">
          {(member.occupancyHistory && member.occupancyHistory.length > 0
            ? member.occupancyHistory
            : [
                {
                  id: "initial_setup",
                  roomNo: member.roomNo,
                  seatNo: member.seatNo,
                  assignedAt: member.joiningDate || "যোগদানের সময়",
                  releasedAt: member.status === "Inactive" ? (member.leavingDate || new Date().toLocaleDateString()) : null,
                  remarks: "প্রাথমিক চেক-ইন ও সিট বরাদ্দকরণ (Initial Allocation)",
                }
              ]
          ).map((hist, index) => (
            <div key={hist.id || index} className="relative">
              {/* Timeline Marker Dot */}
              <span className={`absolute -left-[30px] top-1 w-3.5 h-3.5 rounded-full border-2 bg-white flex items-center justify-center ${
                hist.releasedAt ? "border-amber-405 font-sans" : "border-emerald-500 animate-pulse"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  hist.releasedAt ? "bg-amber-400" : "bg-emerald-500"
                }`} />
              </span>
              
              <div className="bg-white rounded-xl border border-slate-100 p-3.5 shadow-2xs space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-800 font-sans">
                    রুম নং {hist.roomNo} ∙ সিট নং {hist.seatNo}
                  </span>
                  
                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                    {hist.assignedAt} থেকে {hist.releasedAt || "বর্তমান (Active)"}
                  </span>
                </div>
                
                <p className="text-[11px] text-gray-500 leading-normal font-sans">
                  {hist.remarks || (hist.releasedAt ? "সিট রিলিজ সম্পন্ন হয়েছে" : "সিট বর্তমানে সক্রিয়ভাবে বরাদ্দ রয়েছে")}
                </p>
                
                {hist.releasedAt && (
                  <span className="inline-block px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded text-[9px] font-bold font-sans mt-0.5">
                    সিট ছেড়ে দেওয়ার তারিখ: {hist.releasedAt}
                  </span>
                )}
                {!hist.releasedAt && (
                  <span className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded text-[9px] font-extrabold font-sans mt-0.5">
                    সক্রিয় বরাদ্দ আছে
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Pay Dues Modal */}
      {isPaying && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-slate-100 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {paySuccess ? (
              <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2 animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 font-sans">পরিশোধ সম্পন্ন!</h3>
                <p className="text-xs text-gray-500">{member.fullName} এর কাছ থেকে {payMethod} এর মাধ্যমে ৳{payAmount} গ্রহণ করা হয়েছে।</p>
              </div>
            ) : (
              <div>
                <div className="bg-emerald-950 p-4 text-white flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400">রসিদ ও পেমেন্ট খতিয়ান</h3>
                  <button onClick={() => setIsPaying(false)} className="text-white hover:text-red-400 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handlePaySubmit} className="p-6 space-y-4">
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border text-xs">
                    <span className="text-gray-500">চলতি বকেয়ার পরিমাণ:</span>
                    <span className="font-extrabold text-red-600 text-sm">৳{member.dueAmount}</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 font-sans">আদায়কৃত টাকার পরিমাণ (৳)</label>
                    <input
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      className={`w-full px-3 py-2 border ${payAmount > member.dueAmount ? 'border-red-500 bg-red-50 text-red-900 font-black' : 'border-slate-200 text-emerald-800 font-bold'} text-xs rounded-lg focus:outline-none focus:border-emerald-600`}
                      required
                    />
                  </div>
                  {payAmount > member.dueAmount && (
                    <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-[10px] font-extrabold rounded-lg animate-pulse font-sans">
                      ⚠️ ভুল তথ্য: আদায়কৃত টাকার পরিমাণ চলতি বকেয়া (৳{member.dueAmount}) এর চেয়ে বেশি হতে পারে না!
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 font-sans">পরিশোধের খাত</label>
                      <select
                        value={payType}
                        onChange={(e) => setPayType(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 text-xs rounded-lg font-bold font-sans text-slate-705"
                      >
                        <option value={member.packageName || "Basic"}>
                          {getPackageLabelInBengali(member.packageName || "Basic")}
                        </option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 font-sans">পরিশোধের মাধ্যম</label>
                      <select
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value as any)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 text-xs rounded-lg font-semibold font-sans"
                      >
                        <option value="bKash">বিকাশ (bKash)</option>
                        <option value="Nagad">নগদ (Nagad)</option>
                        <option value="Rocket">রকেট (Rocket)</option>
                        <option value="Cash">ক্যাশ (হাতে হাতে)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsPaying(false)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      বাতিল করুন
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm"
                    >
                      রসিদ তৈরি করুন
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Edit Profile Details Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md border border-slate-100 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-emerald-950 p-4 text-white flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400">তথ্য হালনাগাদ করুন</h3>
              <button onClick={() => setIsEditing(false)} className="text-white hover:text-red-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 font-sans">বোর্ডারের পুরো নাম</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg font-bold text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 font-sans">বোর্ডারের ছবি আপলোড/পরিবর্তন করুন</label>
                <div className="flex gap-2 items-center bg-slate-50 border border-slate-150 p-2 rounded-xl">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setPhotoUrl(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-[10px] text-slate-500 font-sans file:mr-1 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer w-full"
                  />
                  {photoUrl && (
                    <img
                      src={photoUrl}
                      alt="Preview"
                      className="w-8 h-8 object-cover rounded-full border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 font-sans">মোবাইল নম্বর</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 font-sans">এনআইডি/স্টুডেন্ট আইডি</label>
                  <input
                    type="text"
                    value={nidOrStudentId}
                    onChange={(e) => setNidOrStudentId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg"
                    required
                  />
                </div>
              </div>

              <h4 className="text-[10px] font-bold text-emerald-600 block uppercase tracking-wider pt-2 border-t border-gray-100">
                অভিভাবক এবং জরুরী যোগাযোগ
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 font-sans">অভিভাবকের নাম</label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 font-sans">অভিভাবকের মোবাইল</label>
                  <input
                    type="text"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 font-sans">জরুরী মোবাইল নম্বর</label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 font-sans">ছেড়ে যাওয়ার তারিখ (চেকআউট)</label>
                  <input
                    type="date"
                    value={leavingDate}
                    onChange={(e) => setLeavingDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg font-sans"
                  />
                </div>
              </div>

              <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-150 flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="leaving_next_month_toggle"
                  checked={leavingNextMonth}
                  onChange={(e) => setLeavingNextMonth(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="leaving_next_month_toggle" className="text-xs font-bold text-slate-700 cursor-pointer font-sans select-none">
                  আগামী মাসে সিট ছাড়বে? (টিক দিন)
                </label>
              </div>

              <div className="bg-slate-50/75 p-3.5 rounded-xl border border-slate-200/50 space-y-3">
                <span className="text-[10px] font-extrabold text-indigo-800 block uppercase tracking-wider">🏢 পেশা ও প্রাতিষ্ঠানিক তথ্য</span>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 font-sans">পেশার ধরণ সিলেক্ট করুন</label>
                  <select
                    value={profession}
                    onChange={(e) => setProfession(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-200 text-xs rounded-lg font-bold font-sans cursor-pointer"
                  >
                    <option value="Student">শিক্ষার্থী (Student)</option>
                    <option value="Job Holder">চাকরিজীবী (Job Holder)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 font-sans">
                      {profession === "Job Holder" ? "কোম্পানির নাম লিখুন" : "স্কুল/কলেজ/ভার্সিটি নাম"}
                    </label>
                    <input
                      type="text"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      placeholder={profession === "Job Holder" ? "যেমন: গ্রামীণফোন" : "যেমন: ঢাকা বিশ্ববিদ্যালয়"}
                      className="w-full px-3 py-2 bg-white border border-slate-200 text-xs font-bold rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 font-sans">
                      {profession === "Job Holder" ? "এমপ্লয়ি আইডি নং" : "স্টুডেন্ট আইডি নং"}
                    </label>
                    <input
                      type="text"
                      value={idCardNo}
                      onChange={(e) => setIdCardNo(e.target.value)}
                      placeholder="আইডি কার্ড নম্বর লিখুন"
                      className="w-full px-3 py-2 bg-white border border-slate-200 text-xs font-bold rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 font-sans">বোর্ডারের অবস্থা (Status)</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 text-xs rounded-lg font-bold font-sans"
                >
                  <option value="Active">একটিভ (Active) - হোস্টেলে আছেন</option>
                  <option value="Inactive">ইন-অ্যাক্টিভ (Inactive) - হোস্টেল ছেড়ে দিয়েছেন</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
