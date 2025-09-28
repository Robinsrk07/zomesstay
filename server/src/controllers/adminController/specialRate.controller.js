const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const SpecialRateController = {
  
 createSpecialRate: async (req, res) => {
  try {
    let {
      kind, 
      name, 
      description, 
      propertyId, 
      dateFrom, 
      dateTo,
      pricingMode, 
      flatPrice, 
      percentAdj, 
      conflictPolicy, 
      priority,
      minNights, 
      maxBookings, 
      tags, 
      conditions, 
      metadata,
      roomTypeLinks // Array of room type specific overrides
    } = req.body;

    console.log(req.body)
    // Clean up field names (remove trailing spaces)
    kind = kind || req.body['kind '] || 'custom';
    
    // Parse JSON strings if needed

      if (req.body.roomTypeLinks && typeof req.body.roomTypeLinks === 'string') {
    try {
      req.body.roomTypeLinks = JSON.parse(req.body.roomTypeLinks);
    } catch (e) {
      // Keep as string, let controller handle the error
    }
  }
    try {
      if (typeof roomTypeLinks === 'string' && roomTypeLinks.trim()) {
        roomTypeLinks = JSON.parse(roomTypeLinks.trim());
      }
      if (typeof tags === 'string' && tags.trim()) {
        tags = JSON.parse(tags.trim());
      }
      if (typeof conditions === 'string' && conditions.trim()) {
        conditions = JSON.parse(conditions.trim());
      }
      if (typeof metadata === 'string' && metadata.trim()) {
        metadata = JSON.parse(metadata.trim());
      }
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON format in roomTypeLinks, tags, conditions, or metadata'
      });
    }

    // Clean up empty strings and convert to proper types
    priority = priority && priority !== '' ? parseInt(priority) : 1;
    minNights = minNights && minNights !== '' ? parseInt(minNights) : 1;
    maxBookings = maxBookings && maxBookings !== '' ? parseInt(maxBookings) : null;
    conflictPolicy = conflictPolicy && conflictPolicy !== '' ? conflictPolicy : 'override';
    
    // Ensure roomTypeLinks is an array
    if (!Array.isArray(roomTypeLinks)) {
      roomTypeLinks = [];
    }

    const createdBy = "b572d42e-489d-42a7-a5f7-2d2c8839a809";

    // Basic validation
    if (!name || !propertyId || !dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing: name, propertyId, dateFrom, dateTo, pricingMode'
      });
    }

    // Date validation
    if (new Date(dateFrom) >= new Date(dateTo)) {
      return res.status(400).json({
        success: false,
        message: 'dateFrom must be before dateTo'
      });
    }

    // Pricing validation
    if (pricingMode === 'flat' && !flatPrice) {
      return res.status(400).json({
        success: false,
        message: 'flatPrice required when pricingMode is flat'
      });
    }

    if (pricingMode === 'percent' && (percentAdj === undefined || percentAdj === null)) {
      return res.status(400).json({
        success: false,
        message: 'percentAdj required when pricingMode is percent'
      });
    }

    // Verify property exists and belongs to the host
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        isDeleted: false
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or access denied'
      });
    }

    // Check for duplicate special rate names within the property
    const existingRate = await prisma.specialRate.findFirst({
      where: {
      propertyId,
      name:name.trim(),
        isDeleted: false,
      },
      include:{
        roomTypeLinks: true
      }
    });


        const PropertyRoomTypes = await prisma.propertyRoomType.findMany({
          where: {
            propertyId,
            isDeleted: false
          },
          select: { id: true }
        });
        console.log(PropertyRoomTypes)

   
    if (existingRate) {
      return res.status(400).json({
        success: false,
        message: 'A special rate with this name already exists for this property'
      });
    }

    // Create the special rate with room type links
    const specialRate = await prisma.specialRate.create({
      data: {
        kind: kind , // Default to custom if not provided
        name,
        description,
        propertyId,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        pricingMode,
        flatPrice: pricingMode === 'flat' ? parseFloat(flatPrice) : null,
        percentAdj: pricingMode === 'percent' ? parseFloat(percentAdj) : null,
        conflictPolicy: conflictPolicy || 'override',
        priority: priority || 1,
        minNights: minNights || 1,
        maxBookings: maxBookings ? parseInt(maxBookings) : null,
        tags: tags || null,
        conditions: conditions || null,
        metadata: metadata || null,
        createdBy,
        // Create room type links if provided
        roomTypeLinks: roomTypeLinks && roomTypeLinks.length > 0 ? {
          create: roomTypeLinks.map(link => ({
            propertyRoomTypeId: link.propertyRoomTypeId,
            pricingMode: link.pricingMode || pricingMode, // Fall back to global pricing mode
            flatPrice: link.pricingMode === 'flat' ? parseFloat(link.flatPrice) : null,
            percentAdj: link.pricingMode === 'percent' ? parseFloat(link.percentAdj) : null,
            isActive: link.isActive !== undefined ? link.isActive : true
          }))
        } : undefined
      },
      include: {
        property: { 
          select: { 
            title: true // Changed from 'name' to 'title' as per schema
          } 
        },
        creator: { 
          select: { 
            firstName: true, 
            lastName: true 
          } 
        },
        roomTypeLinks: {
          include: {
            propertyRoomType: {
              include: {
                roomType: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Special rate created successfully',
      data: specialRate
    });

  } catch (error) {
    console.error('Create Special Rate Error:', error);
    
    // Handle Prisma-specific errors
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'A special rate with this name already exists for this property'
      });
    }

    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reference - check propertyId or propertyRoomTypeId'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
},
  
  // 📋 READ - Get all special rates
  getSpecialRates: async (req, res) => {
    try {
      const { propertyId } = req.params;
      const { 
        status = 'all', // 'active', 'inactive', 'expired', 'upcoming', 'all'
        page = 1, 
        limit = 10,
        search
      } = req.query;
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const currentDate = new Date();
      
      let whereClause = {
        propertyId,
        isDeleted: false
      };
      
      // Status filtering
      switch (status) {
        case 'active':
          whereClause.isActive = true;
          whereClause.dateFrom = { lte: currentDate };
          whereClause.dateTo = { gte: currentDate };
          break;
        case 'inactive':
          whereClause.isActive = false;
          break;
        case 'expired':
          whereClause.dateTo = { lt: currentDate };
          break;
        case 'upcoming':
          whereClause.dateFrom = { gt: currentDate };
          break;
      }
      
      // Search filtering
      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      const [specialRates, totalCount] = await Promise.all([
        prisma.specialRate.findMany({
          where: whereClause,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            property: { select: { title: true } },
          }
        }),
        prisma.specialRate.count({ where: whereClause })
      ]);
      
      res.json({
        success: true,
        data: specialRates,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNext: skip + parseInt(limit) < totalCount,
          hasPrev: parseInt(page) > 1
        }
      });
      
    } catch (error) {
      console.error('Get Special Rates Error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },
  
  // 👁️ READ - Get single special rate
  getSpecialRateById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const specialRate = await prisma.specialRate.findFirst({
        where: { id, isDeleted: false },
        include: {
          property: { select: { name: true } },
          creator: { select: { firstName: true, lastName: true, email: true } }
        }
      });
      
      if (!specialRate) {
        return res.status(404).json({
          success: false,
          message: 'Special rate not found'
        });
      }
      
      res.json({
        success: true,
        data: specialRate
      });
      
    } catch (error) {
      console.error('Get Special Rate Error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },
  
  // ✏️ UPDATE - Edit special rate
  updateSpecialRate: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Check if exists
      const existingRate = await prisma.specialRate.findFirst({
        where: { id, isDeleted: false }
      });
      
      if (!existingRate) {
        return res.status(404).json({
          success: false,
          message: 'Special rate not found'
        });
      }
      
      // Validation for date changes
      if (updateData.dateFrom && updateData.dateTo) {
        if (new Date(updateData.dateFrom) >= new Date(updateData.dateTo)) {
          return res.status(400).json({
            success: false,
            message: 'dateFrom must be before dateTo'
          });
        }
      }
      
      // Clean update data
      const allowedFields = [
        'name', 'description', 'roomTypes', 'dateFrom', 'dateTo',
        'pricingMode', 'flatPrice', 'percentAdj', 'conflictPolicy',
        'priority', 'minNights', 'maxBookings', 'tags', 'conditions',
        'metadata', 'isActive'
      ];
      
      const cleanedData = {};
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          cleanedData[field] = updateData[field];
        }
      });
      
      // Convert dates if provided
      if (cleanedData.dateFrom) cleanedData.dateFrom = new Date(cleanedData.dateFrom);
      if (cleanedData.dateTo) cleanedData.dateTo = new Date(cleanedData.dateTo);
      
      const updatedRate = await prisma.specialRate.update({
        where: { id },
        data: cleanedData,
        include: {
          property: { select: { name: true } },
          creator: { select: { firstName: true, lastName: true } }
        }
      });
      
      res.json({
        success: true,
        message: 'Special rate updated successfully',
        data: updatedRate
      });
      
    } catch (error) {
      console.error('Update Special Rate Error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },
  
  // 🗑️ DELETE - Soft delete special rate
  deleteSpecialRate: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Input validation
      if (!id || id.length !== 36) {
        return res.status(400).json({
          success: false,
          message: 'Valid special rate ID is required'
        });
      }
      
      // Check if exists and not already deleted
      const existingRate = await prisma.specialRate.findFirst({
        where: { id, isDeleted: false },
        select: { 
          id: true, 
          name: true, 
          isActive: true,
          dateFrom: true,
          dateTo: true,
          usageCount: true
        }
      });
      
      if (!existingRate) {
        return res.status(404).json({
          success: false,
          message: 'Special rate not found or already deleted'
        });
      }
      
      // Check if rate is currently active (optional business rule)
      const currentDate = new Date();
      const isCurrentlyActive = existingRate.isActive && 
                               existingRate.dateFrom <= currentDate && 
                               existingRate.dateTo >= currentDate;
      
      if (isCurrentlyActive && existingRate.usageCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete active special rate that has been used. Consider disabling it instead.',
          suggestion: 'Use toggle endpoint to disable this rate'
        });
      }
      
      // Perform soft delete
      const deletedRate = await prisma.specialRate.update({
        where: { id },
        data: { 
          isDeleted: true,
          isActive: false,
          updatedAt: new Date()
        },
        select: {
          id: true,
          name: true,
          isDeleted: true,
          isActive: true
        }
      });
      
      res.json({
        success: true,
        message: `Special rate "${existingRate.name}" deleted successfully`,
        data: {
          id: deletedRate.id,
          name: existingRate.name,
          deletedAt: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('Delete Special Rate Error:', error);
      
      // Handle specific Prisma errors
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Special rate not found'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },
  
  // 🔄 TOGGLE - Enable/Disable special rate
  toggleSpecialRate: async (req, res) => {
    try {
      const { id } = req.params;
      
      const existingRate = await prisma.specialRate.findFirst({
        where: { id, isDeleted: false },
        select: { id: true, name: true, isActive: true }
      });
      
      if (!existingRate) {
        return res.status(404).json({
          success: false,
          message: 'Special rate not found'
        });
      }
      
      const updatedRate = await prisma.specialRate.update({
        where: { id },
        data: { 
          isActive: !existingRate.isActive,
          updatedAt: new Date()
        },
        select: { id: true, name: true, isActive: true }
      });
      
      res.json({
        success: true,
        message: `Special rate "${updatedRate.name}" ${updatedRate.isActive ? 'enabled' : 'disabled'} successfully`,
        data: {
          id: updatedRate.id,
          name: updatedRate.name,
          isActive: updatedRate.isActive
        }
      });
      
    } catch (error) {
      console.error('Toggle Special Rate Error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },
 
};

module.exports = SpecialRateController;