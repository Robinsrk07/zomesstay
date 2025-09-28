import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Settings, Filter, Download, Search, Plus, Edit, Eye, BarChart3, TrendingUp, DollarSign, Percent, Save, X, Wrench, Check, Home, Utensils, Target, CalendarDays, IndianRupee, HelpCircle, AlertTriangle, Info } from 'lucide-react';
import SpecialRateModal from '../../components/SpecialRateModal';
import {specialRateService,propertyService,inventoryService} from '../../services';
import { toast } from 'react-toastify';

const PMSInventory = () => {
  const [propertyId] = useState('4fe5a0ba-f1c5-4650-91a2-605008189337');
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
  const [roomMaintenanceStatus, setRoomMaintenanceStatus] = useState({});
  const [showSpecialRateModal, setShowSpecialRateModal] = useState(false);
  const [specialRates, setSpecialRates] = useState([]);
  const [loadingSpecialRates, setLoadingSpecialRates] = useState(false);
  const [roomTypesMap, setRoomTypesMap] = useState([]);


  console.log(specialRates)

  // Meal plan options
  const mealPlans = [
    { value: 'EP', label: 'EP (European Plan)', description: 'Room Only' },
    { value: 'CP', label: 'CP (Continental Plan)', description: 'Room + Breakfast' },
    { value: 'MAP', label: 'MAP (Modified American Plan)', description: 'Room + Breakfast + Dinner' },
    { value: 'AP', label: 'AP (American Plan)', description: 'All Meals Included' },
    { value: 'NO_MEAL', label: 'No Meal Plan', description: 'Room Only' }
  ];

  // Fetch availability data using service
  const fetchAvailability = useCallback(async (startDate, endDate) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch real data from API
      const response = await inventoryService.getAvailability(propertyId, startDate, endDate);
      const { data, specialRates, getfinalData } = response.data;
      // Use getfinalData for calendar (special rates already applied)
      const transformedData = transformApiDataToCalendarFormat(getfinalData.data);
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

  const fetchRoomTypesMap = useCallback(async () => {
    try {
      const response = await propertyService.getRoomTypes(propertyId);
      const data = response.data;
      if (data) {
        setRoomTypesMap(data.data);
      } else {
        toast.error('Failed to load room types map');
      }
    } catch (error) {
      console.error('Error fetching room types map:', error);
      toast.error('Failed to load room types map');
    }
  }, [propertyId]);

 
  // Fetch special rates
  const fetchSpecialRates = useCallback(async () => {
    setLoadingSpecialRates(true);
    try {
      const response = await specialRateService.getSpecialRates(propertyId, {
        status: 'active',
        limit: 50
      });
      
      if (response.data.success) {
        setSpecialRates(response.data.data);
      } else {
        toast.error('Failed to load special rates');
      }
    } catch (error) {
      console.error('Error fetching special rates:', error);
      toast.error('Failed to load special rates');
    } finally {
      setLoadingSpecialRates(false);
    }
  }, [propertyId]);

  // Delete special rate
  const handleDeleteSpecialRate = async (rateId, rateName) => {
    if (!window.confirm(`Are you sure you want to delete "${rateName}"?`)) {
      return;
    }

    try {
      const response = await specialRateService.deleteSpecialRate(rateId);
      if (response.data.success) {
        toast.success('Special rate deleted successfully');
        await fetchSpecialRates();
        const { start, end } = getDateRange();
        await fetchAvailability(start, end);
      } else {
        toast.error(response.data.message || 'Failed to delete special rate');
      }
    } catch (error) {
      console.error('Error deleting special rate:', error);
      toast.error('Failed to delete special rate');
    }
  };

  // Toggle special rate
  const handleToggleSpecialRate = async (rateId, rateName, isActive) => {
    try {
      const response = await specialRateService.toggleSpecialRate(rateId);
      if (response.data.success) {
        toast.success(`Special rate "${rateName}" ${!isActive ? 'enabled' : 'disabled'} successfully`);
        await fetchSpecialRates();
        const { start, end } = getDateRange();
        await fetchAvailability(start, end);
      } else {
        toast.error(response.data.message || 'Failed to toggle special rate');
      }
    } catch (error) {
      console.error('Error toggling special rate:', error);
      toast.error('Failed to toggle special rate');
    }
  };

  // Generate date range based on current view
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

  // Fetch data when component mounts or dependencies change
  useEffect(() => {
    const { start, end } = getDateRange();
    fetchAvailability(start, end);
    fetchSpecialRates();
    fetchRoomTypesMap();
  }, [fetchAvailability, getDateRange, fetchSpecialRates, fetchRoomTypesMap]);

  // Generate mock data for date range
  const generateMockDataForDateRange = (startDate, endDate) => {
    const data = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      // Vary availability for demo purposes
      const isDuelex26 = dateStr === '2025-09-26';
      
      data.push({
        date: dateStr,
        RoomType: [
          {
            Type: "duelex room",
            TotalnoofRooms: 2,
            AvailableRooms: isDuelex26 ? 1 : 2,
            BookedRooms: isDuelex26 ? 1 : 0,
            UnderMaintenance: 0,
            Rates: "3199"
          },
          {
            Type: "suite room",
            TotalnoofRooms: 3,
            AvailableRooms: 3,
            BookedRooms: 0,
            UnderMaintenance: 0,
            Rates: "2499"
          }
        ]
      });
    }
    
    return data;
  };
  
  // Generate demo rooms for a room type
  const generateDemoRoomsForType = (roomType, totalRooms, availableRooms, bookedRooms) => {
    const rooms = [];
    const roomPrefix = roomType === 'duelex room' ? 'DLX' : 'STE';
    
    for (let i = 1; i <= totalRooms; i++) {
      const roomNumber = `${roomPrefix}${String(i).padStart(3, '0')}`;
      const isBooked = i <= bookedRooms;
      
      rooms.push({
        id: `${roomType.replace(' ', '_')}_${i}`,
        name: `${roomType} ${roomNumber}`,
        code: roomNumber,
        status: isBooked ? 'occupied' : 'available',
        price: roomType === 'duelex room' ? '3199' : '2499',
        minNights: 1,
        maxOccupancy: roomType === 'duelex room' ? 4 : 2,
        amenities: roomType === 'duelex room' 
          ? ['King Bed', 'Living Area', 'Kitchenette', 'Balcony', 'WiFi', 'AC']
          : ['Queen Bed', 'Work Desk', 'Mini Bar', 'WiFi', 'AC'],
        guestInfo: isBooked ? {
          guestName: `Guest ${i}`,
          checkIn: '2025-09-26',
          checkOut: '2025-09-28',
          adults: 2,
          children: 0
        } : null
      });
    }
    
    return rooms;
  };
  
  // Transform new API format to calendar format (with special rate support)
  const transformApiDataToCalendarFormat = (apiData) => {
    const calendarData = {};
    apiData.forEach(dayData => {
      const dateKey = dayData.date;
      calendarData[dateKey] = {};
      dayData.RoomType.forEach(roomType => {
        // Find the rate for this date (should be only one)
        const rate = roomType.Rate && roomType.Rate.length > 0 ? roomType.Rate[0] : null;
        calendarData[dateKey][roomType.Type] = {
          totalRooms: roomType.TotalnoofRooms,
          availableRooms: roomType.AvailableRooms,
          bookedRooms: roomType.BookedRooms,
          underMaintenance: roomType.UnderMaintenance,
          basePrice: rate ? rate.price : roomType.Rates,
          hasSpecialRate: rate ? rate.hasSpecialRate : false,
          specialRateName: rate && rate.hasSpecialRate ? rate.specialRateName : null,
          originalPrice: rate && rate.hasSpecialRate ? rate.originalPrice : null,
          finalPrice: rate && rate.hasSpecialRate ? rate.finalPrice : null,
          specialRateType: rate && rate.hasSpecialRate ? rate.specialRateType : null,
          specialRateKind: rate && rate.hasSpecialRate ? rate.specialRateKind : null,
          discountAmount: rate && rate.hasSpecialRate ? rate.discountAmount : null,
          discount: rate && rate.hasSpecialRate ? rate.discount : null,
          specialRateId: rate && rate.hasSpecialRate ? rate.specialRateId : null,
          isGlobalOffer: rate && rate.hasSpecialRate ? rate.isGlobalOffer : null,
          IsRoomTypeActive: true,
          // Use actual room data from API
          rooms: roomType.Rooms ? roomType.Rooms.map(room => ({
            id: room.roomId,
            name: room.roomName,
            code: room.roomId,
            status: room.Avilability && room.Avilability.length > 0 ? room.Avilability[0].status : 'available',
            price: rate ? (rate.hasSpecialRate ? rate.finalPrice : rate.price) : '',
            minNights: 1, // Placeholder, replace if available
            maxOccupancy: 2, // Placeholder, replace if available
            amenities: [], // Placeholder, replace if available
            guestInfo: null // Placeholder, replace if available
          })) : []
        };
      });
    });
    return calendarData;
  };
  
  // Extract room types from transformed data
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

  const handleDateClick = (dayInfo) => {
    if (dayInfo && !dayInfo.isPast) {
      setSelectedDate(dayInfo);
    }
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
    console.log('Saving price:', editingPrice, 'for room:', roomId, 'on date:', dateKey);
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
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-lg ${
                showFilters ? 'bg-gray-100 text-gray-900' : 'text-gray-700 bg-white hover:bg-gray-50'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
            >
              <Filter className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button 
              onClick={() => setShowSpecialRateModal(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors"
            >
              <Target className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Special Rate</span>
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
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
              
              <div className="flex items-center space-x-3">
                <Utensils className="h-4 w-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Meal Plan:</label>
                <select
                  value={selectedMealPlan}
                  onChange={(e) => setSelectedMealPlan(e.target.value)}
                  className="block w-full sm:w-48 pl-3 pr-10 py-2.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm"
                >
                  {mealPlans.map(plan => (
                    <option key={plan.value} value={plan.value}>{plan.label}</option>
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
              {/* Week Headers */}
              <div className="grid grid-cols-7 gap-px mb-2">
                {weekDays.map((day) => (
                  <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day.slice(0, 1)}</span>
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {calendar.map((dayInfo, index) => (
                  <div
                    key={index}
                    onClick={() => handleDateClick(dayInfo)}
                    className={(() => {
  if (!dayInfo) return 'min-h-20 sm:min-h-28 bg-gray-50 p-2';
  let base = 'min-h-20 sm:min-h-28 p-2 transition-all duration-200';
  let color = 'bg-white';
  let ring = '';
  if (dayInfo.isPast) {
    color = 'bg-gray-50 opacity-60 pointer-events-none';
  } else if (dayInfo.data && dayInfo.data[selectedRoomType]?.hasSpecialRate) {
    const kind = dayInfo.data[selectedRoomType].specialRateKind;
    if (kind === 'offer') {
      color = 'bg-violet-50';
      ring = 'ring-1 ring-violet-200';
    } else if (kind === 'peak') {
      color = 'bg-amber-50';
      ring = 'ring-1 ring-amber-200';
    } else if (kind === 'custom') {
      color = 'bg-slate-50';
      ring = 'ring-1 ring-slate-200';
    }
  } else if (dayInfo.isToday) {
    color = 'bg-blue-50';
    ring = 'ring-2 ring-blue-300';
  } else if (dayInfo.isWeekend) {
    color = 'bg-orange-50';
  }
  let cursor = !dayInfo.isPast ? 'cursor-pointer' : '';
  return `${base} ${color} ${ring} ${cursor}`;
})()}
                  >
                    {dayInfo && (
                      <div className="h-full flex flex-col">
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
                              {dayInfo.data[selectedRoomType].hasSpecialRate ? (() => {
  const kind = dayInfo.data[selectedRoomType].specialRateKind;
  let badgeClass = 'bg-gray-200 text-gray-800';
  let priceClass = 'text-green-700';
  let originalClass = 'text-gray-500';
  if (kind === 'offer') {
    badgeClass = 'bg-violet-100 text-violet-800';
    priceClass = 'text-green-700';
    originalClass = 'text-violet-700';
  } else if (kind === 'peak') {
    badgeClass = 'bg-orange-100 text-orange-800';
    priceClass = 'text-orange-700';
    originalClass = 'text-orange-700';
  }
  return (
    <div className="mt-1 text-center">
      <span className={`font-bold text-sm line-through mr-1 ${originalClass}`}>₹{Number(dayInfo.data[selectedRoomType].originalPrice).toLocaleString()}</span>
      <span className={`font-bold text-sm ${priceClass}`}>₹{Number(dayInfo.data[selectedRoomType].finalPrice).toLocaleString()}</span>
      <span className={`ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs ${badgeClass}`}>
        {dayInfo.data[selectedRoomType].specialRateName}
      </span>
    </div>
  );
})() : (
  dayInfo.data[selectedRoomType].basePrice && (
    <div className="mt-1 text-center">
      <span className="font-bold text-sm">₹{Number(dayInfo.data[selectedRoomType].basePrice).toLocaleString()}</span>
    </div>
  )
)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedDate.date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
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
    </div>
  );
};

export default PMSInventory;