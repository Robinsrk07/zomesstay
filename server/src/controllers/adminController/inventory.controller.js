const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// "2025-09-29T00:00:00.000Z" -> "2025-09-29"
const toYMD = (d) =>
  (d instanceof Date ? d : new Date(d))
    .toISOString()
    .slice(0, 10);



const AvailabilityController = {
  getAvailability: async (req, res) => {
    const { propertyId } = req.params;
    const { startDate, endDate } = req.query;

    if (!propertyId ) {
      return res.status(400).json({
        message: 'Property ID, start date, and end date are required'
      });
    }

    try {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          id: true,
          title: true,
          description: true,
          roomTypes: {
            where: { isDeleted: false },
            select: {
              id: true,
              basePrice: true,
              isActive: true,
              roomType: {
                select: { name: true }
              },

              rooms: {
                where: { isDeleted: false },
                select: {
                  id: true,
                  name: true,
                  availability: {
                    where: {
                      isDeleted: false,
                      date: {
                        gte: new Date(startDate),
                        lt: new Date(endDate),
                      },
                    },
                    select: {
                      id: true,
                      date: true,
                      status: true,
                     
                    },
                  },
                },
              },
              rates:{
                where:{ isDeleted: false, 
                  date: {
                        gte: new Date(startDate),
                        lt: new Date(endDate),
                      }},
                select:{
                  id:true,
                  date:true,
                  price:true,
                  isOpen:true,
                }
              }
            },
          },
        },
      });

      const specialRates = await prisma.specialRate.findMany({
        where: { propertyId: propertyId, isDeleted: false },
        select:{
          kind:true,
          propertyId:true,
          name:true,
          dateFrom:true,
          dateTo:true,
          pricingMode:true,
          flatPrice:true,
          percentAdj:true,
          roomTypeLinks:{
            select:{
              propertyRoomTypeId:true,
              pricingMode:true,
              flatPrice:true,
              percentAdj:true
            }
              }}
      })


   



      console.log("specialRates",specialRates)
     const getRoomTypes =property.roomTypes.map((roomType)=>{
        return  roomType.roomType.name
     })

     const getDates =property.roomTypes.flatMap((roomType)=>
        roomType.rooms.flatMap((room)=>
          room.availability.map((avail)=>avail.date.toISOString().split('T')[0])
        )
     )  
   
     const uniqueDates = [...new Set(getDates)];
     const Dates = uniqueDates.sort((a,b)=> new Date (a) - new Date(b))
     const data = Dates.map((date)=>{
      return{date,RoomType:property.roomTypes.map((roomType)=>{return {Type: roomType?.roomType?.name ,
        PropertyRoomTypeId:roomType?.id,
        TotalnoofRooms: roomType?.rooms?.length,AvailableRooms: roomType?.rooms?.filter((room)=>
        room.availability.some((avail)=>toYMD(avail.date)===date && avail.status==='available')
      ).length,
      BookedRooms: roomType?.rooms?.filter((room)=>
        room.availability.some((avail)=>toYMD(avail.date)===date && avail.status==='booked')
      ).length,UnderMaintenance: roomType?.rooms?.filter((room)=>
        room.availability.some((avail)=>toYMD(avail.date)===date && avail.status==='maintenance')
      ).length ,
      Rooms: roomType?.rooms?.map((room)=>{return{roomId:room.id,roomName:room.name,Avilability:room.availability.filter((avail)=>toYMD(avail.date)===date).map((a)=>{return{availabilityId:a.id,date:toYMD(a.date),status:a.status}}),

    }}),
        Rate:roomType?.rates.filter((rate)=>toYMD(rate.date)===date).map((r)=>{return{rateId:r.id,price:r.price,isOpen:r.isOpen,date: toYMD(r.date)}})
        }
     })}
    })


 
function applySpecialRates(responseData) {
    const { data, specialRates } = responseData;
    
    // Process each date in the data
    data.forEach(dateEntry => {
        const currentDate = new Date(dateEntry.date);
        
        dateEntry.RoomType.forEach(roomType => {
            // Find applicable special rates for this room type and date
            const applicableRates = specialRates.filter(specialRate => {
                const dateFrom = new Date(specialRate.dateFrom);
                const dateTo = new Date(specialRate.dateTo);
                
                // Check if current date is within special rate period
                const isDateInRange = currentDate >= dateFrom && currentDate <= dateTo;
                
                // Check if room type has special rate configuration OR if it's a global rate
                const hasRoomTypeConfig = specialRate.roomTypeLinks.length === 0 || 
                    specialRate.roomTypeLinks.some(link => link.propertyRoomTypeId === roomType.PropertyRoomTypeId);
                
                return isDateInRange && hasRoomTypeConfig;
            });

            console.log("applicableRates",applicableRates)
            
            // Apply special rates to the Rate array
            roomType.Rate.forEach(rate => {
                if (applicableRates.length > 0) {
                    applicableRates.forEach(specialRate => {
                        // For global offers (empty roomTypeLinks), use the special rate's global settings
                        if (specialRate.roomTypeLinks.length === 0) {
                            // Calculate special price using global pricing settings
                            let specialPrice = parseFloat(rate.price);
                            
                            if (specialRate.pricingMode === 'percent') {
                                const adjustment = parseFloat(specialRate.percentAdj);
                                if (specialRate.kind === 'peak') {
                                    // Peak: INCREASE price by percentage
                                    specialPrice = specialPrice * (1 + adjustment / 100);
                                } else if (specialRate.kind === 'offer') {
                                    // Offer: DECREASE price by percentage (discount)
                                    specialPrice = specialPrice * (1 - adjustment / 100);
                                }
                            } else if (specialRate.pricingMode === 'flat' && specialRate.flatPrice) {
                                if (specialRate.kind === 'peak') {
                                    // Peak: ADD flat amount to existing price
                                    specialPrice = specialPrice + parseFloat(specialRate.flatPrice);
                                } else {
                                    // Offer: SET to flat price
                                    specialPrice = specialPrice - parseFloat(specialRate.flatPrice);
                                }
                            }
                            
                            // Add special rate fields for global offer
                            rate.hasSpecialRate = true;
                            rate.specialRateName = specialRate.name;
                            rate.originalPrice = rate.price;
                            rate.finalPrice = specialPrice.toFixed(2);
                            rate.specialRateType = specialRate.pricingMode;
                            rate.specialRateKind = specialRate.kind;
                            
                            if (specialRate.kind === 'offer') {
                                rate.discountAmount = (parseFloat(rate.price) - specialPrice).toFixed(2);
                                rate.discount = specialRate.pricingMode === 'percent' ? specialRate.percentAdj : null;
                            } else if (specialRate.kind === 'peak') {
                                rate.surchargeAmount = (specialPrice - parseFloat(rate.price)).toFixed(2);
                                rate.peakIncrease = specialRate.pricingMode === 'percent' ? specialRate.percentAdj : null;
                            }
                            
                            rate.specialRateId = specialRate.propertyId;
                            rate.isGlobalOffer = true;
                            
                        } else {
                            // Handle room-specific offers
                            const roomTypeLink = specialRate.roomTypeLinks.find(
                                link => link.propertyRoomTypeId === roomType.PropertyRoomTypeId
                            );
                            
                            if (roomTypeLink) {
                                // Calculate special price based on room-specific pricing mode
                                let specialPrice = parseFloat(rate.price);
                                
                                if (roomTypeLink.pricingMode === 'percent') {
                                    const adjustment = parseFloat(roomTypeLink.percentAdj);
                                    if (specialRate.kind === 'peak') {
                                        // Peak: INCREASE price by percentage
                                        specialPrice = specialPrice * (1 + adjustment / 100);
                                    } else if (specialRate.kind === 'offer') {
                                        // Offer: DECREASE price by percentage (discount)
                                        specialPrice = specialPrice * (1 - adjustment / 100);
                                    }
                                } else if (roomTypeLink.pricingMode === 'flat' && roomTypeLink.flatPrice) {
                                    if (specialRate.kind === 'peak') {
                                        // Peak: ADD flat amount to existing price
                                        specialPrice = specialPrice + parseFloat(roomTypeLink.flatPrice);
                                    } else {
                                        // Offer: SET to flat price
                                        specialPrice = parseFloat(roomTypeLink.flatPrice);
                                    }
                                }
                                
                                // Add special rate fields for room-specific offer
                                rate.hasSpecialRate = true;
                                rate.specialRateName = specialRate.name;
                                rate.originalPrice = rate.price;
                                rate.finalPrice = specialPrice.toFixed(2);
                                rate.specialRateType = roomTypeLink.pricingMode;
                                rate.specialRateKind = specialRate.kind;
                                
                                if (specialRate.kind === 'offer') {
                                    rate.discountAmount = (parseFloat(rate.price) - specialPrice).toFixed(2);
                                    rate.discount = roomTypeLink.pricingMode === 'percent' ? roomTypeLink.percentAdj : null;
                                } else if (specialRate.kind === 'peak') {
                                    rate.surchargeAmount = (specialPrice - parseFloat(rate.price)).toFixed(2);
                                    rate.peakIncrease = roomTypeLink.pricingMode === 'percent' ? roomTypeLink.percentAdj : null;
                                }
                                
                                rate.specialRateId = specialRate.propertyId;
                                rate.isGlobalOffer = false;
                            }
                        }
                    });
                } else {
                    // If no special rates apply, mark as regular rate
                    rate.hasSpecialRate = false;
                }
            });
        });
    });
    
    return responseData;
}

    

   const getfinalData = applySpecialRates({data,specialRates});


      return res.json({data,specialRates,getfinalData});
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: 'Error fetching property',
        error: error.message,
      });
    }
  },
};

module.exports = AvailabilityController;
