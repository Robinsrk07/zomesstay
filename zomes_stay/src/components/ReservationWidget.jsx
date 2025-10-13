import React, { useState, useRef, useEffect } from "react";
import { Calendar, Users, Home, X, ChevronLeft, ChevronRight } from "lucide-react";

// ---- Local helpers ----
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function getMonthMatrix(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const matrix = [];
  let week = [];
  for (let i = 0; i < first.getDay(); i++) week.push(null);
  for (let d = 1; d <= last.getDate(); d++) {
    week.push(new Date(year, month, d));
    if (week.length === 7) {
      matrix.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    matrix.push(week);
  }
  return matrix;
}

function isSameDay(a, b) {
  return (
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isInRange(day, start, end) {
  if (!start || !end) return false;
  return day > start && day < end;
}

function isBeforeDay(a, b) {
  return a && b && a.getTime() < b.getTime();
}

function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function formatINR(n) {
  if (n == null) return "—";
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `₹${n}`;
  }
}

function formatDate(date) {
  if (!date) return "";
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
}

function formatDateShort(date) {
  if (!date) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

// ---- Calendar Popup Component ----
function CalendarPopup({ calendarData = {}, unavailableDates = [], range, setRange, onClose }) {
  const today = getToday();
  const [baseMonth, setBaseMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [hovered, setHovered] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const unavailableSet = useRef(new Set(unavailableDates.map((d) => d.toISOString().slice(0, 10))));

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-close when both dates selected
  // useEffect(() => {
  //   if (range.start && range.end) {
  //     setTimeout(() => onClose(), 300);
  //   }
  // }, [range.start, range.end, onClose]);

  function onDateClick(day) {
    const key = day?.toISOString().slice(0, 10);
    const cal = key ? calendarData[key] : null;
    const notAvailable = cal ? cal.isAvailable === false : false;
    if (!day || isBeforeDay(day, today) || unavailableSet.current.has(key) || notAvailable) return;

    if (!range.start || (range.start && range.end)) {
      setRange({ start: day, end: null });
    } else if (range.start && !range.end) {
      if (isBeforeDay(day, range.start)) {
        setRange({ start: day, end: range.start });
      } else {
        setRange({ start: range.start, end: day });
      }
    }
  }

  function renderMonth(monthDate) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const matrix = getMonthMatrix(year, month);

    return (
      <div className="flex-1 min-w-[280px]">
        <div className="text-center mb-3">
          <span className="text-lg font-semibold">{MONTHS[month]} {year}</span>
        </div>

        {/* Weekday row */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>
          ))}
        </div>

        {/* Date grid */}
        <div className="grid grid-cols-7 gap-1">
          {matrix.flat().map((day, cidx) => {
            if (!day) return <div key={cidx} className="h-12"></div>;
            
            const key = day.toISOString().slice(0, 10);
            const fromMap = calendarData[key];
            const isPast = isBeforeDay(day, today);
            const fromLegacyUnavailable = unavailableSet.current.has(key);
            const notAvailable = fromMap ? fromMap.isAvailable === false : false;
            const isUnavailable = fromLegacyUnavailable || notAvailable;
            const isDisabled = isPast || isUnavailable;
            const isSelected =
              (range.start && isSameDay(day, range.start)) ||
              (range.end && isSameDay(day, range.end));
            const isInSelectedRange = range.start && range.end && isInRange(day, range.start, range.end);
            const isToday = isSameDay(day, today);
            const isHoveredRange = range.start && !range.end && hovered && isInRange(day, range.start, hovered);

            const minRate = fromMap?.minRate ?? null;
            const finalPrice = fromMap?.finalPrice ?? null;
            const type = fromMap?.type ?? null;

            return (
              <button
                key={cidx}
                type="button"
                disabled={isDisabled}
                onClick={() => onDateClick(day)}
                onMouseEnter={() => setHovered(day)}
                onMouseLeave={() => setHovered(null)}
                className={
                  "h-12 flex flex-col items-center justify-center rounded-lg text-sm transition-all " +
                  (isDisabled
                    ? "bg-gray-50 text-gray-300 cursor-not-allowed "
                    : isSelected
                    ? "bg-[#003580] text-white font-semibold "
                    : isInSelectedRange || isHoveredRange
                    ? "bg-blue-100 text-[#003580] "
                    : "hover:bg-blue-50 cursor-pointer ") +
                  (isToday && !isSelected ? "ring-2 ring-[#003580] ring-opacity-40 " : "")
                }
              >
                <span className="font-medium">{day.getDate()}</span>
                {/* Price logic */}
                {!isUnavailable && (
                  <span className="text-[10px] text-gray-500">
                    {finalPrice != null ? (
                      type === 'offer' ? (
                        <>
                          <span className="font-semibold text-green-500">{formatINR(finalPrice)}</span>
                        </>
                      ) : (
                        <span className="font-semibold">{formatINR(finalPrice)}</span>
                      )
                    ) : (
                      minRate ? <span>{formatINR(minRate)}</span> : null
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const monthsToShow = isMobile ? 2 : 2;
  const visibleMonths = [];
  for (let i = 0; i < monthsToShow; i++) {
    visibleMonths.push(renderMonth(addMonths(baseMonth, i)));
  }

  return (
    <div className="fixed inset-0 bg-black/10 bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Select dates</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setBaseMonth(addMonths(baseMonth, -1))}
              disabled={baseMonth.getMonth() === today.getMonth() && baseMonth.getFullYear() === today.getFullYear()}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => setBaseMonth(addMonths(baseMonth, 1))}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Calendar months */}
          <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-8`}>
            {visibleMonths}
          </div>

          {/* Selected dates display */}
          {(range.start || range.end) && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-600">Check-in: </span>
                  <span className="font-semibold">{range.start ? formatDate(range.start) : "Select"}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Check-out: </span>
                  <span className="font-semibold">{range.end ? formatDate(range.end) : "Select"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Main Booking Widget Component ----
export default function ReservationBookingWidget({
  calendarData = {},
  unavailableDates = [],
  onBookNow,
  propertyDetails,
  range: controlledRange,
  onRangeChange
}) {
  const [internalRange, setInternalRange] = useState({ start: null, end: null });
  const range = controlledRange ?? internalRange;
  const updateRange = (next) => (onRangeChange ? onRangeChange(next) : setInternalRange(next));

  const [guests, setGuests] = useState({ adults: 2, children: 0 });
  const [rooms, setRooms] = useState(1);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);

  const guestDropdownRef = useRef(null);
  const roomDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (guestDropdownRef.current && !guestDropdownRef.current.contains(event.target)) {
        setShowGuestDropdown(false);
      }
      if (roomDropdownRef.current && !roomDropdownRef.current.contains(event.target)) {
        setShowRoomDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const calculateNights = () => {
    if (!range.start || !range.end) return 0;
    const diffTime = Math.abs(range.end - range.start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const basePrice = propertyDetails?.roomTypes?.[0]?.basePrice || 0;

  const calculateTotal = () => {
    const nights = calculateNights();
    return basePrice * rooms * nights;
  };


  console.log(calendarData)
  const maxRooms = propertyDetails?.roomTypes?.reduce((sum, rt) => sum + (rt.rooms?.length || 0), 0) || 10;

  return (
    <>
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Price header */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 px-6 py-4 border-b">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">₹{basePrice.toLocaleString('en-IN')}</span>
            <span className="text-sm text-gray-600">(for {rooms} room{rooms > 1 ? 's' : ''}) Per Night + Taxes</span>
          </div>
        </div>

        {/* Booking form */}
        <div className="p-6 space-y-4">
          {/* Check-in / Check-out */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowCalendar(true)}
              className="flex flex-col p-3 border border-gray-300 rounded-lg hover:border-[#003580] transition text-left"
            >
              <span className="text-xs text-gray-600 mb-1">Check-in</span>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-sm font-medium">
                  {range.start ? formatDateShort(range.start) : "Add date"}
                </span>
              </div>
              {range.start && (
                <span className="text-xs text-gray-500 mt-1">
                  {range.start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowCalendar(true)}
              className="flex flex-col p-3 border border-gray-300 rounded-lg hover:border-[#003580] transition text-left"
            >
              <span className="text-xs text-gray-600 mb-1">Check-out</span>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-sm font-medium">
                  {range.end ? formatDateShort(range.end) : "Add date"}
                </span>
              </div>
              {range.end && (
                <span className="text-xs text-gray-500 mt-1">
                  {range.end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              )}
            </button>
          </div>

          {/* Guests dropdown */}
          <div className="relative" ref={guestDropdownRef}>
            <button
              onClick={() => setShowGuestDropdown(!showGuestDropdown)}
              className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:border-[#003580] transition"
            >
              <div className="flex items-center gap-2">
                <Users size={16} className="text-gray-400" />
                <div className="text-left">
                  <div className="text-xs text-gray-600">Guests</div>
                  <div className="text-sm font-medium">
                    {guests.adults} Adult{guests.adults > 1 ? 's' : ''}, {guests.children} Child{guests.children !== 1 ? 'ren' : ''}
                  </div>
                </div>
              </div>
              <svg className={`w-5 h-5 transition-transform ${showGuestDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showGuestDropdown && (
              <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Adults</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setGuests({...guests, adults: Math.max(1, guests.adults - 1)})}
                        className="w-8 h-8 rounded-full border border-gray-300 hover:border-[#003580] flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">{guests.adults}</span>
                      <button
                        onClick={() => setGuests({...guests, adults: guests.adults + 1})}
                        className="w-8 h-8 rounded-full border border-gray-300 hover:border-[#003580] flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Children</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setGuests({...guests, children: Math.max(0, guests.children - 1)})}
                        className="w-8 h-8 rounded-full border border-gray-300 hover:border-[#003580] flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">{guests.children}</span>
                      <button
                        onClick={() => setGuests({...guests, children: guests.children + 1})}
                        className="w-8 h-8 rounded-full border border-gray-300 hover:border-[#003580] flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rooms dropdown */}
          <div className="relative" ref={roomDropdownRef}>
            <button
              onClick={() => setShowRoomDropdown(!showRoomDropdown)}
              className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:border-[#003580] transition"
            >
              <div className="flex items-center gap-2">
                <Home size={16} className="text-gray-400" />
                <div className="text-left">
                  <div className="text-xs text-gray-600">No. of Rooms</div>
                  <div className="text-sm font-medium">{rooms} Room{rooms > 1 ? 's' : ''}</div>
                </div>
              </div>
              <svg className={`w-5 h-5 transition-transform ${showRoomDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showRoomDropdown && (
              <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Rooms</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setRooms(Math.max(1, rooms - 1))}
                      className="w-8 h-8 rounded-full border border-gray-300 hover:border-[#003580] flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">{rooms}</span>
                    <button
                      onClick={() => setRooms(Math.min(maxRooms, rooms + 1))}
                      className="w-8 h-8 rounded-full border border-gray-300 hover:border-[#003580] flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Total */}
          {/* {range.start && range.end && (
            <div className="border-t pt-4">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-lg font-semibold">Total</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">₹{calculateTotal().toLocaleString('en-IN')}</div>
                  <div className="text-xs text-gray-500">(Incl. taxes)</div>
                </div>
              </div>
            </div>
          )} */}

          {/* Book Now button */}
          <button
            disabled={!range.start || !range.end}
            onClick={() => {
              if (onBookNow) {
                onBookNow({
                  checkIn: range.start,
                  checkOut: range.end,
                  guests,
                  rooms,
                  nights: calculateNights()
                });
              }
            }}
            className="w-full bg-[#003580] hover:bg-[#00224d] disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold text-base transition-colors disabled:cursor-not-allowed"
          >
            Book Now
          </button>
          <button>
            <span className="text-xs text-gray-500">CONTACT US</span>
          </button>
        </div>
      </div>

      {/* Calendar Popup */}
      {showCalendar && (
        <CalendarPopup
          calendarData={calendarData}
          unavailableDates={unavailableDates}
          range={range}
          setRange={updateRange}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </>
  );
}