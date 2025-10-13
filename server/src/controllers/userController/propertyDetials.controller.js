const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const PropertyDetailsController = {
    getPropertyDetails: async (req, res) => {
        try {
            const { id } = req.params;
            const { startDate, endDate } = req.query;

            const property = await prisma.property.findUnique({
                where: { 
                    id,
                    isDeleted: false,
                    status: 'active'
                },
                include: {
                    media: {
                        where: { isDeleted: false },
                        select: {
                            url: true,
                            type: true,
                            isFeatured: true,
                            order: true
                        },
                        orderBy: { order: 'asc' }
                    },
                    roomTypes: {
                        where: { 
                            isDeleted: false,
                            isActive: true
                        },
                        select: {
                            id: true,
                            basePrice: true,
                            Occupancy: true,
                            extraBedCapacity: true,
                            extraBedPriceAdult: true,
                            extraBedPriceChild: true,
                            roomType: {
                                select: { name: true }
                            },
                            rooms: {
                                where: { 
                                    isDeleted: false,
                                    status: 'active'
                                },
                                select: {
                                    id: true,
                                    name: true,
                                    code: true,
                                    images: true,
                                    availability: startDate && endDate ? {
                                        where: {
                                            date: {
                                                gte: new Date(startDate),
                                                lt: new Date(endDate)
                                            },
                                            isDeleted: false
                                        },select:{
                                            id:true,
                                            roomId:true,
                                            date:true,
                                            blockedBy:true,
                                            status:true

                                        }
                                    } : undefined
                                }
                            },
                             baseMealPlan: { 
                                select: { id: true, code: true, name: true, kind: true ,adult_price:true ,child_price:true,description:true , } 
                                },
                                mealPlanLinks: { 
                                where: { isActive: true },
                                select: {
                                    id: true,
                                    adultPrice: true,
                                    childPrice: true,
                                    mealPlan: { 
                                    select: { id: true, code: true, name: true, kind: true ,adult_price:true ,child_price:true,description:true } 
                                    },
                                }
                                },
                            rates: startDate && endDate ? {
                                where: {
                                    date: {
                                        gte: new Date(startDate),
                                        lt: new Date(endDate)
                                    },
                                    isDeleted: false
                                }
                            } : undefined
                        }
                    },
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
                    reviews: {
                        where: { isDeleted: false },
                        take: 5,
                        orderBy: { createdAt: 'desc' },
                        include: {
                            user: {
                                select: {
                                    firstname: true,
                                    lastname: true,
                                    profileImage: true
                                }
                            }
                        }
                    },
                    specialRates: {
                        where: {
                            isDeleted: false,
                            isActive: true,
                        },
                        include: {
                            roomTypeLinks: true
                        }
                    },
                    SpecialRateApplication:{
                        where:{
                            isActive: true,
                        }
                    },
                    MealPlan: {
                        where: { 
                            isDeleted: false,
                            propertyId: id 
                        },
                        select: {
                            id: true,
                            code: true,
                            name: true,
                            kind: true,
                            adult_price: true,
                            child_price: true,
                            description: true
                        }
                    }
                }
            });

            if (!property) {
                return res.status(404).json({
                    success: false,
                    message: 'Property not found'
                });
            }

            // Format the response
            const formattedProperty = {
                ...property,
                amenities: property.amenities.map(a => a.amenity),
                facilities: property.facilities.map(f => f.facility),
                safeties: property.safeties.map(s => s.safety)
            };

            return res.json({
                success: true,
                data: formattedProperty
            });

        } catch (error) {
            console.error('Error fetching property details:', error);
            return res.status(500).json({
                success: false,
                message: 'Error fetching property details',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

module.exports = PropertyDetailsController; 