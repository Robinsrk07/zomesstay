const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Save PropertyRoomTypeMealPlan data
const savePropertyRoomTypeMealPlans = async (req, res) => {
  try {
    const { propertyId, ratePlans } = req.body;

    // Validation
    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required'
      });
    }

    if (!ratePlans || !Array.isArray(ratePlans) || ratePlans.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rate plans array is required and cannot be empty'
      });
    }

    // Validate each rate plan
    for (const plan of ratePlans) {
      const { propertyRoomTypeId, mealPlan, groupOccupancyPrice, doubleOccupancyPrice, singleOccupancyPrice, extraBedPriceAdult, extraBedPriceChild, extraBedPriceInfant } = plan;

      if (!propertyRoomTypeId) {
        return res.status(400).json({
          success: false,
          message: 'PropertyRoomTypeId is required for each rate plan'
        });
      }

      if (!mealPlan) {
        return res.status(400).json({
          success: false,
          message: 'Meal plan is required for each rate plan'
        });
      }

      // Validate that at least one price is provided
      if (!doubleOccupancyPrice && !groupOccupancyPrice && !singleOccupancyPrice && !extraBedPriceAdult && !extraBedPriceChild) {
        return res.status(400).json({
          success: false,
          message: 'At least one price must be provided for each rate plan'
        });
      }

      // Validate price values (must be positive numbers)
      const prices = [doubleOccupancyPrice, groupOccupancyPrice, singleOccupancyPrice, extraBedPriceAdult, extraBedPriceChild, extraBedPriceInfant];
      for (const price of prices) {
        if (price !== undefined && price !== null && price !== '') {
          const numPrice = parseFloat(price);
          if (isNaN(numPrice) || numPrice < 0) {
            return res.status(400).json({
              success: false,
              message: 'All prices must be valid positive numbers'
            });
          }
        }
      }
    }

    // Check if property exists and belongs to the user
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        isDeleted: false
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      const savedPlans = [];

      for (const plan of ratePlans) {
        const { propertyRoomTypeId, mealPlan, doubleOccupancyPrice, groupOccupancyPrice, singleOccupancyPrice, extraBedPriceAdult, extraBedPriceChild, extraBedPriceInfant } = plan;

        // Check if PropertyRoomType exists
        const propertyRoomType = await tx.propertyRoomType.findFirst({
          where: {
            id: propertyRoomTypeId,
            propertyId: propertyId
          }
        });

        if (!propertyRoomType) {
          throw new Error(`PropertyRoomType with ID ${propertyRoomTypeId} not found for this property`);
        }

        // Check if MealPlan exists
        const mealPlanRecord = await tx.mealPlan.findFirst({
          where: {
            id: mealPlan,
            isDeleted: false
          }
        });

        if (!mealPlanRecord) {
          throw new Error(`MealPlan with ID ${mealPlan} not found or inactive`);
        }

        // Prepare data for upsert
        const planData = {
          propertyRoomTypeId,
          mealPlanId: mealPlan,
          doubleOccupancyPrice: doubleOccupancyPrice ? parseFloat(doubleOccupancyPrice) : 0,
          singleOccupancyPrice: singleOccupancyPrice ? parseFloat(singleOccupancyPrice) : 0,
          extraBedPriceAdult: extraBedPriceAdult ? parseFloat(extraBedPriceAdult) : 0,
          extraBedPriceChild: extraBedPriceChild ? parseFloat(extraBedPriceChild) : 0,
          extraBedPriceInfant: extraBedPriceInfant ? parseFloat(extraBedPriceInfant) : 0,
          isActive: true,
          groupOccupancyPrice: groupOccupancyPrice ? parseFloat(groupOccupancyPrice) : 0,
        };

        // Upsert the PropertyRoomTypeMealPlan
        const savedPlan = await tx.propertyRoomTypeMealPlan.upsert({
          where: {
            propertyRoomTypeId_mealPlanId: {
              propertyRoomTypeId: propertyRoomTypeId,
              mealPlanId: mealPlan
            }
          },
          update: planData,
          create: planData
        });

        savedPlans.push(savedPlan);
      }

      return savedPlans;
    });

    return res.status(200).json({
      success: true,
      message: 'Rate plans saved successfully',
      data: {
        savedCount: result.length,
        plans: result
      }
    });

  } catch (error) {
    console.error('Error saving PropertyRoomTypeMealPlans:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get PropertyRoomTypeMealPlans for a property
const getPropertyRoomTypeMealPlans = async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required'
      });
    }

    // Get all PropertyRoomTypeMealPlans for the property
    const plans = await prisma.propertyRoomTypeMealPlan.findMany({
      where: {
        propertyRoomType: {
          propertyId: propertyId
        },
        isActive: true
      },
      include: {
        propertyRoomType: {
          include: {
            roomType: true
          }
        },
        mealPlan: true
      }
    });

    return res.status(200).json({
      success: true,
      data: plans
    });

  } catch (error) {
    console.error('Error fetching PropertyRoomTypeMealPlans:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete PropertyRoomTypeMealPlan
const deletePropertyRoomTypeMealPlan = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      });
    }

    const deletedPlan = await prisma.propertyRoomTypeMealPlan.update({
      where: { id },
      data: { isActive: false }
    });

    return res.status(200).json({
      success: true,
      message: 'Rate plan deleted successfully',
      data: deletedPlan
    });

  } catch (error) {
    console.error('Error deleting PropertyRoomTypeMealPlan:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  savePropertyRoomTypeMealPlans,
  getPropertyRoomTypeMealPlans,
  deletePropertyRoomTypeMealPlan
};
