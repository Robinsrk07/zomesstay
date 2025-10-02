const processCalendarData = (propertyData) => {
  // Stores processed data by date: { [date]: { minRate, isAvailable, specialRate } }
  const calendarData = {};
  console.log(propertyData)

  // 1. Process each room type's rates and availability
  propertyData.roomTypes.forEach(roomType => {
    // Get dates from rates
    roomType.rates.forEach(rate => {
      const date = rate.date.split('T')[0];
      
      if (!calendarData[date]) {
        calendarData[date] = {
          minRate: Infinity,
          isAvailable: false,
          specialRate: null
        };
      }

      // Track minimum rate across all room types
      const price = Number(rate.price);
      if (price < calendarData[date].minRate) {
        calendarData[date].minRate = price;
      }

      // Check room availability
      const availableRooms = roomType.rooms.filter(room => 
        room.availability.some(a => 
          a.date.split('T')[0] === date && 
          a.status === 'available'
        )
      );

      // Mark date as available if any room is available
      if (availableRooms.length > 0) {
        calendarData[date].isAvailable = true;
      }
    });
  });

  // 2. Process special rates
  propertyData.specialRates.forEach(specialRate => {
    const startDate = new Date(specialRate.dateFrom);
    const endDate = new Date(specialRate.dateTo);
    
    // For each date in special rate range
    for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
      const date = d.toISOString().split('T')[0];
      
      if (calendarData[date]) {
        calendarData[date].specialRate = {
          kind: specialRate.kind,
          pricingMode: specialRate.pricingMode,
          flatPrice: specialRate.flatPrice,
          percentAdj: specialRate.percentAdj,
          name: specialRate.name
        };
        
        // Calculate final price with special rate
        if (specialRate.pricingMode === 'flat') {
          calendarData[date].minRate = Number(specialRate.flatPrice);
        } else if (specialRate.pricingMode === 'percent' && specialRate.percentAdj) {
          const adjustment = Number(specialRate.percentAdj);
          const originalPrice = calendarData[date].minRate;
          
          if (specialRate.kind === 'offer') {
            calendarData[date].minRate = originalPrice * (1 - adjustment/100);
          } else if (specialRate.kind === 'peak') {
            calendarData[date].minRate = originalPrice * (1 + adjustment/100);
          }
        }
      }
    }
  });

  return calendarData;
};

export default processCalendarData;
