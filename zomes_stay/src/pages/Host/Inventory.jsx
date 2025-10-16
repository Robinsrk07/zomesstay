import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Settings, Filter, Download, Search, Plus, Edit, Eye, BarChart3, TrendingUp, DollarSign, Percent, Save, X, Wrench, Check, Home, Utensils, Target, CalendarDays, IndianRupee, HelpCircle, AlertTriangle, Info } from 'lucide-react';
import SpecialRateModal from '../../components/SpecialRateModal';
import RatePlannerModal from '../../components/RatePlannerModal';
import AddRoomModal from '../../components/AddRoomModal';
import {specialRateService,propertyService,mealPlanService,inventoryService,specialRateApplicationService,propertyRoomTypeService} from '../../services';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';


const PMSInventory = () => {
  const [availabilityData, setAvailabilityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('month');
  const [selectedRoomType, setSelectedRoomType] = useState('suite room');
  const [selectedMealPlan, setSelectedMealPlan] = useState('EP');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingPrice, setEditingPrice] = useState('');
  const [mealPlans, setMealPlans] = useState([]);
  const [roomMaintenanceStatus, setRoomMaintenanceStatus] = useState({});
  const [showSpecialRateModal, setShowSpecialRateModal] = useState(false);
  const [showRatePlannerModal, setShowRatePlannerModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [specialRates, setSpecialRates] = useState([]);
  const [loadingSpecialRates, setLoadingSpecialRates] = useState(false);
  const [roomTypesMap, setRoomTypesMap] = useState([]);
  // Add new state for drag selection and special rates
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState(null);
  const { property } = useSelector((state) => state.property);
  const propertyId = property?.id;
  console.log("propertyId",propertyId)
  const [selectedDateRange, setSelectedDateRange] = useState([]);

 console.log(mealPlans)
  const [showSpecialRateToast, setShowSpecialRateToast] = useState(false);
  const [appliedSpecialRates, setAppliedSpecialRates] = useState({}); // Store applied rates by date
  // Add mobile-specific state
  const [isMobileMultiSelect, setIsMobileMultiSelect] = useState(false);
  const [mobileSelectedDates, setMobileSelectedDates] = useState([]);

   // Helper function to generate background color class from hex
  const generateBgColorFromHex = (hexColor) => {
    // Convert hex to a light background variant
    // This is a simple approximation - you might want to use a proper color library
    return 'bg-gray-50'; // Fallback to gray, you can enhance this
  };

  // Helper function to generate border color class from hex
  const generateBorderColorFromHex = (hexColor) => {
    // Convert hex to a border color variant
    // This is a simple approximation
    return 'border-gray-200'; // Fallback to gray, you can enhance this
  };

  // Transform API special rates data to match the format expected by the toast
  const transformedSpecialRates = specialRates.map((rate) => {
    // Generate description based on pricing mode and kind
    let description = '';
    let type = '';
    let value = 0;
    
    if (rate.pricingMode === 'flat') {
      description = `Fixed ₹${Number(rate.flatPrice).toLocaleString()}`;
      type = 'flat';
      value = rate.flatPrice;
    } else if (rate.pricingMode === 'percent') {
      const percentage = rate.percentAdj;
      if (rate.kind === 'offer') {
        description = `${percentage}% discount`;
        type = 'discount';
      } else {
        description = `${percentage}% surcharge`;
        type = 'surcharge';
      }
      value = percentage;
    } else {
      // Room-specific pricing
      const roomTypeCount = rate.roomTypeLinks.length;
      description = `Custom pricing for ${roomTypeCount} room type${roomTypeCount > 1 ? 's' : ''}`;
      type = rate.kind;
      value = 0;
    }

    return {
      id: rate.id,
      name: rate.name,
      type: type,
      value: value,
      description: description,
      kind: rate.kind,
      color: rate.color,
      bgColor: generateBgColorFromHex(rate.color),
      borderColor: generateBorderColorFromHex(rate.color),
      kind: rate.kind,
      pricingMode: rate.pricingMode,
      flatPrice: rate.flatPrice,
      percentAdj: rate.percentAdj,
      roomTypeLinks: rate.roomTypeLinks
    };
  });

 

 

  const fetchMealPlans = useCallback(async () => {
    try{
      const response = await mealPlanService.getMealPlans(propertyId);
      const data = response

      console.log("mealPlans",data)
      setMealPlans(data);
      
    }catch(error){
      console.error('Error fetching meal plans:', error);
      toast.error('Failed to load meal plansnn');
    }
  }, [propertyId]);


 const fetchAppliedSpecialRates = useCallback(async () => {
   try {
     const response = await specialRateApplicationService.getSpecialRateApplications();
     const data = response?.data?.data;
     setAppliedSpecialRates(data);
   } catch (error) {
     console.error('Error fetching applied special rates:', error);
    // toast.error('Failed to load applied special rates');
   }
 }, []);

  // Fetch availability data using service
  const fetchAvailability = useCallback(async (startDate, endDate) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch real data from API
      const response = await inventoryService.getAvailability(propertyId, startDate, endDate);
      const { dataWithSpecialRates } = response.data;

      // Use getfinalData for calendar (special rates already applied)
      const transformedData = transformApiDataToCalendarFormat(dataWithSpecialRates);


      setAvailabilityData({
        calendar: transformedData,
        property: { title: "Zomes Stay Hotel" }
      });
      // Set default room type to first available if not already set
      const roomTypes = getRoomTypesFromTransformedData(transformedData);
      if (roomTypes.length > 0 && !roomTypes.includes(selectedRoomType)) {
        setSelectedRoomType(roomTypes[0]);
      }
    } catch (err) {
      const errorMsg = `Network error: ${err.message}`;
      setError(errorMsg);
      toast.error('Failed to load inventory data. Please try again.');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedRoomType, propertyId]);

  // fetch special rates

  const fetchSpecialRates = useCallback(async () => {
    try {
      const response = await specialRateService.getSpecialRates(propertyId);
      const data = response?.data?.data
      setSpecialRates(data);
    } catch (error) {
      console.error('Error fetching special rates:', error);
      toast.error('Failed to load special rates');
    }
  }, [propertyId]);

  const fetchRoomTypesMap = useCallback(async () => {
    try {
      const response = await propertyRoomTypeService.getPropertyRoomTypes(propertyId);
      const data = response.data;
      console.log("roomTypesMap",data)
      if (data) {
        setRoomTypesMap(data);
      } else {
        toast.error('Failed to load room types map');
      }
    } catch (error) {
      console.error('Error fetching room types map:', error);
      toast.error('Failed to load room types map');
    }
  }, [propertyId]);

 
  const getDateRange = useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    let startDate, endDate;
    
    if (viewType === 'month') {
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0);
    } else if (viewType === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      startDate = startOfWeek;
      endDate = new Date(startOfWeek);
      endDate.setDate(startOfWeek.getDate() + 6);
    } else {
      startDate = new Date(currentDate);
      endDate = new Date(currentDate);
    }
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  }, [currentDate, viewType]);


  useEffect(() => {
    const { start, end } = getDateRange();
    fetchAvailability(start, end);
    fetchRoomTypesMap();
    fetchSpecialRates();
    fetchMealPlans()
  }, [fetchAvailability, getDateRange,fetchMealPlans, fetchRoomTypesMap, fetchSpecialRates]);

 
  const transformApiDataToCalendarFormat = (apiData) => {
    const calendarData = {};

    apiData.forEach(dayData => {
      const dateKey = dayData.date;
      calendarData[dateKey] = {};
      dayData.RoomType.forEach(roomType => {
        const rate = roomType.Rate && roomType.Rate.length > 0 ? roomType.Rate[0] : null;
        
        // Handle special rate information
        const hasSpecialRate = roomType.hasSpecialRate;
        const appliedSpecialRates = roomType.appliedSpecialRates || [];
        
        // Get the primary special rate (first one if multiple)
        const primarySpecialRate = appliedSpecialRates.length > 0 ? appliedSpecialRates[0] : null;
        
        // Determine final price and original price
        let finalPrice = rate ? rate.price : roomType.Rates;
        let originalPrice = null;
        let specialRateInfo = null;
        
        if (hasSpecialRate && rate) {
          finalPrice = rate.price;
          originalPrice = rate.originalPrice;
          specialRateInfo = rate.specialRate;
        }
        
        calendarData[dateKey][roomType.Type] = {
          totalRooms: roomType.TotalnoofRooms,
          availableRooms: roomType.AvailableRooms,
          bookedRooms: roomType.BookedRooms,
          underMaintenance: roomType.UnderMaintenance,
          basePrice: originalPrice || finalPrice,
          finalPrice: finalPrice,
          originalPrice: originalPrice,
          IsRoomTypeActive: true,
          hasSpecialRate: hasSpecialRate,
          specialRateInfo: specialRateInfo,
          appliedSpecialRates: appliedSpecialRates,
          primarySpecialRate: primarySpecialRate,
          rooms: roomType.Rooms ? roomType.Rooms.map(room => ({
            id: room.roomId,
            name: room.roomName,
            status: room.Avilability && room.Avilability.length > 0 ? room.Avilability[0].status : 'available',
            price: finalPrice,
          })) : []
        };
      });
    });
    return calendarData;
  };
  
  const getRoomTypesFromTransformedData = (calendarData) => {
    if (!calendarData) return [];
    
    const roomTypeSet = new Set();
    Object.values(calendarData).forEach(dateData => {
      Object.keys(dateData).forEach(roomType => roomTypeSet.add(roomType));
    });
    
    return Array.from(roomTypeSet);
  };

  const getRoomTypes = () => {
    return getRoomTypesFromTransformedData(availabilityData?.calendar);
  };

  // Generate calendar grid
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendar = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendar.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];
      const dayData = availabilityData?.calendar?.[dateKey] || {};
      
      calendar.push({
        day,
        date,
        dateKey,
        data: dayData,
        isToday: date.getTime() === today.getTime(),
        isPast: date < today,
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      });
    }

    return calendar;
  };

  // Calculate summary statistics for selected room type
  const calculateSummary = () => {
    if (!availabilityData?.calendar) return null;

    const dates = Object.keys(availabilityData.calendar);
    
    let totalRooms = 0;
    let availableRooms = 0;
    let totalRevenue = 0;
    let validDates = 0;
    
    dates.forEach(date => {
      const dayData = availabilityData.calendar[date];
      if (dayData[selectedRoomType]) {
        const roomData = dayData[selectedRoomType];
        totalRooms += roomData.totalRooms || 0;
        availableRooms += roomData.availableRooms || 0;
        
        // Calculate revenue if price is available
        const occupiedRooms = (roomData.bookedRooms || 0);
        if (roomData.basePrice && occupiedRooms > 0) {
          totalRevenue += parseInt(roomData.basePrice) * occupiedRooms;
        }
        validDates++;
      }
    });

    const occupancyRate = totalRooms > 0 ? ((totalRooms - availableRooms) / totalRooms * 100) : 0;

    return {
      totalRooms: validDates > 0 ? Math.floor(totalRooms / validDates) : 0,
      availableRooms: validDates > 0 ? Math.floor(availableRooms / validDates) : 0,
      occupancyRate: occupancyRate.toFixed(1),
      totalRevenue: totalRevenue.toFixed(0)
    };
  };

  // Navigation functions
  const navigatePeriod = (direction) => {
    const newDate = new Date(currentDate);
    
    if (viewType === 'month') {
      newDate.setMonth(currentDate.getMonth() + direction);
    } else if (viewType === 'week') {
      newDate.setDate(currentDate.getDate() + (direction * 7));
    } else {
      newDate.setDate(currentDate.getDate() + direction);
    }
    
    setCurrentDate(newDate);
  };

  const formatPeriodTitle = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    if (viewType === 'month') {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (viewType === 'week') {
      return `Week of ${currentDate.toLocaleDateString()}`;
    } else {
      return currentDate.toLocaleDateString();
    }
  };

  // Enhanced date click handler for single and mobile multi-select
  const handleDateClick = (dayInfo) => {
    if (dayInfo && !dayInfo.isPast) {
      if (isMobileMultiSelect) {
        // Mobile multi-select mode
        const isAlreadySelected = mobileSelectedDates.includes(dayInfo.dateKey);
        if (isAlreadySelected) {
          setMobileSelectedDates(prev => prev.filter(date => date !== dayInfo.dateKey));
        } else {
          setMobileSelectedDates(prev => [...prev, dayInfo.dateKey]);
        }
      } else if (selectedDateRange.length <= 1 && !isDragging) {
        // Single date selection - show room details modal
        setSelectedDate(dayInfo);
      }
    }
    
  };

  // Handle mouse down to start drag selection
  const handleMouseDown = (dayInfo, e) => {
    if (dayInfo && !dayInfo.isPast && !isMobileMultiSelect) {
      e.preventDefault();
      setIsDragging(true);
      setDragStartDate(dayInfo.dateKey);
      setSelectedDateRange([dayInfo.dateKey]);
      setShowSpecialRateToast(false);
    }
  };

  // Handle mouse enter during drag
  const handleMouseEnter = (dayInfo) => {
    if (isDragging && dayInfo && !dayInfo.isPast) {
      const start = new Date(dragStartDate);
      const end = new Date(dayInfo.dateKey);
      const range = [];
      
      // Determine which date is earlier
      const [startDate, endDate] = start <= end ? [start, end] : [end, start];
      
      // Generate all dates in range
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        range.push(d.toISOString().split('T')[0]);
      }
      
      setSelectedDateRange(range);
    }
  };

  // Handle mouse up to finish drag selection
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      if (selectedDateRange.length > 1) {
        setShowSpecialRateToast(true);
        // Auto-hide toast after 10 seconds
        setTimeout(() => setShowSpecialRateToast(false), 10000);
      }
    }
  };

  // Toggle mobile multi-select mode
  const toggleMobileMultiSelect = () => {
    setIsMobileMultiSelect(!isMobileMultiSelect);
    if (!isMobileMultiSelect) {
      // Entering multi-select mode
      setMobileSelectedDates([]);
      setSelectedDateRange([]);
    } else {
      // Exiting multi-select mode
      if (mobileSelectedDates.length > 0) {
        setSelectedDateRange(mobileSelectedDates.sort());
        setShowSpecialRateToast(true);
        setTimeout(() => setShowSpecialRateToast(false), 10000);
      }
      setMobileSelectedDates([]);
    }
  };

  // Apply special rate to selected dates
  const applySpecialRate = async (rate) => {
    const datesToApply = selectedDateRange.length > 0 ? selectedDateRange : [selectedDate?.dateKey].filter(Boolean);
    
    if (datesToApply.length === 0) return;

    try {
      // Extract dateFrom and dateTo from the selected dates array
      const sortedDates = datesToApply.sort(); // Ensure dates are in chronological order
      const dateFrom = sortedDates[0]; // First date (earliest)
      const dateTo = sortedDates[sortedDates.length - 1]; // Last date (latest)

      // Format dates to DD-MM-YYYY as expected by your backend
      const formatDateToDDMMYYYY = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };

      const formattedDateFrom = formatDateToDDMMYYYY(dateFrom);
      // For single day applications, use the same date for dateTo
      const formattedDateTo = formatDateToDDMMYYYY(dateTo);

      // Get all property room type IDs (you can get this from roomTypesMap or availabilityData)
      const allPropertyRoomTypeIds = roomTypesMap.map(roomType => roomType.id);
      const payload = {
        specialRateId: rate.id,
        propertyId: propertyId,
        propertyRoomTypeId: JSON.stringify(allPropertyRoomTypeIds), // Send as JSON string array
        dateFrom: formattedDateFrom,
        dateTo: formattedDateTo
      };

      console.log('Applying special rate with payload:', payload);
      console.log(`Single day application: ${dateFrom === dateTo ? 'Yes' : 'No'}`);

      // Call the API
      const response = await specialRateApplicationService.createSpecialRateApplication(payload);

      if (response.data.success) {
      // Update local state immediately for visual feedback
      const newAppliedRates = { ...appliedSpecialRates };
      datesToApply.forEach(date => {
        newAppliedRates[date] = {
          rateId: rate.id,
          rateName: rate.name,
          rateType: rate.type,
          rateValue: rate.value,
          color: rate.color,
          bgColor: rate.bgColor,
          borderColor: rate.borderColor,
          appliedAt: new Date().toISOString()
        };
      });
      
      setAppliedSpecialRates(newAppliedRates);
      setShowSpecialRateToast(false);
      setSelectedDateRange([]);
      setSelectedDate(null);
      setMobileSelectedDates([]);
      setIsMobileMultiSelect(false);
      
        // Show appropriate success message
        const successMessage = dateFrom === dateTo 
          ? `Applied "${rate.name}" for ${formattedDateFrom}` 
          : `Applied "${rate.name}" from ${formattedDateFrom} to ${formattedDateTo} (${datesToApply.length} days)`;
        
        toast.success(successMessage);
      } else {
        throw new Error(response.data.message || 'Failed to apply special rate');
      }
      
    } catch (error) {
      console.error('Error applying special rate:', error);
      toast.error(error.response?.data?.message || 'Failed to apply special rate. Please try again.');
    }
  };

  // Helper: get currently selected date keys (range or single)
  const getSelectedDateKeys = () => {
    if (selectedDateRange.length > 0) return [...selectedDateRange];
    if (selectedDate?.dateKey) return [selectedDate.dateKey];
    return [];
  };

  // Helper: gather unique applied specialRate ids across the current selection
  const getSelectedAppliedSpecialIds = () => {
    const dates = getSelectedDateKeys();
    const idSet = new Set();
    dates.forEach((d) => {
      const rt = availabilityData?.calendar?.[d]?.[selectedRoomType];
      const list = Array.isArray(rt?.appliedSpecialRates) ? rt.appliedSpecialRates : [];
      list.forEach((x) => { if (x?.id) idSet.add(x.id); });
    });
    return Array.from(idSet);
  };

  // Detect if any selected date already has a special rate (from API or local applied map)
  const selectionHasExistingSpecial = (() => {
    const dates = getSelectedDateKeys();
    if (!dates.length) return false;
    return dates.some((d) => {
      if (appliedSpecialRates[d]) return true;
      const day = availabilityData?.calendar?.[d];
      const rt = day?.[selectedRoomType];
      return Boolean(rt?.hasSpecialRate);
    });
  })();

  // Stubs: remove/edit actions (no API calls yet)
  const handleRemoveSpecialRate = async(specialRateIds) => {
    const dates = getSelectedDateKeys();
    const ids = Array.isArray(specialRateIds) ? specialRateIds : (specialRateIds ? [specialRateIds] : []);
    try{ 
   const response = await specialRateApplicationService.deleteSpecialRateApplication(ids);
   if(response.data.success){
     toast.success('Special rate removed successfully');
     fetchAppliedSpecialRates();
     // Optionally, refresh availability to reflect changes
     const { start, end } = getDateRange();
     fetchAvailability(start, end);
   }else{
     throw new Error(response.data.message || 'Failed to remove special rate');
   }
    }catch(error){
      console.error('Error removing special rate:', error);
    }

    console.log("specialRateIds",ids)
    console.log('Remove special rate requested', { dates, roomType: selectedRoomType, specialRateIds: ids });
  };

  const handleEditSpecialRate = (specialRateId) => {
    const dates = getSelectedDateKeys();
    const id = Array.isArray(specialRateId) ? specialRateId[0] : specialRateId;
    // Placeholder only; integrate API later
    // eslint-disable-next-line no-console
    console.log('Edit special rate requested', { dates, roomType: selectedRoomType, specialRateId: id });
    toast.info('Edit special rate action queued (implement API next).');
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedDateRange([]);
    setShowSpecialRateToast(false);
    setIsDragging(false);
    setMobileSelectedDates([]);
    setIsMobileMultiSelect(false);
  };

  // Get the color for a date based on applied special rate
  const getDateColors = (dateKey, dayInfo) => {
    const appliedRate = appliedSpecialRates[dateKey];
    const isSelected = selectedDateRange.includes(dateKey) || mobileSelectedDates.includes(dateKey);
    
    let base = 'min-h-14 sm:min-h-20 p-1 sm:p-1.5 transition-all duration-200 relative';
    let color = 'bg-white';
    let ring = '';
    
    if (dayInfo.isPast) {
      color = 'bg-gray-50 opacity-60 pointer-events-none';
    } else if (isSelected) {
      ring = 'ring-2 ring-blue-400 ring-opacity-75';
      color = 'bg-blue-100';
    } else if (appliedRate) {
      color = appliedRate.bgColor;
      ring = `ring-1 ${appliedRate.borderColor.replace('border-', 'ring-')}`;
    } else if (dayInfo.data && dayInfo.data[selectedRoomType]?.hasSpecialRate) {
      // Use API-provided special rate styling
      const primaryRate = dayInfo.data[selectedRoomType].primarySpecialRate;
      const specialRateInfo = dayInfo.data[selectedRoomType].specialRateInfo;
      
      if (primaryRate && primaryRate.color) {
        // Use the color from applied special rates
        color = `bg-opacity-20`;
        ring = 'ring-2 ring-opacity-60';
        // We'll apply the actual color via inline styles
      } else if (specialRateInfo && specialRateInfo.color) {
        // Use the color from special rate info
        color = `bg-opacity-20`;
        ring = 'ring-2 ring-opacity-60';
      } else {
        // Fallback colors based on pricing mode or type
        if (specialRateInfo?.pricingMode === 'flat') {
          color = 'bg-green-50';
          ring = 'ring-1 ring-green-200';
        } else {
          color = 'bg-blue-50';
          ring = 'ring-1 ring-blue-200';
        }
      }
    } else if (dayInfo.isToday) {
      color = 'bg-blue-50';
      ring = 'ring-2 ring-blue-300';
    } else if (dayInfo.isWeekend) {
      color = 'bg-orange-50';
    }
    
    let cursor = !dayInfo.isPast ? 'cursor-pointer' : '';
    return `${base} ${color} ${ring} ${cursor}`;
  };

  // Room management functions
  const toggleRoomMaintenance = (roomId, dateKey) => {
    const key = `${dateKey}-${roomId}`;
    setRoomMaintenanceStatus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePriceEdit = (roomId, dateKey, currentPrice) => {
    setEditingRoom(`${dateKey}-${roomId}`);
    setEditingPrice(currentPrice);
  };

  const savePriceEdit = (roomId, dateKey) => {
    // Here you would make an API call to update the price
    setEditingRoom(null);
    setEditingPrice('');
  };

  const cancelPriceEdit = () => {
    setEditingRoom(null);
    setEditingPrice('');
  };

  const calendar = generateCalendar();

  const roomTypes = getRoomTypes();
  const summary = calculateSummary();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Home className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Room Inventory</h1>
                {availabilityData?.property && (
                  <p className="text-sm text-gray-500">{availabilityData.property.title}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            
            <button 
              onClick={() => setShowRatePlannerModal(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors"
            >
            <Plus size={20} />
          <span className="hidden sm:inline">Rate Planner</span>
            </button>
            <button 
              onClick={() => setShowSpecialRateModal(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors"
            >
              <Target className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Special Rate</span>
            </button>
            <button 
              onClick={() => setShowAddRoomModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Room</span>
            </button>
          </div>
        </div>

        {/* Room Type and Meal Plan Selector */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
              <div className="flex items-center space-x-3">
                <Home className="h-4 w-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Room Type:</label>
                <select
                  value={selectedRoomType}
                  onChange={(e) => setSelectedRoomType(e.target.value)}
                  className="block w-full sm:w-64 pl-3 pr-10 py-2.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm"
                >
                  {roomTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              
            </div>
            
            {showFilters && (
              <div className="flex items-center space-x-2 min-w-0">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search rooms..."
                  className="block w-full sm:w-48 pl-3 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Multi-Select Controls */}
      <div className="sm:hidden px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleMobileMultiSelect}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isMobileMultiSelect
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Target className="h-4 w-4 mr-2" />
              {isMobileMultiSelect ? 'Done Selecting' : 'Multi-Select'}
            </button>
            {isMobileMultiSelect && mobileSelectedDates.length > 0 && (
              <span className="text-sm text-gray-600">
                {mobileSelectedDates.length} selected
              </span>
            )}
          </div>
          {(isMobileMultiSelect || mobileSelectedDates.length > 0) && (
            <button
              onClick={clearSelection}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Active Special Rates Management */}
      {specialRates.length > 0 && (
        <div className="px-4 sm:px-6 py-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-violet-600" />
                  <h3 className="text-lg font-medium text-gray-900">Active Special Rates</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                    {specialRates.length}
                  </span>
                </div>
                {loadingSpecialRates && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-600"></div>
                )}
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {specialRates.map((rate) => (
                  <div key={rate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{rate.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(rate.dateFrom).toLocaleDateString()} - {new Date(rate.dateTo).toLocaleDateString()}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            {rate.pricingMode === 'flat' ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ₹{Number(rate.flatPrice).toLocaleString()}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {rate.percentAdj > 0 ? '+' : ''}{rate.percentAdj}%
                              </span>
                            )}
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              rate.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {rate.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleToggleSpecialRate(rate.id, rate.name, rate.isActive)}
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                          rate.isActive 
                            ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200' 
                            : 'text-green-700 bg-green-100 hover:bg-green-200'
                        }`}
                        title={rate.isActive ? 'Disable rate' : 'Enable rate'}
                      >
                        {rate.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDeleteSpecialRate(rate.id, rate.name)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                        title="Delete rate"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {summary && (
        <div className="px-4 sm:px-6 py-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-4 sm:p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                  </div>
                  <div className="ml-3 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Rooms</dt>
                      <dd className="text-base sm:text-lg font-semibold text-gray-900">{summary.totalRooms}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-4 sm:p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
                  </div>
                  <div className="ml-3 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Available</dt>
                      <dd className="text-base sm:text-lg font-semibold text-emerald-600">{summary.availableRooms}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-4 sm:p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Percent className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                  </div>
                  <div className="ml-3 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Occupancy</dt>
                      <dd className="text-base sm:text-lg font-semibold text-blue-600">{summary.occupancyRate}%</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-4 sm:p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
                  </div>
                  <div className="ml-3 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Revenue</dt>
                      <dd className="text-base sm:text-lg font-semibold text-gray-900">₹{Number(summary.totalRevenue).toLocaleString()}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Controls */}
      <div className="px-4 sm:px-6 py-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                {['month', 'week', 'day'].map((view) => (
                  <button
                    key={view}
                    onClick={() => setViewType(view)}
                    className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md capitalize transition-colors ${
                      viewType === view
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => navigatePeriod(-1)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 min-w-0 text-center">
                {formatPeriodTitle()}
              </h2>
              <button
                onClick={() => navigatePeriod(1)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg self-end sm:self-auto transition-colors">
              <Settings className="h-5 w-5" />
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="p-8 text-center">
              <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-blue-500 bg-blue-100">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading availability data...
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          const { start, end } = getDateRange();
                          fetchAvailability(start, end);
                        }}
                        className="text-sm bg-red-100 text-red-800 px-3 py-1.5 rounded-md hover:bg-red-200 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Calendar Grid */}
          {!loading && !error && availabilityData && (
            <div className="p-2 sm:p-4">
              {/* Instructions */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <div className="hidden sm:block">
                      <strong>Desktop:</strong> Click for room details • Drag to select multiple dates for special rates
                    </div>
                    <div className="sm:hidden">
                      <strong>Mobile:</strong> Tap for room details • Use "Multi-Select" button for multiple dates
                    </div>
                  </div>
                </div>
              </div>

              {/* Selection Info */}
              {(selectedDateRange.length > 0 || mobileSelectedDates.length > 0) && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-green-800">
                      <strong>
                        {selectedDateRange.length || mobileSelectedDates.length} date{(selectedDateRange.length || mobileSelectedDates.length) > 1 ? 's' : ''} selected
                      </strong>
                      {isMobileMultiSelect ? (
                        <span> - Tap "Done Selecting" to apply special rates</span>
                      ) : (
                        <span> - Drag completed! Use the popup to apply special rates</span>
                      )}
                    </div>
                    <button
                      onClick={clearSelection}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile Multi-Select Status */}
              {isMobileMultiSelect && (
                <div className="mb-4 p-3 bg-violet-50 rounded-lg border border-violet-200 sm:hidden">
                  <div className="text-sm text-violet-800">
                    <strong>Multi-Select Mode:</strong> Tap dates to select/deselect • 
                    {mobileSelectedDates.length > 0 ? ` ${mobileSelectedDates.length} dates selected` : ' No dates selected'}
                  </div>
                </div>
              )}

              {/* Week Headers */}
              <div className="grid grid-cols-7 gap-px mb-2">
                {weekDays.map((day) => (
                  <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day.slice(0, 1)}</span>
                  </div>
                ))}
              </div>

              {/* Calendar Days with Enhanced Interaction */}
              <div 
                className="grid grid-cols-7 gap-px bg-gray-200 select-none"
                onMouseLeave={() => {
                  if (isDragging) {
                    setIsDragging(false);
                  }
                }}
              >
                {calendar.map((dayInfo, index) => {
                  const appliedRate = dayInfo ? appliedSpecialRates[dayInfo.dateKey] : null;
                  const isSelected = selectedDateRange.includes(dayInfo?.dateKey) || 
                                   mobileSelectedDates.includes(dayInfo?.dateKey);
                  
                  // Get special rate styling information
                  let specialRateColor = null;
                  let hasApiSpecialRate = false;
                  
                  if (dayInfo?.data?.[selectedRoomType]?.hasSpecialRate) {
                    hasApiSpecialRate = true;
                    const primaryRate = dayInfo.data[selectedRoomType].primarySpecialRate;
                    const specialRateInfo = dayInfo.data[selectedRoomType].specialRateInfo;
                    
                    specialRateColor = primaryRate?.color || specialRateInfo?.color;
                  }
                  
                  // Create inline styles for special rate colors
                  let inlineStyles = {};
                  if (hasApiSpecialRate && specialRateColor && !isSelected && !appliedRate) {
                    inlineStyles = {
                      backgroundColor: `${specialRateColor}15`, // Light background
                      borderColor: specialRateColor,
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      borderRadius: '8px'
                    };
                  }
                  
                  return (
                    <div
                      key={index}
                      onMouseDown={(e) => !isMobileMultiSelect && handleMouseDown(dayInfo, e)}
                      onMouseEnter={() => !isMobileMultiSelect && handleMouseEnter(dayInfo)}
                      onMouseUp={() => !isMobileMultiSelect && handleMouseUp()}
                      onClick={() => handleDateClick(dayInfo)}
                      className={dayInfo ? getDateColors(dayInfo.dateKey, dayInfo) : 'min-h-20 sm:min-h-28 bg-gray-50 p-2'}
                      style={inlineStyles}
                    >
                      {dayInfo && (
                        <div className="h-full flex flex-col">
                          {/* Applied Rate Indicator */}
                          {appliedRate && (
                            <div className="absolute top-1 right-1">
                              <div 
                                className="w-2 h-2 rounded-full border border-white shadow-sm"
                                style={{ backgroundColor: appliedRate.color }}
                                title={`Applied Rate: ${appliedRate.rateName}`}
                              ></div>
                            </div>
                          )}
                          
                          {/* Special Rate from API Indicator */}
                          {hasApiSpecialRate && !appliedRate && (
                            <div className="absolute top-1 right-1">
                              <div 
                                className="w-2 h-2 rounded-full border border-white shadow-sm"
                                style={{ backgroundColor: specialRateColor }}
                                title={`Special Rate: ${dayInfo.data[selectedRoomType].primarySpecialRate?.name || dayInfo.data[selectedRoomType].specialRateInfo?.name}`}
                              ></div>
                            </div>
                          )}
                          
                          {/* Selection Indicator */}
                          {isSelected && (
                            <div className="absolute top-1 left-1">
                              <div className="w-2 h-2 bg-blue-600 rounded-full shadow-sm"></div>
                            </div>
                          )}

                          {/* Mobile Multi-Select Indicator */}
                          {isMobileMultiSelect && mobileSelectedDates.includes(dayInfo.dateKey) && (
                            <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded flex items-center justify-center">
                              <Check className="h-4 w-4 text-blue-600" />
                            </div>
                          )}

                          <div className={`text-sm font-semibold mb-2 ${
                            dayInfo.isPast ? 'text-gray-400' : 
                            dayInfo.isToday ? 'text-blue-600' :
                            dayInfo.isWeekend ? 'text-orange-600' :
                            'text-gray-900'
                          }`}>
                            {dayInfo.day}
                          </div>

                          <div className="flex-1 space-y-1">
                            {dayInfo.data[selectedRoomType] && (
                              <div className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                                dayInfo.data[selectedRoomType].IsRoomTypeActive 
                                  ? dayInfo.data[selectedRoomType].availableRooms > 0
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-red-100 text-red-800 border border-red-200'
                                  : 'bg-gray-100 text-gray-600 border border-gray-200'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-1">
                                    <div className={`w-2 h-2 rounded-full ${
                                      dayInfo.data[selectedRoomType].availableRooms > 0 ? 'bg-emerald-500' : 'bg-red-500'
                                    }`}></div>
                                    <span className="font-semibold">
                                      {dayInfo.data[selectedRoomType].availableRooms}
                                    </span>
                                    <span className="text-gray-600">rooms</span>
                                  </div>
                                </div>

                                {/* Enhanced Price Display with Special Rate */}
                                <div className="mt-1 text-center">
                                  {appliedRate ? (
                                    <div>
                                      <span className="font-bold text-sm" style={{ color: appliedRate.color }}>
                                        {appliedRate.rateType === 'flat' 
                                          ? `₹${Number(appliedRate.rateValue).toLocaleString()}`
                                          : `${appliedRate.rateType === 'discount' ? '-' : '+'}${appliedRate.rateValue}%`
                                        }
                                      </span>
                                      <div className="text-xs mt-1" style={{ color: appliedRate.color }}>
                                        {appliedRate.rateName}
                                      </div>
                                    </div>
                                  ) : dayInfo.data[selectedRoomType].hasSpecialRate ? (
                                    <div>
                                      {/* Show original price with strikethrough if different from final price */}
                                      {dayInfo.data[selectedRoomType].originalPrice && 
                                       dayInfo.data[selectedRoomType].originalPrice !== dayInfo.data[selectedRoomType].finalPrice && (
                                        <div className="text-xs text-gray-500 line-through">
                                        ₹{Number(dayInfo.data[selectedRoomType].originalPrice).toLocaleString()}
                                        </div>
                                      )}
                                      
                                      {/* Final price with special rate styling */}
                                      <div 
                                        className="font-bold text-sm"
                                        style={{ color: specialRateColor || '#059669' }}
                                      >
                                        ₹{Number(dayInfo.data[selectedRoomType].finalPrice).toLocaleString()}
                                      </div>
                                      
                                      {/* Special rate name */}
                                      <div 
                                        className="text-xs mt-1 truncate"
                                        style={{ color: specialRateColor || '#7C3AED' }}
                                        title={dayInfo.data[selectedRoomType].primarySpecialRate?.name || dayInfo.data[selectedRoomType].specialRateInfo?.name}
                                      >
                                        {dayInfo.data[selectedRoomType].primarySpecialRate?.name || 
                                         dayInfo.data[selectedRoomType].specialRateInfo?.name || 
                                         'Special Rate'}
                                      </div>
                                    </div>
                                  ) : (
                                    /* Regular price */
                                    dayInfo.data[selectedRoomType].basePrice && (
                                      <span className="font-bold text-sm">
                                        ₹{Number(dayInfo.data[selectedRoomType].basePrice).toLocaleString()}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Applied Special Rates Legend */}
              {Object.keys(appliedSpecialRates).length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Applied Special Rates:</h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(Object.values(appliedSpecialRates).map(rate => rate.rateId))).map(rateId => {
                      const rate = Object.values(appliedSpecialRates).find(r => r.rateId === rateId);
                      const count = Object.values(appliedSpecialRates).filter(r => r.rateId === rateId).length;
                      return (
                        <div key={rateId} className="flex items-center space-x-2 text-xs">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: rate.color }}
                          ></div>
                          <span className="font-medium">{rate.rateName}</span>
                          <span className="text-gray-500">({count} dates)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selected Date Details Modal */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedDate.date.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  {/* If selected date has existing special(s), show quick actions */}
                  {availabilityData?.calendar?.[selectedDate.dateKey]?.[selectedRoomType]?.hasSpecialRate && (
                    <div className="hidden sm:flex items-center gap-2 mr-2">
                      {(() => {
                        const rt = availabilityData?.calendar?.[selectedDate.dateKey]?.[selectedRoomType];
                        const ids = Array.isArray(rt?.appliedSpecialRates)
                          ? rt.appliedSpecialRates.map(x => x?.id).filter(Boolean)
                          : [];
                        const primaryId = ids.length > 0 ? ids[0] : null;
                        return (
                          <>
                            <button
                              onClick={() => handleRemoveSpecialRate(ids)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
                            >
                              Remove special rate
                            </button>
                            <button
                              onClick={() => handleEditSpecialRate(primaryId)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                            >
                              Edit special rate
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  )}
                  {/* Single Date Special Rate Button */}
                  <button
                    onClick={() => {
                      setSelectedDateRange([selectedDate.dateKey]);
                      setShowSpecialRateToast(true);
                    }}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                  >
                    <Target className="h-4 w-4 mr-1" />
                    Apply Special Rate
                  </button>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              <div className="space-y-6">
                {Object.entries(selectedDate.data).map(([roomType, roomData]) => (
                  <div key={roomType} className="border border-gray-200 rounded-lg p-4 sm:p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-semibold text-gray-900 text-lg">{roomType}</h4>
                      <div className="flex space-x-2">
                        <button className="text-sm text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-sm text-gray-600 hover:text-gray-800 p-1 hover:bg-gray-50 rounded transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm mb-6">
                      <div>
                        <span className="text-gray-500">Available:</span>
                        <div className="font-semibold text-lg">{roomData.availableRooms}/{roomData.totalRooms}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Booked:</span>
                        <div className="font-semibold text-lg text-red-600">{roomData.bookedRooms || 0}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Maintenance:</span>
                        <div className="font-semibold text-lg text-orange-600">{roomData.underMaintenance || 0}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Base Price:</span>
                        <div className="font-semibold text-lg">₹{Number(roomData.basePrice || 0).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Occupancy:</span>
                        <div className="font-semibold text-lg">
                          {roomData.totalRooms > 0 ? 
                            Math.round(((roomData.bookedRooms || 0) / roomData.totalRooms) * 100) : 0
                          }%
                        </div>
                      </div>
                    </div>

                    {roomData.rooms && roomData.rooms.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-4">Individual Rooms:</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {roomData.rooms.map((room) => {
                            const maintenanceKey = `${selectedDate.dateKey}-${room.id}`;
                            const editKey = `${selectedDate.dateKey}-${room.id}`;
                            const isInMaintenance = roomMaintenanceStatus[maintenanceKey];
                            const isEditing = editingRoom === editKey;
                            
                            return (
                              <div key={room.id} className={`p-4 rounded-lg border-2 transition-all ${
                                isInMaintenance ? 'border-orange-300 bg-orange-50' :
                                room.status === 'available' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
                              }`}>
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <div className="font-medium text-sm">{room.name}</div>
                                    <div className="text-xs text-gray-600">Code: {room.code}</div>
                                    <div className="text-xs text-gray-500 mt-1">Max: {room.maxOccupancy} guests</div>
                                  </div>
                                  
                                  {/* Maintenance Toggle */}
                                  <button
                                    onClick={() => toggleRoomMaintenance(room.id, selectedDate.dateKey)}
                                    className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                                      isInMaintenance 
                                        ? 'bg-orange-200 text-orange-800 hover:bg-orange-300' 
                                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                    }`}
                                    title={isInMaintenance ? 'Remove from maintenance' : 'Set for maintenance'}
                                  >
                                    <Wrench className="h-3 w-3" />
                                    <span>{isInMaintenance ? 'On Hold' : 'Hold'}</span>
                                  </button>
                                </div>

                                {/* Room Status */}
                                <div className="mb-3">
                                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    isInMaintenance ? 'bg-orange-100 text-orange-800' :
                                    room.status === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {isInMaintenance ? 'Under Maintenance' : 
                                     room.status === 'available' ? 'Available' : 'Occupied'}
                                  </div>
                                  
                                  {/* Guest Info for Occupied Rooms */}
                                  {room.status === 'occupied' && room.guestInfo && (
                                    <div className="mt-2 p-2 bg-white rounded border border-red-200">
                                      <div className="text-xs text-gray-700">
                                        <div className="font-medium">{room.guestInfo.guestName}</div>
                                        <div className="text-gray-500">
                                          {room.guestInfo.checkIn} - {room.guestInfo.checkOut}
                                        </div>
                                        <div className="text-gray-500">
                                          {room.guestInfo.adults} adults, {room.guestInfo.children} children
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Amenities */}
                                {room.amenities && room.amenities.length > 0 && (
                                  <div className="mb-3">
                                    <div className="text-xs text-gray-500 mb-1">Amenities:</div>
                                    <div className="flex flex-wrap gap-1">
                                      {room.amenities.slice(0, 3).map((amenity, idx) => (
                                        <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                                          {amenity}
                                        </span>
                                      ))}
                                      {room.amenities.length > 3 && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                          +{room.amenities.length - 3} more
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Price Section */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Price:</span>
                                    {!isEditing ? (
                                      <div className="flex items-center space-x-2">
                                        <span className="font-medium">₹{room.price}</span>
                                        <button
                                          onClick={() => handlePriceEdit(room.id, selectedDate.dateKey, room.price)}
                                          className="text-blue-600 hover:text-blue-800 p-0.5 hover:bg-blue-50 rounded transition-colors"
                                          title="Edit price"
                                        >
                                          <Edit className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center space-x-1">
                                        <div className="relative">
                                          <span className="absolute left-1 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">₹</span>
                                          <input
                                            type="number"
                                            value={editingPrice}
                                            onChange={(e) => setEditingPrice(e.target.value)}
                                            className="w-16 pl-4 pr-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                            autoFocus
                                          />
                                        </div>
                                        <button
                                          onClick={() => savePriceEdit(room.id, selectedDate.dateKey)}
                                          className="text-emerald-600 hover:text-emerald-800 p-0.5 hover:bg-emerald-50 rounded transition-colors"
                                          title="Save price"
                                        >
                                          <Check className="h-3 w-3" />
                                        </button>
                                        <button
                                          onClick={cancelPriceEdit}
                                          className="text-red-600 hover:text-red-800 p-0.5 hover:bg-red-50 rounded transition-colors"
                                          title="Cancel editing"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>Min nights: {room.minNights}</span>
                                    <span>Max: {room.maxOccupancy} guests</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Special Rate Modal */}
      <SpecialRateModal 
        isOpen={showSpecialRateModal}
        onClose={() => setShowSpecialRateModal(false)}
        availabilityData={availabilityData}
        defaultMealPlan={selectedMealPlan}
        propertyId={propertyId}
        onApplied={async () => {
          try {
            toast.success('Special rate applied successfully!');
            const { start, end } = getDateRange();
            await Promise.all([
              fetchAvailability(start, end),
              fetchSpecialRates()
            ]);
          } catch (error) {
            toast.error('Failed to refresh inventory data');
            console.error('Error refreshing data:', error);
          }
        }}

      />

      {/* Special Rate Selection Toast */}
      {showSpecialRateToast && (selectedDateRange.length > 0 || mobileSelectedDates.length > 0) && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-violet-600" />
                <h3 className="font-medium text-gray-900">Apply Special Rate</h3>
              </div>
              <button
                onClick={clearSelection}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              {selectedDateRange.length || mobileSelectedDates.length} date{(selectedDateRange.length || mobileSelectedDates.length) > 1 ? 's' : ''} selected
            </p>
            
                {selectionHasExistingSpecial && (
                  <div className="mb-3 p-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    A special rate is already applied on at least one selected date.
                  </div>
                )}

                {selectionHasExistingSpecial && (
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => handleRemoveSpecialRate(getSelectedAppliedSpecialIds())}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
                    >
                      Remove special rate
                    </button>
                    <button
                      onClick={() => handleEditSpecialRate(getSelectedAppliedSpecialIds()[0])}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                    >
                      Edit special rate
                    </button>
                  </div>
                )}
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {transformedSpecialRates.length > 0 ? (
                transformedSpecialRates.map((rate) => (
                <button
                  key={rate.id}
                  onClick={() => applySpecialRate(rate)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: rate.color }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900">{rate.name}</div>
                      <div className="text-xs text-gray-500 truncate">{rate.description}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {rate.kind === 'offer' ? '📢 Discount' : '🔥 Peak Rate'}
                        </div>
                    </div>
                  </div>
                </button>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No special rates available
                </div>
              )}
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={clearSelection}
                className="w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rate Planner Modal */}
      <RatePlannerModal
        isOpen={showRatePlannerModal}
        onClose={() => setShowRatePlannerModal(false)}
        roomTypesMap={roomTypesMap}
        mealPlans={mealPlans}
        propertyId={propertyId}
        onSave={async (ratePlans) => {
          // TODO: Implement API call to save rate plans
          console.log('Saving rate plans:', ratePlans);
          // Example: await ratePlannerService.saveRatePlans(propertyId, ratePlans);
        }}
      />

      {/* Add Room Modal */}
      <AddRoomModal
        isOpen={showAddRoomModal}
        onClose={() => setShowAddRoomModal(false)}
        roomTypesMap={roomTypesMap}
        propertyId={propertyId}
        onSave={async (roomData) => {
          try {
            
            // Call the API to create room
            const response = await propertyService.createRoom(propertyId, roomData);
            
            if (response.data.success) {
              toast.success('Room created successfully!');
              
              // Refresh availability data
              const { start, end } = getDateRange();
              await fetchAvailability(start, end);
            } else {
              throw new Error(response.data.message || 'Failed to create room');
            }
          } catch (error) {
            console.error('Error creating room:', error);
            toast.error(error.response?.data?.message || 'Failed to create room. Please try again.');
          }
        }}
      />

    </div>
  );
};

export default PMSInventory;