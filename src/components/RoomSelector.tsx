import React, { useState } from "react";
import { Room, Seat, Member } from "../types";
import { Plus, Hotel, CheckCircle, AlertTriangle, PenTool, X, Sparkles, User, Info, Building, Trash2 } from "lucide-react";

interface RoomSelectorProps {
  rooms: Room[];
  seats: Seat[];
  members: Member[];
  onAddRoom: (roomData: Partial<Room> & { defaultRentPrice?: number }) => void;
  onUpdateSeatStatus: (seatId: string, status: Seat["status"]) => void;
  onSelectMember: (memberId: string) => void;
  onDeleteRoom?: (roomId: string) => void;
  onAddSeat?: (roomId: string, seatNo: string, rentPrice: number) => void;
  onDeleteSeat?: (seatId: string) => void;
  onUpdateSeatRent?: (seatId: string, rentPrice: number) => void;
  onToggleRoomMaintenance?: (roomId: string) => void;
}

export function RoomSelector({
  rooms,
  seats,
  members,
  onAddRoom,
  onUpdateSeatStatus,
  onSelectMember,
  onDeleteRoom,
  onAddSeat,
  onDeleteSeat,
  onUpdateSeatRent,
  onToggleRoomMaintenance,
}: RoomSelectorProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(rooms[0]?.id || null);
  const [isAddingRoom, setIsAddingRoom] = useState(false);

  // States for adding dynamic seat bed
  const [isAddingSeat, setIsAddingSeat] = useState(false);
  const [newSeatNo, setNewSeatNo] = useState("");
  const [newSeatRent, setNewSeatRent] = useState(3500);

  // States for editing a seat rent price
  const [editingSeatId, setEditingSeatId] = useState<string | null>(null);
  const [editingSeatRent, setEditingSeatRent] = useState<number>(0);

  // New room state
  const [blockName, setBlockName] = useState("মূল ভবন");
  const [floor, setFloor] = useState(1);
  const [roomNo, setRoomNo] = useState("");
  const [seatsTotal, setSeatsTotal] = useState(4);
  const [defaultRentPrice, setDefaultRentPrice] = useState(3500);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNo.trim()) return;

    onAddRoom({
      blockName,
      floor,
      roomNo,
      seatsTotal,
      defaultRentPrice,
    });

    // Reset
    setRoomNo("");
    setIsAddingRoom(false);
  };

  const getRoomUpcomingVacancy = (room: Room) => {
    const today = new Date();
    const fifteenDaysLater = new Date();
    fifteenDaysLater.setDate(today.getDate() + 15);

    const roomMembers = members.filter((m) => m.roomId === room.id && m.status === "Active");
    const leavingSoon = roomMembers.filter((m) => {
      if (!m.leavingDate) return false;
      const lDate = new Date(m.leavingDate);
      return lDate >= today && lDate <= fifteenDaysLater;
    });

    return leavingSoon;
  };

  const filteredRooms = rooms.filter((r) => {
    const matchesSearch = r.roomNo.includes(searchQuery) || r.blockName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Maintenance" && r.status === "Maintenance") ||
      (statusFilter === "Available" && r.status !== "Maintenance" && r.seatsBooked < r.seatsTotal) ||
      (statusFilter === "Full" && r.seatsBooked === r.seatsTotal);

    return matchesSearch && matchesStatus;
  });

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const selectedRoomSeats = seats.filter((s) => s.roomId === selectedRoomId);
  const upcomingVacancies = selectedRoom ? getRoomUpcomingVacancy(selectedRoom) : [];

  return (
    <div className="space-y-6" id="room_seat_manager">
      
      {/* 1. Setup Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Hotel className="w-6 h-6 text-emerald-600" />
            রুম ও সিট লেআউট
          </h2>
          <p className="text-xs text-gray-500">ভবন যোগ করুন, ফ্লোর কনফিগার করুন এবং রিয়েল-টাইমে খালি সিট ট্র্যাক করুন।</p>
        </div>

        <button
          onClick={() => setIsAddingRoom(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          নতুন রুম যোগ করুন
        </button>
      </div>

      {/* 2. Room Filtering & Search Area */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-emerald-50">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="রুম নম্বর বা ব্লকের নাম দিয়ে খুঁজুন..."
          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
        />

        <div className="flex gap-2">
          {[
            { id: "All", label: "সব রুম" },
            { id: "Available", label: "ফাঁকা আছে" },
            { id: "Full", label: "ভর্তি" },
            { id: "Maintenance", label: "রক্ষণাবেক্ষণ" }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border transition-all ${
                statusFilter === f.id
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-gray-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 3. Rooms Grid Column */}
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredRooms.map((room) => {
              const vacancyAlerts = getRoomUpcomingVacancy(room);
              const isSelected = room.id === selectedRoomId;
              const occupancyPct = Math.round((room.seatsBooked / room.seatsTotal) * 100);

              return (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`p-5 rounded-2xl border transition-all relative overflow-hidden cursor-pointer ${
                    isSelected
                      ? "bg-emerald-50/20 border-emerald-500 shadow-sm"
                      : "bg-white border-slate-100 hover:border-emerald-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 block tracking-tight">
                        {room.blockName} ({room.floor} তলা)
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          room.status === "Maintenance"
                            ? "bg-red-500"
                            : room.seatsBooked === room.seatsTotal
                            ? "bg-red-500"
                            : "bg-emerald-500 animate-pulse"
                        }`} />
                        <span className="text-base font-extrabold text-slate-800 font-sans">
                          রুম {room.roomNo} <span className="text-xs text-slate-500 font-medium">(বুকড: {room.seatsBooked}, খালি: {room.seatsTotal - room.seatsBooked})</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${
                          room.status === "Maintenance"
                            ? "bg-red-50 text-red-700"
                            : room.seatsBooked === room.seatsTotal
                            ? "bg-blue-50 text-blue-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {room.status === "Maintenance"
                          ? "মেরামত চলছে"
                          : room.seatsBooked === room.seatsTotal
                          ? "ভর্তি"
                          : "খালি আছে"}
                      </span>
                      <div className="flex gap-1">
                        {onToggleRoomMaintenance && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleRoomMaintenance(room.id);
                            }}
                            className={`p-1.5 border rounded-lg transition-all duration-150 cursor-pointer text-xs font-bold ${
                              room.status === "Maintenance"
                                ? "bg-[#ea580c] hover:bg-[#c2410c] text-white border-[#ea580c]"
                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                            title={room.status === "Maintenance" ? "রুম সচল করুন" : "রুম মেরামত করুন (Toggle Maintenance)"}
                          >
                            <PenTool className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteRoom && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteRoom(room.id);
                            }}
                            className="p-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg transition-all duration-150 cursor-pointer border border-red-100/70"
                            title="সম্পূর্ণ রুম ও তার সিট ডিলেট করুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 mt-3">
                    <div className="flex justify-between text-xs text-gray-500 font-sans">
                      <span>সিট বুকিংয়ের হার</span>
                      <span className="font-semibold text-gray-900">{occupancyPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          room.status === "Maintenance"
                            ? "bg-red-400"
                            : occupancyPct >= 80
                            ? "bg-amber-400"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>
                  </div>

                  {vacancyAlerts.length > 0 && (
                    <div className="mt-3 py-1 px-2.5 bg-amber-50 rounded-lg text-[10px] text-amber-700 font-sans font-bold flex items-center gap-1 border border-amber-100 animate-pulse">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>{vacancyAlerts[0].leavingDate} তারিখে সিট খালি হবে</span>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredRooms.length === 0 && (
              <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-slate-100">
                <Hotel className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <span className="text-gray-500 text-xs font-sans">খোঁজা রুম নম্বর বা ভবনটির সন্ধান পাওয়া যায়নি।</span>
              </div>
            )}
          </div>
        </div>

        {/* 4. Active Room Seats Layout Map Detail */}
        <div className="lg:col-span-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm sticky top-4 space-y-6">
            {selectedRoom ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-mono font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        ইন্টারেক্টিভ বেড ম্যাপ
                      </span>
                      {upcomingVacancies.length > 0 && (
                        <span className="text-[10px] bg-amber-100 font-bold text-amber-700 px-2 py-0.5 rounded-full">
                          খালি হওয়ার নোটিশ আছে
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 font-sans mt-1">
                      রুম নম্বর {selectedRoom.roomNo}-এর খতিয়ান
                    </h3>
                    <p className="text-xs text-gray-500">{selectedRoom.blockName} ∙ {selectedRoom.floor} তলা</p>
                  </div>

                  {onDeleteRoom && (
                    <button
                      onClick={() => {
                        onDeleteRoom(selectedRoom.id);
                        // Shift selection safely to another room
                        setSelectedRoomId(rooms.find((r) => r.id !== selectedRoom.id)?.id || null);
                      }}
                      className="text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-xl transition-colors shrink-0 flex items-center justify-center gap-1 text-[11px] font-bold font-sans cursor-pointer"
                      title="সম্পূর্ণ রুম ও তার সিট ডিলেট করুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>রুম মুছুন</span>
                    </button>
                  )}
                </div>

                {/* Inline Bed Management Tool Panel */}
                {onAddSeat && (
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/60 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        বেড / সিট পরিচালনা
                      </span>
                      <button
                        onClick={() => setIsAddingSeat(!isAddingSeat)}
                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-[10px] rounded cursor-pointer transition-colors"
                      >
                        {isAddingSeat ? "বাতিল" : "বেড যুক্ত করুন"}
                      </button>
                    </div>

                    {isAddingSeat && (
                      <div className="space-y-2.5 bg-white p-2.5 rounded-lg border border-slate-200">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-0.5">
                            <label className="text-[9px] font-bold text-gray-400">সিট নম্বর</label>
                            <input
                              type="text"
                              value={newSeatNo}
                              onChange={(e) => setNewSeatNo(e.target.value)}
                              placeholder={`${selectedRoom.roomNo}-${String.fromCharCode(65 + selectedRoomSeats.length)}`}
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <label className="text-[9px] font-bold text-gray-400">সিট ভাড়া (৳)</label>
                            <input
                              type="number"
                              value={newSeatRent}
                              onChange={(e) => setNewSeatRent(Number(e.target.value))}
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const num = newSeatNo.trim() || `${selectedRoom.roomNo}-${String.fromCharCode(65 + selectedRoomSeats.length)}`;
                            onAddSeat(selectedRoom.id, num, newSeatRent);
                            setNewSeatNo("");
                            setIsAddingSeat(false);
                          }}
                          className="w-full py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded cursor-pointer transition-colors"
                        >
                          সিট যুক্ত নিশ্চিত করুন
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 relative">
                  <div className="absolute top-2 right-2 text-[9px] text-slate-400 font-mono">
                    প্রধান দরজা 🚪
                  </div>

                  <div className="grid grid-cols-1 gap-3 mt-4">
                    {selectedRoomSeats.map((seat) => {
                      const occupant = members.find((m) => m.id === seat.memberId && m.status === "Active");
                      const hasUpcomingVacancy = occupant && occupant.leavingDate;

                      return (
                        <div
                          key={seat.id}
                          className={`p-3 rounded-xl border relative font-sans transition-all flex flex-col justify-between ${
                            seat.status === "Booked"
                              ? "bg-white border-emerald-100 hover:border-emerald-300 shadow-xs"
                              : seat.status === "Reserved"
                              ? "bg-amber-50/20 border-amber-200 hover:border-amber-350"
                              : seat.status === "Maintenance"
                              ? "bg-red-50/10 border-red-100"
                              : "bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-250"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-xs font-bold text-slate-700">বেড নম্বর {seat.seatNo}</span>
                            <div className="flex items-center gap-1.5">
                              {onDeleteSeat && !seat.memberId && (
                                <button
                                  onClick={() => onDeleteSeat(seat.id)}
                                  className="text-gray-400 hover:text-red-650 transition-colors cursor-pointer p-0.5 hover:bg-red-50 rounded"
                                  title="এই বেডটি ডিলেট করুন"
                                >
                                  <X className="w-3.5 h-3.5 font-bold" />
                                </button>
                              )}
                              <div
                                className={`w-2.5 h-2.5 rounded-full ${
                                  seat.status === "Booked"
                                    ? "bg-emerald-500"
                                    : seat.status === "Reserved"
                                    ? "bg-amber-500"
                                    : seat.status === "Maintenance"
                                    ? "bg-red-500"
                                    : "bg-slate-300"
                                }`}
                              />
                            </div>
                          </div>

                          <div className="my-2 min-h-[30px] flex flex-col justify-center">
                            {seat.status === "Booked" && occupant ? (
                              <button
                                onClick={() => onSelectMember(occupant.id)}
                                className="text-left font-semibold text-xs text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer truncate"
                              >
                                <User className="w-3.5 h-3.5 shrink-0" />
                                {occupant.fullName}
                              </button>
                            ) : (
                              <span className="text-[11px] text-gray-400 font-sans italic">
                                {seat.status === "Reserved"
                                  ? "বুকিং প্রক্রিয়াধীন"
                                  : seat.status === "Maintenance"
                                  ? "রক্ষণাবেക്ഷണাধীন"
                                  : "খালি সিট"}
                              </span>
                            )}
                            
                            {hasUpcomingVacancy && (
                              <span className="text-[9px] px-1 bg-amber-100 text-amber-700 inline-block font-semibold w-max rounded-md mt-1">
                                খালি হবে: {occupant.leavingDate}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col gap-1.5 border-t border-dashed border-gray-150 pt-2 mt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-gray-400 font-bold">ভাড়া:</span>
                              {editingSeatId === seat.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={editingSeatRent}
                                    onChange={(e) => setEditingSeatRent(Number(e.target.value))}
                                    className="w-16 px-1 py-0.5 border border-slate-300 text-[10px] rounded focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                  />
                                  <button
                                    onClick={() => {
                                      if (onUpdateSeatRent) {
                                        onUpdateSeatRent(seat.id, editingSeatRent);
                                      }
                                      setEditingSeatId(null);
                                    }}
                                    className="px-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9.5px] font-bold rounded cursor-pointer"
                                  >
                                    সেভ
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="text-[10.5px] font-extrabold text-slate-800 font-mono">৳{seat.rentPrice}</span>
                                  {onUpdateSeatRent && (
                                    <button
                                      onClick={() => {
                                        setEditingSeatId(seat.id);
                                        setEditingSeatRent(seat.rentPrice);
                                      }}
                                      className="text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                                      title="ভাড়া পরিবর্তন করুন"
                                    >
                                      <PenTool className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-gray-400 font-bold">অবস্থা:</span>
                              <select
                                value={seat.status}
                                onChange={(e) => onUpdateSeatStatus(seat.id, e.target.value as any)}
                                className="text-[10px] bg-slate-100 border-none font-bold text-gray-700 py-0.5 px-1 rounded focus:outline-none"
                              >
                                <option value="Available">Available</option>
                                <option value="Booked">Occupied</option>
                                <option value="Reserved">Reserve</option>
                                <option value="Maintenance">Repair</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl text-[10px] text-gray-500 font-sans gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>ভর্তি</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <span>খালি আছে</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>সংরক্ষিত</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span>মেরামত</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <Hotel className="w-12 h-12 mx-auto text-slate-200 mb-3 animate-pulse" />
                <p className="text-sm font-sans">বেড কনফিগার করতে বাম দিক থেকে রুম নির্বাচন করুন</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 5. Create Room Modal Drawer */}
      {isAddingRoom && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-slate-100 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-emerald-950 p-4 text-white flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400">হোস্টেল রুম সেটআপ</h3>
              <button onClick={() => setIsAddingRoom(false)} className="text-white hover:text-red-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateRoom} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 font-sans">বিল্ডিং ব্লক বা উইং</label>
                <input
                  type="text"
                  value={blockName}
                  onChange={(e) => setBlockName(e.target.value)}
                  placeholder="মূল উইং বা ব্লক"
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 font-sans">তলা নম্বর</label>
                  <input
                    type="number"
                    value={floor}
                    onChange={(e) => setFloor(Number(e.target.value))}
                    min={1}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 font-sans">রুম নম্বর</label>
                  <input
                    type="text"
                    value={roomNo}
                    onChange={(e) => setRoomNo(e.target.value)}
                    placeholder="২০৩"
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 font-sans block">মোট সিট সংখ্যা (রুম ক্যাপাসিটি)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={seatsTotal}
                    onChange={(e) => setSeatsTotal(Math.max(1, Number(e.target.value)))}
                    min={1}
                    max={30}
                    className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-250 font-sans text-center text-slate-800"
                    required
                    title="রুমের মোট সিট সংখ্যা সরাসরি কাস্টম টাইপ করুন"
                  />
                  <select
                    value={[1, 2, 3, 4, 5, 6, 8, 10].includes(seatsTotal) ? seatsTotal : "custom"}
                    onChange={(e) => {
                      if (e.target.value !== "custom") {
                        setSeatsTotal(Number(e.target.value));
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 text-xs rounded-lg focus:outline-none focus:border-emerald-600 text-slate-700 font-bold font-sans cursor-pointer"
                  >
                    <option value={1}>১ সিট (একক রুম)</option>
                    <option value={2}>২ সিট (ডাবল শেয়ারিং)</option>
                    <option value={3}>৩ সিট (ট্রিপল শেয়ারিং)</option>
                    <option value={4}>৪ সিট (কোয়াড মেস)</option>
                    <option value={5}>৫ সিট (৫-বেড রুম)</option>
                    <option value={6}>৬ সিট (ডরমিটরি বেড)</option>
                    <option value={8}>৮ সিট (বড় ডরমিটরি)</option>
                    <option value={10}>১০ সিট (মেগা ডরমিটরি)</option>
                    <option value="custom">কাস্টম সংখ্যা টাইপ করুন ➔</option>
                  </select>
                </div>
                <p className="text-[10px] text-gray-400 font-medium font-sans">
                  হোস্টেলের ডাইনামিক রিকোয়ারমেন্ট অনুযায়ী যেকোনো কাস্টম সিট সংখ্যা বা কনফিগারেশন নির্ধারণ করতে পারবেন।
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 font-sans">প্রতি সিটের ভাড়া ফিক্স করুন (৳)</label>
                <input
                  type="number"
                  value={defaultRentPrice}
                  onChange={(e) => setDefaultRentPrice(Math.max(0, Number(e.target.value)))}
                  placeholder="যেমন: ৩৫০০"
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg font-bold text-slate-800"
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddingRoom(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  নতুন রুম তৈরি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
