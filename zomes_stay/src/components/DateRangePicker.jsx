import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const DateRangePicker = ({ 
  isOpen, 
  onClose, 
  onDateSelect, 
  selectedDates = { checkIn: null, checkOut: null },
  calendarData = {},
  minDate = new Date()
}) => {
  const [startDate, setStartDate] = useState(selectedDates.checkIn);
  const [endDate, setEndDate] = useState(selectedDates.checkOut);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [nextMonth, setNextMonth] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)));

  // Get pricing for a specific date
  const getDatePricing = (date) => {
    if (!date) return null;
    const dateKey = date.toISOString().split('T')[0];
    return calendarData[dateKey]?.finalPrice || calendarData[dateKey]?.minRate;
  };

  // Format price for display
  const formatPrice = (price) => {
    if (!price) return null;
    return `₹${Number(price).toLocaleString('en-IN')}`;
  };

  // Check if date is available
  const isDateAvailable = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    return calendarData[dateKey]?.isAvailable !== false;
  };

  // Get days in month
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Get first day of month
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Generate calendar days
  const generateCalendarDays = (month) => {
    const days = [];
    const daysInMonth = getDaysInMonth(month);
    const firstDay = getFirstDayOfMonth(month);
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(month.getFullYear(), month.getMonth(), day));
    }
    
    return days;
  };

  // Handle date selection
  const handleDateClick = (date) => {
    if (!date || !isDateAvailable(date) || date < new Date(new Date().setHours(0, 0, 0, 0))) {
      return;
    }

    if (!startDate || (startDate && endDate)) {
      // First selection or new selection
      setStartDate(date);
      setEndDate(null);
    } else if (startDate && !endDate) {
      // Second selection
      if (date > startDate) {
        setEndDate(date);
      } else {
        setStartDate(date);
        setEndDate(null);
      }
    }
  };

  // Handle month navigation
  const handlePrevMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
    setNextMonth(new Date(newMonth.getFullYear(), newMonth.getMonth() + 1));
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
    setNextMonth(new Date(newMonth.getFullYear(), newMonth.getMonth() + 1));
  };

  // Clear selection
  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
  };

  // Handle close
  const handleClose = () => {
    onClose();
  };

  // Handle confirm selection
  const handleConfirm = () => {
    if (startDate && endDate) {
      onDateSelect({
        checkIn: startDate,
        checkOut: endDate
      });
    }
    onClose();
  };

  // Render calendar month
  const renderMonth = (month, title) => {
    const days = generateCalendarDays(month);
    const today = new Date();
    
    return (
      <div className="flex-1">
        <div className="text-center mb-2">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-700 py-1">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            if (!date) {
              return <div key={index} className="h-12"></div>;
            }
            
            const price = getDatePricing(date);
            const available = isDateAvailable(date);
            const isToday = date.toDateString() === today.toDateString();
            const isPast = date < new Date(today.setHours(0, 0, 0, 0));
            const isSelected = date && startDate && (date.getTime() === startDate.getTime() || (endDate && date.getTime() === endDate.getTime()));
            const isInRange = startDate && endDate && date > startDate && date < endDate;
            const isStartDate = date && startDate && date.getTime() === startDate.getTime();
            const isEndDate = date && endDate && date.getTime() === endDate.getTime();
            
            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                disabled={isPast || !available}
                className={`
                  relative h-12 flex flex-col items-center justify-center text-xs
                  rounded-lg transition-colors
                  ${isPast || !available ? 'text-gray-400 cursor-not-allowed bg-gray-100' : 'cursor-pointer hover:bg-blue-50'}
                  ${isSelected ? 'bg-blue-600 text-white' : ''}
                  ${isInRange ? 'bg-blue-100 text-blue-900' : ''}
                  ${isStartDate ? 'bg-blue-600 text-white' : ''}
                  ${isEndDate ? 'bg-blue-600 text-white' : ''}
                  ${isToday && !isSelected ? 'border-2 border-blue-400 bg-blue-50' : ''}
                  ${!isSelected && !isInRange && !isPast && available && !isToday ? 'bg-white text-gray-900' : ''}
                `}
              >
                <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                  {date.getDate()}
                </span>
                {price && available && (
                  <span className={`text-xs leading-tight ${
                    isSelected ? 'text-white' : 
                    price < 1000 ? 'text-green-600' : 'text-gray-700'
                  }`}>
                    {formatPrice(price)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-3/4 h-3/4 p-4 relative overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Select dates</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-center mb-4 gap-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex gap-6">
            <h3 className="text-base font-semibold text-gray-900">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <h3 className="text-base font-semibold text-gray-900">
              {nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="flex gap-6 mb-4">
          {renderMonth(currentMonth, currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))}
          {renderMonth(nextMonth, nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))}
        </div>

        {/* Selection Summary */}
        {startDate && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Selected dates:</p>
                <p className="font-medium text-gray-900">
                  {startDate.toLocaleDateString()} 
                  {endDate && ` - ${endDate.toLocaleDateString()}`}
                </p>
                {startDate && endDate && (
                  <p className="text-sm text-gray-600">
                    {Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))} nights
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleClear}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!startDate || !endDate}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-700">
            Select your check-in and check-out dates to see availability and pricing
          </p>
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
