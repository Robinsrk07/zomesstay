const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Date helpers
const dayUTC = (dateStr) => {
  const d = new Date(dateStr);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const diffNights = (start, end) => {
  const a = dayUTC(start);
  const b = dayUTC(end);
  return Math.ceil((b - a) / (1000 * 60 * 60 * 24));
};

const eachDateUTC = (start, end) => {
  const dates = [];
  const curr = dayUTC(start);
  const last = dayUTC(end);
  while (curr < last) {
    dates.push(new Date(curr));
    curr.setUTCDate(curr.getUTCDate() + 1);
  }
  return dates;
};

// Fetch available properties with room availability
async function fetchAvailableProperties(startDate, endDate, guestNeeds, totalBedsNeeded) {

  const availableRoomIds = await fetchAvailableRoomIds(startDate, endDate);
  
  // 2. Find properties with enough total capacity
  const properties = await prisma.property.findMany({
    where: {
      isDeleted: false,
      status: 'active',
      roomTypes: {
        some: {
          isDeleted: false,
          isActive: true,
          rooms: {
            some: {
              id: { in: Array.from(availableRoomIds) },
              isDeleted: false,
              status: 'active'
            }
          }
        }
      }
    },
    include: {
      roomTypes: {
        where: {
          isDeleted: false,
          isActive: true
        },
        select: {
          id: true,
          Occupancy: true,
          extraBedCapacity: true,
          rooms: {
            where: {
              id: { in: Array.from(availableRoomIds) },
              isDeleted: false,
              status: 'active'
            },
            select: {
              id: true
            }
          }
        }
      },
      // Include other property relations as needed
      amenities: {
        where: { isDeleted: false },
        include: { amenity: true }
      },
      facilities: {
        where: { isDeleted: false },
        include: { facility: true }
      },
      safeties: {
        where: { isDeleted: false },
        include: { safety: true }
      },
      media: {
        where: { isDeleted: false }
      }
    }
  });

  // 3. Filter properties that have enough total capacity
  const validProperties = properties.filter(property => {
    const totalCapacity = property.roomTypes.reduce((sum, rt) => {
      const roomTypeCapacity = (rt.Occupancy + rt.extraBedCapacity) * rt.rooms.length;
      return sum + roomTypeCapacity;
    }, 0);

    console.log(`Property ${property.id} capacity:`, totalCapacity, 'needed:', totalBedsNeeded);
    return totalCapacity >= totalBedsNeeded;
  });

  return validProperties;
}

// Fetch available room IDs for the given date range
async function fetchAvailableRoomIds(startDate, endDate) {
  
  // First get active properties and their active rooms
  const activePropertiesWithRooms = await prisma.property.findMany({
    where: {
      isDeleted: false,
      status: 'active',
      roomTypes: {
        some: {
          isDeleted: false,
          isActive: true,
          rooms: {
            some: {
              isDeleted: false,
              status: 'active'
            }
          }
        }
      }
    },
    select: {
      roomTypes: {
        where: {
          isDeleted: false,
          isActive: true
        },
        select: {
          rooms: {
            where: {
              isDeleted: false,
              status: 'active'
            },
            select: {
              id: true
            }
          }
        }
      }
    }
  });


  console.log(activePropertiesWithRooms)
  

  // Get all valid room IDs
  const validRoomIds = new Set(
    activePropertiesWithRooms.flatMap(p => 
      p.roomTypes.flatMap(rt => 
        rt.rooms.map(r => r.id)
      )
    )
  );

  console.log('\nValid Room IDs:', {
    totalRooms: validRoomIds.size,
    ids: Array.from(validRoomIds)
  });

  // Check availability
  console.log('\n=== Step 2 - Checking Availability ===');
  console.log('Date Range:', { startDate, endDate });
  
  const availableRooms = await prisma.availability.groupBy({
    by: ['roomId'],
    where: {
      roomId: { in: Array.from(validRoomIds) },
      date: {
        gte: startDate,
        lt: endDate
      },
      status: 'available',
      isDeleted: false
    },
    having: {
      roomId: {
        _count: {
          equals: diffNights(startDate, endDate)
        }
      }
    }
  });

  console.log('\nAvailable Rooms:', {
    totalAvailable: availableRooms.length,
    rooms: availableRooms
  });

  return new Set(availableRooms.map(r => r.roomId));
}



// Calculate room assignments and total price
function calculateRoomAssignments(properties, guestNeeds, infantsNeedBed, nights, dateList) {
  const results = [];

  for (const property of properties) {
    // Only process properties that have roomTypes
    if (!property.roomTypes?.length) continue;

    console.log("property", JSON.stringify(property, null, 2));

    // Calculate total capacity for the property
    const totalCapacity = property.roomTypes.reduce((sum, rt) => {
      
        return sum + (rt.extraBedCapacity + rt.Occupancy || 0);
    }, 0);

    console.log(`Property ID: ${property.id}, Total Capacity: ${totalCapacity}`);

    // Check if property can accommodate guests
    const totalGuests = guestNeeds.adults + guestNeeds.children + 
      (infantsNeedBed ? guestNeeds.infants : 0);

    if (totalCapacity >= totalGuests) {
      results.push({
        property: {
          id: property.id,
          title: property.title,
          amenities: property.amenities?.map(a => a.amenity) || [],
          facilities: property.facilities?.map(f => f.facility) || [],
          safeties: property.safeties?.map(s => s.safety) || [],
          media: property.media || [],
          location: property.location
        },
        totalCapacity,
        availableRooms: property.roomTypes.flatMap(rt => rt.rooms),
        nights
      });
    }
  }

  return results;
}

module.exports = {
  dayUTC,
  diffNights,
  eachDateUTC,
  fetchAvailableProperties,
  calculateRoomAssignments
};
       









