const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Your existing date utils
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

// Controller-specific utils
const addDaysUtc = (date, days) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

const safeJSON = (input, defaultValue) => {
  if (input === undefined || input === null) return defaultValue;
  if (Array.isArray(input)) return input;
  try {
    return typeof input === 'string' ? JSON.parse(input) : input;
  } catch {
    return defaultValue;
  }
};

const validateNumber = (value, fieldName, min = 0) => {
  const num = Number(value);
  if (isNaN(num) || num < min) {
    throw new Error(`Invalid ${fieldName}: Must be a number ≥ ${min}`);
  }
  return num;
};

// Constants
const DAYS_TO_SEED = 365;
const MAX_TRANSACTION_WAIT = 30000;
const MAX_TRANSACTION_TIMEOUT = 120000;

const propertyCreation = {
  /**
   * Create a new property with all related data
   */
  createProperty: async (req, res) => {
    try {
      const {
        title,
        description,
        rulesAndPolicies,
        status = 'active',
        propertyTypeId,
        ownerHostId,
        location,
        amenityIds,
        facilityIds,
        safetyIds,
        roomtypes,
      } = req.body;




      console.log(req.body)
      // Validate required fields
      if (!title?.trim()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Property title is required' 
        });
      }

      // Parse and validate location
      let locationData;
      try {
        locationData = typeof location === 'string' ? JSON.parse(location) : location;
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: 'Invalid location data format'
        });
      }

      if (!locationData?.address || !locationData?.coordinates) {
        return res.status(400).json({
          success: false,
          message: 'Location must include address and coordinates'
        });
      }

      // Parse and filter IDs
      const amenityList = safeJSON(amenityIds, []).filter(id => 
        id && typeof id === 'string' && id.trim()
      );
      const facilityList = safeJSON(facilityIds, []).filter(id => 
        id && typeof id === 'string' && id.trim()
      );
      const safetyList = safeJSON(safetyIds, []).filter(id => 
        id && typeof id === 'string' && id.trim()
      );

      // Parse and validate room types
      const roomTypesRaw = safeJSON(roomtypes, []);

      console.log('roomTypesRaw', roomTypesRaw);
      const roomTypeList = roomTypesRaw.filter(rt => 
        rt && 
        typeof rt === 'object' && 
        rt.roomTypeId && 
        typeof rt.roomTypeId === 'string' &&
        rt.roomTypeId.trim() !== '' &&
        rt.Occupancy !== undefined &&
        rt.Occupancy !== null &&
        !isNaN(Number(rt.Occupancy)) &&
        rt.extraBedCapacity !== undefined &&
        rt.extraBedCapacity !== null &&
        !isNaN(Number(rt.extraBedCapacity))
      );
      console.log(`Received ${roomTypesRaw.length} room types, ${roomTypeList.length} valid`);
      // Validate file uploads
      const filesByField = (req.files || []).reduce((acc, f) => {
        (acc[f.fieldname] ||= []).push(f);
        return acc;
      }, {});
      const mediaFiles = filesByField['media'] || [];

      const allowedImage = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      const allowedVideo = ['video/mp4', 'video/webm', 'video/mov'];
      const maxFileSize = 50 * 1024 * 1024;

      for (const file of mediaFiles) {
        const okType = allowedImage.includes(file.mimetype) || allowedVideo.includes(file.mimetype);
        if (!okType) {
          return res.status(400).json({ 
            success: false, 
            message: `Invalid file type: ${file.mimetype}. Only images and videos are allowed.` 
          });
        }
        if (file.size > maxFileSize) {
          return res.status(400).json({ 
            success: false, 
            message: `File too large: ${file.originalname}. Maximum size is 50MB.` 
          });
        }
      }

      console.log(`Property creation started: ${title}`);
      console.log(`Room types: ${roomTypeList.length}, Media files: ${mediaFiles.length}`);
      console.log(`Amenities: ${amenityList.length}, Facilities: ${facilityList.length}, Safety: ${safetyList.length}`);

      // Validate foreign keys exist
      const mustExist = async (model, ids, label) => {
        if (!ids.length) return;
        const rows = await model.findMany({ 
          where: { id: { in: ids }, isDeleted: false }, 
          select: { id: true } 
        });
        const foundIds = new Set(rows.map(r => r.id));
        const missing = ids.filter(id => !foundIds.has(id));
        if (missing.length) {
          throw new Error(`${label} not found: ${missing.join(', ')}`);
        }
      };

      // Validate property type
      if (propertyTypeId) {
        const propertyType = await prisma.propertyType.findFirst({ 
          where: { id: propertyTypeId, isDeleted: false }, 
          select: { id: true } 
        });
        if (!propertyType) {
          return res.status(404).json({ 
            success: false, 
            message: 'Property type not found' 
          });
        }
      }


      let  host 
      // Validate owner host
      if (ownerHostId) {
         host = await prisma.host.findFirst({ 
          where: { email: ownerHostId, isDeleted: false }, 
          select: { id: true } 
        });
        console.log('host', host);
        if (!host) {
          return res.status(404).json({ 
            success: false, 
            message: 'Owner host not found' 
          });
        }

      }

      // Validate all related entities
      await mustExist(prisma.amenity, amenityList, 'Amenity');
      await mustExist(prisma.facility, facilityList, 'Facility');
      await mustExist(prisma.safetyHygiene, safetyList, 'Safety hygiene');
      await mustExist(prisma.roomType, roomTypeList.map(rt => rt.roomTypeId), 'RoomType');

      // Validate meal plans
      const mealPlanIds = Array.from(new Set(
        roomTypeList.flatMap(rt => 
          Array.isArray(rt.mealPlans) ? rt.mealPlans.map(mp => mp.mealPlanId).filter(Boolean) : []
        )
      ));
      if (mealPlanIds.length) {
        await mustExist(prisma.mealPlan, mealPlanIds, 'MealPlan');
      }

      // Main transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create basic property
        const property = await tx.property.create({
          data: {
            title: title.trim(),
            description: description?.trim() || null,
            rulesAndPolicies: rulesAndPolicies?.trim() || null,
            status,
            propertyTypeId: propertyTypeId || null,
            ownerHostId: host.id || null,
            location: locationData,
          },
          select: { id: true }
        });

        console.log(`Created property base with ID: ${property.id}`);

        // 2. Create relations in parallel
        const relationPromises = [];

        // Amenities
        if (amenityList.length) {
          relationPromises.push(
            tx.propertyAmenity.createMany({
              data: amenityList.map(amenityId => ({
                propertyId: property.id,
                amenityId
              })),
              skipDuplicates: true
            })
          );
        }

        // Facilities
        if (facilityList.length) {
          relationPromises.push(
            tx.propertyFacility.createMany({
              data: facilityList.map(facilityId => ({
                propertyId: property.id,
                facilityId
              })),
              skipDuplicates: true
            })
          );
        }

        // Safety items
        if (safetyList.length) {
          relationPromises.push(
            tx.propertySafety.createMany({
              data: safetyList.map(safetyId => ({
                propertyId: property.id,
                safetyId
              })),
              skipDuplicates: true
            })
          );
        }

        // Media files
        if (mediaFiles.length) {
          relationPromises.push(
            tx.propertyMedia.createMany({
              data: mediaFiles.map((file, idx) => ({
                propertyId: property.id,
                url: file.url || `/uploads/${file.subdirectory || 'images'}/${file.filename}`,
                type: file.mimetype.startsWith('image') ? 'image' : 'video',
                isFeatured: idx === 0,
                order: idx,
              }))
            })
          );
        }

        // Wait for all parallel operations
        await Promise.all(relationPromises);
        console.log('Created all basic relations');

        // 3. Create room types with meal plans
        const createdRoomTypes = [];
        if (roomTypeList.length) {
          for (const [index, rt] of roomTypeList.entries()) {
            console.log(`Creating room type ${index + 1}/${roomTypeList.length}`);
             let maxOccupancy = rt.Occupancy + rt.extraBedCapacity;
            const roomTypeData = {
              propertyId: property.id,
              roomTypeId: rt.roomTypeId,           
              Occupancy: validateNumber(rt.occupancy || rt.Occupancy || 2, 'occupancy', 1),
              extraBedCapacity: validateNumber(rt.extraBedCapacity ?? 0, 'extraBedCapacity', 0),
              minOccupancy: validateNumber(rt.minOccupancy ?? 1, 'minOccupancy', 1),
              maxOccupancy: maxOccupancy,
            };

            const createdRoomType = await tx.propertyRoomType.create({
              data: roomTypeData,
            });

            createdRoomTypes.push(createdRoomType);

            
          }
        }

        // 4. Seed rate calendar in batches
        // if (createdRoomTypes.length) {
        //   const today = new Date();
        //   console.log(`Seeding rate calendar for ${DAYS_TO_SEED} days...`);

        //   for (const prt of createdRoomTypes) {
        //     // Process in batches of 30 days to avoid huge transactions
        //     for (let batchStart = 0; batchStart < DAYS_TO_SEED; batchStart += 30) {
        //       const batchSize = Math.min(30, DAYS_TO_SEED - batchStart);
        //       const batchRows = Array.from({ length: batchSize }).map((_, i) => ({
        //         propertyRoomTypeId: prt.id,
        //         date: addDaysUtc(today, batchStart + i),
        //         price: prt.basePrice,
        //         isOpen: true,
        //         isDeleted: false,
        //       }));

        //       await tx.rateCalendar.createMany({
        //         data: batchRows,
        //         skipDuplicates: true,
        //       });
        //     }
        //   }
        //   console.log('Rate calendar seeded successfully');
        // }

        // 5. Fetch complete property with all relations
        // const completeProperty = await tx.property.findUnique({
        //   where: { id: property.id },
        //   include: {
        //     propertyType: true,
        //     ownerHost: true,
        //     roomTypes: {
        //       include: {
        //         roomType: true,
        //         baseMealPlan: true,
        //         mealPlanLinks: {
        //           include: {
        //             mealPlan: true
        //           }
        //         }
        //       }
        //     },
        //     media: {
        //       orderBy: { order: 'asc' }
        //     },
        //     amenities: {
        //       include: { amenity: true }
        //     },
        //     facilities: {
        //       include: { facility: true }
        //     },
        //     safeties: {
        //       include: { safety: true }
        //     },
        //   },
        // });

        // return completeProperty;
      }, {
        maxWait: MAX_TRANSACTION_WAIT,
        timeout: MAX_TRANSACTION_TIMEOUT,
      });


      return res.status(201).json({
        success: true,
        message: 'Property created successfully with all configurations',
        data: result,
      });

    } catch (error) {
      console.error('Property creation error:', error);

      // Handle specific error cases
      if (error.code === 'P2028') {
        return res.status(408).json({
          success: false,
          message: 'Operation timed out. Please try with fewer room types or contact support.',
        });
      }

      if (error.message?.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message?.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Property with similar details already exists.',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error while creating property',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  },

  /**
   * Get property creation form data (amenities, facilities, etc.)
   */
  getCreationFormData: async (req, res) => {
    try {
      const [
        amenities,
        facilities,
        safetyHygiene,
        roomTypes,
        propertyTypes
      ] = await Promise.all([
        prisma.amenity.findMany({ where: { isDeleted: false } }),
        prisma.facility.findMany({ where: { isDeleted: false } }),
        prisma.safetyHygiene.findMany({ where: { isDeleted: false } }),
        prisma.roomType.findMany({ where: { isDeleted: false } }),
        prisma.propertyType.findMany({ where: { isDeleted: false } })
      ]);

      return res.json({
        success: true,
        data: {
          amenities,
          facilities,
          safetyHygiene,
          roomTypes,
          propertyTypes
        }
      });
    } catch (error) {
      console.error('Error fetching form data:', error);
      return res.status(500).json({
        success: false,
        message: 'Error loading property creation form data'
      });
    }
  },

  /**
   * Validate property data before creation
   */
  validatePropertyData: async (req, res) => {
    try {
      const { roomtypes, amenityIds, facilityIds, safetyIds, propertyTypeId, ownerHostId, title } = req.body;

      const errors = [];

      // Validate room types
      const roomTypesRaw = safeJSON(roomtypes, []);
      roomTypesRaw.forEach((rt, index) => {
        if (!rt.roomTypeId) {
          errors.push(`Room type ${index + 1}: roomTypeId is required`);
        }
       
        if (rt.Occupancy === undefined || rt.Occupancy === null || isNaN(Number(rt.Occupancy))) {
          errors.push(`Room type ${index + 1}: valid Occupancy is required`);
        }
        if (rt.extraBedCapacity === undefined || rt.extraBedCapacity === null || isNaN(Number(rt.extraBedCapacity))) {
          errors.push(`Room type ${index + 1}: valid extraBedCapacity is required`);
        }
      });

      // Validate IDs exist
      const validateIds = async (model, ids, fieldName) => {
        if (ids && ids.length) {
          const validIds = await model.findMany({
            where: { id: { in: ids }, isDeleted: false },
            select: { id: true }
          });
          const validIdSet = new Set(validIds.map(item => item.id));
          return ids.filter(id => !validIdSet.has(id));
        }
        return [];
      };

      const amenityList = safeJSON(amenityIds, []);
      const facilityList = safeJSON(facilityIds, []);
      const safetyList = safeJSON(safetyIds, []);

      const invalidAmenities = await validateIds(prisma.amenity, amenityList, 'amenities');
      const invalidFacilities = await validateIds(prisma.facility, facilityList, 'facilities');
      const invalidSafety = await validateIds(prisma.safetyHygiene, safetyList, 'safety items');

      if (invalidAmenities.length) errors.push(`Invalid amenities: ${invalidAmenities.join(', ')}`);
      if (invalidFacilities.length) errors.push(`Invalid facilities: ${invalidFacilities.join(', ')}`);
      if (invalidSafety.length) errors.push(`Invalid safety items: ${invalidSafety.join(', ')}`);

      // Check for duplicate property title (not deleted)
      if (title && title.trim()) {
        const existing = await prisma.property.findFirst({
          where: { title: title.trim(), isDeleted: false }
        });
        if (existing) errors.push('A property with this title already exists.');
      }

      if (propertyTypeId) {
        const validPropertyType = await prisma.propertyType.findFirst({
          where: { id: propertyTypeId, isDeleted: false }
        });
        if (!validPropertyType) errors.push('Invalid property type');
      }
      
      let  validHost
      if (ownerHostId) {
         validHost = await prisma.host.findFirst({
          where: { email: ownerHostId, isDeleted: false }
        });
        if (!validHost) errors.push('Invalid owner host');
      }

      return res.json({
        success: errors.length === 0,
        errors: errors.length ? errors : null,
        message: errors.length ? 'Validation failed' : 'All data is valid'
      });

    } catch (error) {
      console.error('Validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error validating property data'
      });
    }
  }
};

module.exports = propertyCreation;

// The error "Unique constraint failed on the constraint: Property_title_isDeleted_key" means you are trying to create a property with a title that already exists and is not marked as deleted.
// Your Prisma schema has: @@unique([title, isDeleted]) on Property.
// This means you cannot have two properties with the same title where isDeleted = false.
// To fix: Use a unique title for each property, or set isDeleted = true for the old property before creating a new one with the same title.