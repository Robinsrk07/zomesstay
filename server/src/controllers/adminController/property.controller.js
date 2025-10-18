// controllers/PropertyController.js
const { PrismaClient, Prisma } = require('@prisma/client');
const { log, Console } = require('console');
const prisma = new PrismaClient();
const path = require('path');
const {
  dayUTC,
  diffNights,
  eachDateUTC,
  fetchAvailableProperties,
  calculateRoomAssignments
} = require('../../utils/property.utils');

/* ---------------------------- helpers ---------------------------- */
const parseJSON = (v, fallback) => {
  if (!v) return fallback;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return fallback; }
};
const parseBool = (v, def = false) =>
  v === true || v === 'true' ? true : v === false || v === 'false' ? false : def;

const toInt = (v, def = 0) => {
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? def : n;
};

const pickPagination = (req) => {
  const page = Math.max(1, toInt(req.query.page || 1, 1));
  const limit = Math.min(100, Math.max(1, toInt(req.query.limit || 10, 10)));
  return { page, limit, skip: (page - 1) * limit, take: limit };
};

const ensureNotDeleted = async (model, id, name = 'record') => {
  const entity = await model.findUnique({ where: { id } });
  if (!entity) return { error: `${name} not found` };
  if (entity.isDeleted) return { error: `${name} has been deleted` };
  return { entity };
};
function normalizeToArray(input) {
  if (input == null) return [];
  if (Array.isArray(input)) return input;
  return [input];
}

// Build a public URL from a Multer file
function fileToUrl(req, f) {
  // If your storage added relativePath, prefer that; otherwise fall back to filename
  const rel = f.relativePath ? `/uploads/${f.relativePath}` : `/uploads/${f.filename}`;
  const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
  return `${base}${rel}`;
}

const safeJSON = (str, fallback, label = '') => {
  if (!str) return fallback;
  if (typeof str === 'object') return str;
  try { 
    return JSON.parse(str); 
  } catch (err) { 
    if (label) console.error(`safeJSON parse error for ${label}:`, err.message, 'Input:', str.substring(0, 200));
    return fallback; 
  }
};

const DAYS_TO_SEED = Number(process.env.RATECALENDAR_SEED_DAYS || 180);

/** Build a UTC date with day offset to avoid DST/timezone surprises */
function addDaysUtc(base, days) {
  const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function toPlain(obj) {
  if (obj === null || obj === undefined) return obj;

  if (obj instanceof Prisma.Decimal) {
    return obj.toNumber();
  }

  if (Array.isArray(obj)) {
    return obj.map(toPlain);
  }

  if (typeof obj === 'object') {
    const result = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = toPlain(obj[key]);
      }
    }
    return result;
  }

  return obj;
}

/* -------------------------- controller -------------------------- */
const PropertyController = {
  // ========== AMENITIES ==========
  createAmenity: async (req, res) => {
    try {
      const { name, category = 'OTHER', isActive = true } = req.body;
      const icon = req.file ? `/uploads/images/${req.file.filename}` : null;

      const amenity = await prisma.amenity.create({
        data: { name, category, icon, isActive: parseBool(isActive, true) }
      });

      res.status(201).json({ success: true, message: 'Amenity created', data: amenity });
    } catch (err) {
      console.error('createAmenity:', err);
      res.status(500).json({ success: false, message: 'Error creating amenity', error: err.message });
    }
  },

  getAmenities: async (req, res) => {
    try {
      const { page, limit, skip, take } = pickPagination(req);
      const where = { isDeleted: false };
      const [items, total] = await Promise.all([
        prisma.amenity.findMany({ where, orderBy: { name: 'asc' }, skip, take }),
        prisma.amenity.count({ where })
      ]);
      res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (err) {
      console.error('getAmenities:', err);
      res.status(500).json({ success: false, message: 'Error fetching amenities' });
    }
  },

  updateAmenity: async (req, res) => {
    try {
      const { id } = req.params;
      const guard = await ensureNotDeleted(prisma.amenity, id, 'Amenity');
      if (guard.error) return res.status(404).json({ success: false, message: guard.error });

      const { name, category, isActive } = req.body;
      const icon = req.file ? `/uploads/amenities/${req.file.filename}` : undefined;

      const amenity = await prisma.amenity.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(category && { category }),
          ...(icon && { icon }),
          ...(isActive !== undefined && { isActive: parseBool(isActive) })
        }
      });

      res.json({ success: true, message: 'Amenity updated', data: amenity });
    } catch (err) {
      console.error('updateAmenity:', err);
      res.status(500).json({ success: false, message: 'Error updating amenity' });
    }
  },

  deleteAmenity: async (req, res) => {
    try {
      const { id } = req.params;
      const guard = await ensureNotDeleted(prisma.amenity, id, 'Amenity');
      if (guard.error) return res.status(404).json({ success: false, message: guard.error });

      await prisma.amenity.update({ where: { id }, data: { isDeleted: true, isActive: false } });
      res.json({ success: true, message: 'Amenity deleted' });
    } catch (err) {
      console.error('deleteAmenity:', err);
      res.status(500).json({ success: false, message: 'Error deleting amenity' });
    }
  },

  // ========== FACILITIES ==========


  createFacility: async (req, res) => {
    try {
      const { name, isActive = true } = req.body;
      const icon = req.file ? `/uploads/facilities/${req.file.filename}` : null;

      const facility = await prisma.facility.create({
        data: { name, icon, isActive: parseBool(isActive, true) }
      });

      res.status(201).json({ success: true, message: 'Facility created', data: facility });
    } catch (err) {
      console.error('createFacility:', err);
      res.status(500).json({ success: false, message: 'Error creating facility' });
    }
  },

  getFacilities: async (req, res) => {
    try {
      const { page, limit, skip, take } = pickPagination(req);
      const where = { isDeleted: false };
      const [items, total] = await Promise.all([
        prisma.facility.findMany({ where, orderBy: { name: 'asc' }, skip, take }),
        prisma.facility.count({ where })
      ]);
      res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (err) {
      console.error('getFacilities:', err);
      res.status(500).json({ success: false, message: 'Error fetching facilities' });
    }
  },

  updateFacility: async (req, res) => {
    try {
      const { id } = req.params;
      const guard = await ensureNotDeleted(prisma.facility, id, 'Facility');
      if (guard.error) return res.status(404).json({ success: false, message: guard.error });

      const { name, isActive } = req.body;
      const icon = req.file ? `/uploads/facilities/${req.file.filename}` : undefined;

      const facility = await prisma.facility.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(icon && { icon }),
          ...(isActive !== undefined && { isActive: parseBool(isActive) })
        }
      });

      res.json({ success: true, message: 'Facility updated', data: facility });
    } catch (err) {
      console.error('updateFacility:', err);
      res.status(500).json({ success: false, message: 'Error updating facility' });
    }
  },

  deleteFacility: async (req, res) => {
    try {
      const { id } = req.params;
      const guard = await ensureNotDeleted(prisma.facility, id, 'Facility');
      if (guard.error) return res.status(404).json({ success: false, message: guard.error });

      await prisma.facility.update({ where: { id }, data: { isDeleted: true, isActive: false } });
      res.json({ success: true, message: 'Facility deleted' });
    } catch (err) {
      console.error('deleteFacility:', err);
      res.status(500).json({ success: false, message: 'Error deleting facility' });
    }
  },

  // ========== SAFETY HYGIENE ==========



  createSafetyHygiene: async (req, res) => {
    try {
      const { name, isActive = true } = req.body;
      const icon = req.file ? `/uploads/safety/${req.file.filename}` : null;

      const safetyHygiene = await prisma.safetyHygiene.create({
        data: { name, icon, isActive: parseBool(isActive, true) }
      });

      res.status(201).json({ success: true, message: 'Safety hygiene created', data: safetyHygiene });
    } catch (err) {
      console.error('createSafetyHygiene:', err);
      res.status(500).json({ success: false, message: 'Error creating safety hygiene' });
    }
  },

  getSafetyHygienes: async (req, res) => {
    try {
      const { page, limit, skip, take } = pickPagination(req);
      const where = { isDeleted: false, isActive: true };
      const [items, total] = await Promise.all([
        prisma.safetyHygiene.findMany({ where, orderBy: { name: 'asc' }, skip, take }),
        prisma.safetyHygiene.count({ where })
      ]);
      res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (err) {
      console.error('getSafetyHygienes:', err);
      res.status(500).json({ success: false, message: 'Error fetching safety hygienes' });
    }
  },

  updateSafetyHygiene: async (req, res) => {
    try {
      const { id } = req.params;
      const guard = await ensureNotDeleted(prisma.safetyHygiene, id, 'Safety hygiene');
      if (guard.error) return res.status(404).json({ success: false, message: guard.error });

      const { name, isActive } = req.body;
      const icon = req.file ? `/uploads/safety/${req.file.filename}` : undefined;

      const safetyHygiene = await prisma.safetyHygiene.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(icon && { icon }),
          ...(isActive !== undefined && { isActive: parseBool(isActive) })
        }
      });

      res.json({ success: true, message: 'Safety hygiene updated', data: safetyHygiene });
    } catch (err) {
      console.error('updateSafetyHygiene:', err);
      res.status(500).json({ success: false, message: 'Error updating safety hygiene' });
    }
  },

  deleteSafetyHygiene: async (req, res) => {
    try {
      const { id } = req.params;
      const guard = await ensureNotDeleted(prisma.safetyHygiene, id, 'Safety hygiene');
      if (guard.error) return res.status(404).json({ success: false, message: guard.error });

      await prisma.safetyHygiene.update({ where: { id }, data: { isDeleted: true, isActive: false } });
      res.json({ success: true, message: 'Safety hygiene deleted' });
    } catch (err) {
      console.error('deleteSafetyHygiene:', err);
      res.status(500).json({ success: false, message: 'Error deleting safety hygiene' });
    }
  },

  // ========== PROPERTY TYPE ==========


  createPropertyType: async (req, res) => {
    try {
      const { name } = req.body;
      const propertyType = await prisma.propertyType.create({ data: { name } });
      res.status(201).json({ success: true, message: 'Property type created', data: propertyType });
    } catch (err) {
      console.error('createPropertyType:', err);
      res.status(500).json({ success: false, message: 'Error creating property type' });
    }
  },

  getPropertyTypes: async (req, res) => {
    try {
      const items = await prisma.propertyType.findMany({
        where: { isDeleted: false },
        orderBy: { name: 'asc' }
      });
      res.json({ success: true, data: items });
    } catch (err) {
      console.error('getPropertyTypes:', err);
      res.status(500).json({ success: false, message: 'Error fetching property types' });
    }
  },

  updatePropertyType: async (req, res) => {
    try {
      const { id } = req.params;
      const guard = await ensureNotDeleted(prisma.propertyType, id, 'Property type');
      if (guard.error) return res.status(404).json({ success: false, message: guard.error });

      const propertyType = await prisma.propertyType.update({
        where: { id },
        data: { name: req.body.name }
      });
      res.json({ success: true, message: 'Property type updated', data: propertyType });
    } catch (err) {
      console.error('updatePropertyType:', err);
      res.status(500).json({ success: false, message: 'Error updating property type' });
    }
  },

  deletePropertyType: async (req, res) => {
    try {
      const { id } = req.params;
      const guard = await ensureNotDeleted(prisma.propertyType, id, 'Property type');
      if (guard.error) return res.status(404).json({ success: false, message: guard.error });

      await prisma.propertyType.update({ where: { id }, data: { isDeleted: true } });
      res.json({ success: true, message: 'Property type deleted' });
    } catch (err) {
      console.error('deletePropertyType:', err);
      res.status(500).json({ success: false, message: 'Error deleting property type' });
    }
  },

  // ========== ROOM TYPE ==========


  createRoomType: async (req, res) => {
    try {
      const { name, } = req.body;
      const roomType = await prisma.roomType.create({ data: { name } });
      res.status(201).json({ success: true, message: 'Room type created', data: roomType });
    } catch (err) {
      console.error('createRoomType:', err);
      res.status(500).json({ success: false, message: 'Error creating room type' });
    }
  },

  getRoomTypes: async (req, res) => {
    try {
      const items = await prisma.roomType.findMany({
        where: { isDeleted: false },
        orderBy: { name: 'asc' }
      });
      res.json({ success: true, data: items });
    } catch (err) {
      console.error('getRoomTypes:', err);
      res.status(500).json({ success: false, message: 'Error fetching room types' });
    }
  },

  updateRoomType: async (req, res) => {
    try {
      const { id } = req.params;
      const guard = await ensureNotDeleted(prisma.roomType, id, 'Room type');
      if (guard.error) return res.status(404).json({ success: false, message: guard.error });

      const roomType = await prisma.roomType.update({ where: { id }, data: { name: req.body.name } });
      res.json({ success: true, message: 'Room type updated', data: roomType });
    } catch (err) {
      console.error('updateRoomType:', err);
      res.status(500).json({ success: false, message: 'Error updating room type' });
    }
  },

  deleteRoomType: async (req, res) => {
    try {
      const { id } = req.params;
      const guard = await ensureNotDeleted(prisma.roomType, id, 'Room type');
      if (guard.error) return res.status(404).json({ success: false, message: guard.error });

      await prisma.roomType.update({ where: { id }, data: { isDeleted: true } });
      res.json({ success: true, message: 'Room type deleted' });
    } catch (err) {
      console.error('deleteRoomType:', err);
      res.status(500).json({ success: false, message: 'Error deleting room type' });
    }
  },

  // ========== PROPERTY ==========


createProperty:async (req, res) => {
  try {
    // 1) Extract + sanitize
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


    console.log("files",req.files);
    console.log('roomtypes RAW:', roomtypes);
    console.log('roomtypes TYPE:', typeof roomtypes);


    let locationData;
    try {
      locationData = typeof location === 'string' ? JSON.parse(location) : location;
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location data format'
      });
    }

    // Validate location structure
    if (!locationData?.address || !locationData?.coordinates) {
      return res.status(400).json({
        success: false,
        message: 'Location must include address and coordinates'
      });
    }

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const amenityList = safeJSON(amenityIds, []).filter(Boolean);
    const facilityList = safeJSON(facilityIds, []).filter(Boolean);
    const safetyList  = safeJSON(safetyIds,  []).filter(Boolean);
    
    const roomTypesRaw = safeJSON(roomtypes, [], 'roomtypes');
    console.log('After safeJSON:', roomTypesRaw);
    console.log('Is Array?', Array.isArray(roomTypesRaw));
    
    const roomTypeList = roomTypesRaw.filter(Boolean); // [{roomTypeId, basePrice}, ...]
    console.log('After filter(Boolean):', roomTypeList);

    // 2) Validate foreign keys (outside txn is fine; you can move inside if you want strict serialization)
    const mustExist = async (model, ids, label) => {
      if (!ids.length) return;
      const rows = await model.findMany({ where: { id: { in: ids }, isDeleted: false }, select: { id: true } });
      const have = new Set(rows.map(r => r.id));
      const missing = [...new Set(ids)].filter(x => !have.has(x));
      if (missing.length) throw new Error(`${label} not found: ${missing.join(', ')}`);
    };

    if (propertyTypeId) {
      const pt = await prisma.propertyType.findFirst({ where: { id: propertyTypeId, isDeleted: false }, select: { id: true } });
      if (!pt) return res.status(404).json({ success: false, message: 'Property type not found' });
    }

    if (ownerHostId) {
      const host = await prisma.host.findFirst({ where: { id: ownerHostId, isDeleted: false }, select: { id: true } });
      if (!host) return res.status(404).json({ success: false, message: 'Owner host not found' });
    }

    await mustExist(prisma.amenity, amenityList, 'Amenity');
    await mustExist(prisma.facility, facilityList, 'Facility');
    await mustExist(prisma.safetyHygiene, safetyList, 'Safety hygiene');
    await mustExist(prisma.roomType, roomTypeList.map(rt => rt.roomTypeId), 'RoomType');

    // Collect and validate mealPlanIds if provided in roomtypes payload
    const mealPlanIds = Array.from(new Set(
      roomTypeList.flatMap(rt => Array.isArray(rt.mealPlans) ? rt.mealPlans.map(mp => mp.mealPlanId).filter(Boolean) : [])
    ));
    if (mealPlanIds.length) {
      await mustExist(prisma.mealPlan, mealPlanIds, 'MealPlan');
    }

    // 3) Validate files (kept minimal; adapt to your actual uploader)
    const filesByField = (req.files || []).reduce((acc, f) => {
      (acc[f.fieldname] ||= []).push(f);
      return acc;
    }, {});
    const mediaFiles = filesByField['media'] || [];

    const allowedImage = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const allowedVideo = ['video/mp4', 'video/webm', 'video/mov'];
    const maxFileSize = 50 * 1024 * 1024;

    for (const f of mediaFiles) {
      const okType = allowedImage.includes(f.mimetype) || allowedVideo.includes(f.mimetype);
      if (!okType) {
        return res.status(400).json({ success: false, message: `Invalid file type: ${f.mimetype}` });
      }
      if (f.size > maxFileSize) {
        return res.status(400).json({ success: false, message: `File too large: ${f.originalname}` });
      }
    }

    // 4) Transaction: create property, links, roomTypes, media, then seed RateCalendar
    const result = await prisma.$transaction(async (tx) => {
      // Create Property w/ nested creates
      const property = await tx.property.create({
        data: {
          title: title.trim(),
          description: description || null,
          rulesAndPolicies: rulesAndPolicies || null,
          status,
          propertyTypeId: propertyTypeId || null,
          ownerHostId: ownerHostId || null,
          location: locationData || null, 

          // property-level joins
          amenities: amenityList.length
            ? { create: amenityList.map(id => ({ amenity: { connect: { id } } })) }
            : undefined,
          facilities: facilityList.length
            ? { create: facilityList.map(id => ({ facility: { connect: { id } } })) }
            : undefined,
          safeties: safetyList.length
            ? { create: safetyList.map(id => ({ safety: { connect: { id } } })) }
            : undefined,

          // propertyRoomTypes
          roomTypes: roomTypeList.length
            ? {
                create: roomTypeList.map(rt => ({
                  roomType: { connect: { id: rt.roomTypeId } },
                  basePrice: Number(rt.basePrice),
                  singleoccupancyprice: Number(rt.singleoccupancyprice),
                  Occupancy: Number(rt.Occupancy ?? 0),
                  extraBedCapacity: Number(rt.extraBedCapacity ?? 0),
                  extraBedPriceAdult: Number(rt.extraBedPriceAdult ?? 0),
                  extraBedPriceChild: Number(rt.extraBedPriceChild ?? 0),
                  extraBedPriceInfant: Number(rt.extraBedPriceInfant ?? 0),
                 baseMealPlan: rt.baseMealPlanId 
                          ? { connect: { id: rt.baseMealPlanId } }
                          : undefined,
                  mealPlanLinks: Array.isArray(rt.mealPlans) && rt.mealPlans.length
                    ? {
                        create: rt.mealPlans.map(mp => ({
                          mealPlan: { connect: { id: mp.mealPlanId } },
                          adultPrice: mp.adultPrice != null ? Number(mp.adultPrice) : null,
                          childPrice: mp.childPrice != null ? Number(mp.childPrice) : null,
                          isActive: mp.isActive ?? true,
                        }))
                      }
                    : undefined,
                })),
              }
            : undefined,

          // media
          media: mediaFiles.length
            ? {
                create: mediaFiles.map((file, idx) => ({
                  url: file.url || `/uploads/${file.subdirectory || 'images'}/${file.filename}`,
                  type: file.mimetype.startsWith('image') ? 'image' : 'video',
                  isFeatured: idx === 0,
                  order: idx,
                })),
              }
            : undefined,
        },
        include: {
          roomTypes: true,   // we need these ids to seed rate rows
          media: true,
          amenities: true,
          facilities: true,
          safeties: true,
        },
      });

      console.log('Created property with roomTypes:', property.roomTypes?.length || 0);

      // Seed RateCalendar for each PropertyRoomType
      if (property.roomTypes?.length) {
        const today = new Date(); // seed starting today (UTC-normalized below)
        for (const prt of property.roomTypes) {
          // Build rows in memory
          const rows = Array.from({ length: DAYS_TO_SEED }).map((_, i) => ({
            propertyRoomTypeId: prt.id,
            date: addDaysUtc(today, i),        // one row per day
            price: prt.basePrice,              // seed with basePrice
            isOpen: true,
            isDeleted: false,
          }));
          // Bulk insert
          await tx.rateCalendar.createMany({
            data: rows,
            skipDuplicates: true, // idempotence if retried
          });
        }
      }

      // Return full property with all relations
      return property;
    });

    // 5) Success
    return res.status(201).json({
      success: true,
      message: 'Property created & rate calendar seeded',
      data: result,
    });

  } catch (err) {
    console.error('createProperty (txn) error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Error creating property',
    });
  }
}
,
getProperties: async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      search,
      propertyType,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Validate pagination
    const skip = Math.max(0, (parseInt(page) - 1) * parseInt(limit));
    const take = Math.min(100, Math.max(1, parseInt(limit)));

    // Build where clause
    const where = {
      isDeleted: false,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(propertyType && { propertyTypeId: propertyType }),
      ...(minPrice && { 
        roomTypes: {
          some: { basePrice: { gte: parseFloat(minPrice) } }
        }
      }),
      ...(maxPrice && {
        roomTypes: {
          some: { basePrice: { lte: parseFloat(maxPrice) } }
        }
      })
    };

    // Validate sort fields
    const allowedSortFields = ['createdAt', 'title', 'avgRating', 'basePrice'];
    const orderBy = {
      [allowedSortFields.includes(sortBy) ? sortBy : 'createdAt']: 
      sortOrder === 'asc' ? 'asc' : 'desc'
    };

    // Get total count with filters
    const total = await prisma.property.count({ where });

    // Main query with optimized select
    const properties = await prisma.property.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        location: true,
        coverImage: true,
        avgRating: true,
        reviewCount: true,
        createdAt: true,

        propertyType: { 
          select: { id: true, name: true } 
        },

        amenities: {
          where: { isDeleted: false },
          select: {
            amenity: { 
              select: { id: true, name: true, icon: true, isActive: true } 
            },
          },
        },

        facilities: {
          where: { isDeleted: false },
          select: {
            facility: { 
              select: { id: true, name: true, icon: true, isActive: true } 
            },
          },
        },

        safeties: {
          where: { isDeleted: false },
          select: {
            safety: { 
              select: { id: true, name: true, icon: true, isActive: true } 
            },
          },
        },

        roomTypes: {
          where: { 
            isDeleted: false, 
            isActive: true 
          },
          select: {
            id: true,
            Occupancy: true,
            roomType: { 
              select: { id: true, name: true, status: true } 
            },
            rooms: {
              where: { isDeleted: false },
              select: {
                id: true,
                name: true,
                code: true,
                status: true,
                maxOccupancy: true,
                amenities: {
                  where: { isDeleted: false },
                  select: {
                    amenity: { 
                      select: { id: true, name: true, icon: true } 
                    },
                  },
                },
              },
            },
           
            mealPlanLinks: { 
              where: { isActive: true },
              select: {
                id: true,
                mealPlan: { 
                  select: { id: true, code: true, name: true, kind: true ,description:true } 
                },
              }
            }
          },
        },

        media: {
          where: { isDeleted: false },
          select: { 
            id: true, 
            url: true, 
            type: true, 
            isFeatured: true, 
            order: true 
          },
        },

        specialRates: {
          where: { 
            isDeleted: false, 
            isActive: true 
          },
          select: {
            id: true,
            name: true,
            kind: true,
            pricingMode: true,
            flatPrice: true,
            percentAdj: true,
            color: true,
          },
        },

        MealPlan: {
          where: { isDeleted: false },
          select: {
            id: true,
            code: true,
            name: true,
            kind: true,
          },
        },

        reviews: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            rating: true,
            description: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                username: true,
                firstname: true,
                lastname: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    // Transform and flatten data
    const data = toPlain(
      properties.map((p) => ({
        ...p,
        amenities: p.amenities.map((x) => x.amenity),
        facilities: p.facilities.map((x) => x.facility),
        safeties: p.safeties.map((x) => x.safety),
        roomTypes: p.roomTypes.map((rt) => ({
          ...rt,
          rooms: rt.rooms.map((r) => ({
            ...r,
            amenities: r.amenities.map((a) => a.amenity),
          })),
        })),
      }))
    );

    // Return paginated response
    return res.json({ 
      success: true, 
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.error('getProperties:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching properties',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
},
searchProperties: async (req, res) => {
  try {
    // Input validation remains the same
    const {
      checkIn,
      checkOut,
      adults = 2,
      children = 0,
      infants = 0,
      rooms = 1,
      infantsUseBed = 0,
    } = req.query;


    if (!checkIn || !checkOut) {
      return res.status(400).json({ 
        success: false, 
        message: 'Check-in and check-out dates are required (YYYY-MM-DD format)' 
      });
    }

    // Parse and validate dates
    const startDate = dayUTC(checkIn);
    const endDate = dayUTC(checkOut);
    const today = dayUTC(new Date());

    if (isNaN(startDate) || isNaN(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    if (startDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Check-in date cannot be in the past'
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date'
      });
    }

    // Parse guest numbers
    const need = {
      adults: Math.max(0, Number(adults) || 0),
      children: Math.max(0, Number(children) || 0),
      infants: Math.max(0, Number(infants) || 0),
      rooms: Math.max(1, Number(rooms) || 1),
      infantsUseBed: Boolean(infantsUseBed),
    };

    const needsBedInfants = need.infantsUseBed ? need.infants : 0;
    const needsBedTotal = need.adults + need.children + needsBedInfants;

    if (needsBedTotal === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one guest required'
      });
    }

    // Calculate search parameters
    const nights = diffNights(checkIn, checkOut);
    const dateList = eachDateUTC(checkIn, checkOut);
    const dateISO = dateList.map(d => d.toISOString());

    // Fetch available properties
    const availableProperties = await fetchAvailableProperties(
      startDate,
      endDate,
      need,
      needsBedTotal
    );



    const results = calculateRoomAssignments(
      availableProperties,
      need,
      needsBedInfants,
      nights,
      dateISO
    );



    return res.json({
      success: true,
      params: {
        checkIn: startDate.toISOString(),
        checkOut: endDate.toISOString(),
        nights,
        guests: { 
          adults: need.adults, 
          children: need.children, 
          infants: need.infants, 
          infantsUseBed: need.infantsUseBed 
        },
        rooms: need.rooms,
      },
      data: results,
      message: results.length ? undefined : 'No properties match the requested criteria'
    });

  } catch (err) {
    console.error('searchProperties:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Error searching properties',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
,

  getProperty: async (req, res) => {
    try {
      const { id } = req.params;

      const property = await prisma.property.findFirst({
        where: { id, isDeleted: false },
        include: {
          propertyType: { where: { isDeleted: false } },
          amenities: { where: { isDeleted: false }, include: { amenity: true } },
          facilities: { where: { isDeleted: false }, include: { facility: true } },
          safeties: { where: { isDeleted: false }, include: { safety: true } },
          roomTypes: { where: { isDeleted: false } },
          // rooms: {
          //   where: { isDeleted: false },
          //   include: {
          //     roomType: true,
          //     amenities: { where: { isDeleted: false }, include: { amenity: true } }
          //   }
          // },
          media: { where: { isDeleted: false } },
          ownerHost: true
        }
      });

      if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

      res.json({ success: true, data: property });
    } catch (err) {
      console.error('getProperty:', err);
      res.status(500).json({ success: false, message: 'Error fetching property' });
    }
  },
  getPropertyByOwener: async (req, res) => {
    try {
      const { ownerHostId } = req.params;

      console.log('getPropertyByOwner ownerHostId:', ownerHostId);
      const properties = await prisma.property.findUnique({
        where: {
          ownerHostId_isDeleted: {
            ownerHostId: ownerHostId,
            isDeleted: false
          }
        }
      });

      res.json({ success: true, data: properties });
    } catch (err) {
      console.error('getPropertyByOwner:', err);
      res.status(500).json({ success: false, message: 'Error fetching properties by owner' });
    }
  },

 updateProperty: async (req, res) => {
  console.log('updateProperty req.body:', req.body);
  console.log('updateProperty req.params:', req.params);
  console.log('updateProperty req.files:', req.files);

  try {
    const { id } = req.params;
    const guard = await ensureNotDeleted(prisma.property, id, 'Property');
    if (guard.error) return res.status(404).json({ success: false, message: guard.error });

    // Parse FormData fields
    const {
      title,
      description,
      rulesAndPolicies,
      status,
      propertyTypeId,
      ownerHostId,
      location,
      amenityIds,
      facilityIds,
      safetyIds,
      roomTypeIds,
      existingMedia,
      coverImageIndex,
      rooms
    } = req.body;

    // Parse arrays and JSON
    const amenityList = normalizeToArray(amenityIds).filter(Boolean);
    const facilityList = normalizeToArray(facilityIds).filter(Boolean);
    const safetyList = normalizeToArray(safetyIds).filter(Boolean);
    const roomTypeList = normalizeToArray(roomTypeIds).filter(Boolean);
    const existingMediaList = normalizeToArray(existingMedia).filter(Boolean);
    const roomsData = normalizeToArray(rooms);

    // Validate required fields
    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    // Validate owner host exists
    if (ownerHostId) {
      const host = await prisma.host.findUnique({
        where: { id: ownerHostId },
        select: { id: true, isDeleted: true }
      });
      if (!host || host.isDeleted) {
        return res.status(400).json({ success: false, message: 'Invalid ownerHostId' });
      }
    }

    // Validate property type
    if (propertyTypeId) {
      const pt = await prisma.propertyType.findUnique({
        where: { id: propertyTypeId },
        select: { id: true, isDeleted: true }
      });
      if (!pt || pt.isDeleted) {
        return res.status(400).json({ success: false, message: 'Invalid propertyTypeId' });
      }
    }

    // Helper: assert IDs exist
    const mustExist = async (model, ids, label) => {
      if (!ids.length) return;
      const rows = await model.findMany({
        where: { id: { in: ids }, isDeleted: false },
        select: { id: true }
      });
      const ok = new Set(rows.map(r => r.id));
      const missing = [...new Set(ids)].filter(x => !ok.has(x));
      if (missing.length) throw new Error(`Invalid ${label} id(s): ${missing.join(', ')}`);
    };

    await mustExist(prisma.amenity, amenityList, 'amenity');
    await mustExist(prisma.facility, facilityList, 'facility');
    await mustExist(prisma.safetyHygiene, safetyList, 'safety');
    await mustExist(prisma.roomType, roomTypeList, 'roomType');

    // Files
    const filesByField = (req.files || []).reduce((acc, f) => {
      (acc[f.fieldname] ||= []).push(f);
      return acc;
    }, {});
    const newMediaFiles = filesByField['media'] || [];

    // Validate files
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/mov'];
    const maxFileSize = 50 * 1024 * 1024;
    for (const file of newMediaFiles) {
      const okType = allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype);
      if (!okType) return res.status(400).json({ success: false, message: `Invalid file type: ${file.mimetype}. Only images and videos are allowed.` });
      if (file.size > maxFileSize) return res.status(400).json({ success: false, message: `File too large: ${file.originalname}. Maximum size is 50MB.` });
    }

    // Property media: existing + new
    const newPropertyMedia = newMediaFiles.map((f, idx) => {
      const url = fileToUrl(req, f);
      return {
        url,
        type: f.mimetype?.startsWith('image/') ? 'image' : 'video',
        isFeatured: Number(coverImageIndex) === (existingMediaList.length + idx),
        order: existingMediaList.length + idx
      };
    });

    const existingPropertyMedia = existingMediaList.map((url, idx) => ({
      url,
      type: 'image',
      isFeatured: Number(coverImageIndex) === idx && newMediaFiles.length === 0,
      order: idx
    }));

    const allPropertyMedia = [...existingPropertyMedia, ...newPropertyMedia];
    const coverImage = allPropertyMedia.find(m => m.isFeatured)?.url || allPropertyMedia[0]?.url || null;

    // Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update basic property data
      await tx.property.update({
        where: { id },
        data: {
          title: title?.trim(),
          description: description || null,
          rulesAndPolicies: rulesAndPolicies || null,
          status: status || 'active',
          location: parseJSON(location, null),
          ...(ownerHostId && { ownerHostId }),
          ...(propertyTypeId && { propertyTypeId }),
          coverImage
        }
      });

      // Clear existing relations
      await tx.propertyAmenity.deleteMany({ where: { propertyId: id } });
      await tx.propertyFacility.deleteMany({ where: { propertyId: id } });
      await tx.propertySafety.deleteMany({ where: { propertyId: id } });
      await tx.propertyMedia.deleteMany({ where: { propertyId: id } });

      // Recreate amenities
      if (amenityList.length) {
        await tx.propertyAmenity.createMany({
          data: amenityList.map(amenityId => ({ propertyId: id, amenityId }))
        });
      }

      // Recreate facilities
      if (facilityList.length) {
        await tx.propertyFacility.createMany({
          data: facilityList.map(facilityId => ({ propertyId: id, facilityId }))
        });
      }

      // Recreate safeties
      if (safetyList.length) {
        await tx.propertySafety.createMany({
          data: safetyList.map(safetyId => ({ propertyId: id, safetyId }))
        });
      }

      // Recreate media
      if (allPropertyMedia.length) {
        await tx.propertyMedia.createMany({
          data: allPropertyMedia.map(media => ({ propertyId: id, ...media }))
        });
      }

      // Rooms
      if (roomsData.length) {
        await tx.roomAmenity.deleteMany({ where: { room: { propertyId: id } } });
        await tx.room.deleteMany({ where: { propertyId: id } });

        for (const [index, roomDataRaw] of roomsData.entries()) {
          const roomData = typeof roomDataRaw === 'string' ? parseJSON(roomDataRaw, {}) : (roomDataRaw || {});
          if (!roomData.roomTypeId) throw new Error(`rooms[${index}].roomTypeId is required`);

          // Images
          const newRoomImages = filesByField[`rooms[${index}][newImages]`] || [];
          const existingRoomImages = normalizeToArray(roomData.existingImages || []);

          for (const file of newRoomImages) {
            if (!allowedImageTypes.includes(file.mimetype)) throw new Error(`Invalid room image type: ${file.mimetype} for room ${index + 1}`);
            if (file.size > maxFileSize) throw new Error(`Room image too large for room ${index + 1}: ${file.originalname}`);
          }

          const uploadedRoomImages = newRoomImages.map((f, idx) => ({
            url: fileToUrl(req, f),
            isFeatured: idx === 0 && existingRoomImages.length === 0,
            caption: `Room Image ${idx + 1}`,
            order: idx
          }));

          const existingRoomImagesData = existingRoomImages.map((url, idx) => ({
            url,
            isFeatured: idx === 0 && uploadedRoomImages.length === 0,
            caption: `Room Image ${uploadedRoomImages.length + idx + 1}`,
            order: uploadedRoomImages.length + idx
          }));

          const allRoomImages = [...uploadedRoomImages, ...existingRoomImagesData];

          const room = await tx.room.create({
            data: {
              propertyId: id,
              roomTypeId: roomData.roomTypeId,
              name: roomData.name || `Room ${index + 1}`,
              code: roomData.code || null,
              spaceSqft: roomData.spaceSqft ? parseInt(roomData.spaceSqft, 10) : null,
              maxOccupancy: roomData.maxOccupancy ? parseInt(roomData.maxOccupancy, 10) : 2,
              price: roomData.price ? Number(roomData.price) : 0,
              images: allRoomImages,
              status: roomData.status || 'active',
            }
          });

          const roomAmenityIds = normalizeToArray(roomData.amenityIds || []);
          if (roomAmenityIds.length) {
            await tx.roomAmenity.createMany({
              data: Array.from(new Set(roomAmenityIds)).map(amenityId => ({ roomId: room.id, amenityId }))
            });
          }
        }
      }

      // ✅ Return updated property with relations (correct include usage)
      return await tx.property.findFirst({
        where: {
          id,
          isDeleted: false,
          // filter to-one relations here
          ...(propertyTypeId ? { propertyType: { is: { isDeleted: false } } } : {}),
          ...(ownerHostId ? { ownerHost: { is: { isDeleted: false } } } : {}),
        },
        include: {
          propertyType: true,
          ownerHost: true,

          amenities: {
            where: { isDeleted: false, amenity: { is: { isDeleted: false } } },
            include: { amenity: true }
          },
          facilities: {
            where: { isDeleted: false, facility: { is: { isDeleted: false } } },
            include: { facility: true }
          },
          safeties: {
            where: { isDeleted: false, safety: { is: { isDeleted: false } } },
            include: { safety: true }
          },

          roomTypes: { where: { isDeleted: false } },

          rooms: {
            where: { isDeleted: false, roomType: { is: { isDeleted: false } } },
            include: {
              roomType: true, // to-one => no where here
              amenities: {
                where: { isDeleted: false, amenity: { is: { isDeleted: false } } },
                include: { amenity: true }
              }
            }
          },

          media: { where: { isDeleted: false } }
        }
      });
    });

    res.json({ success: true, message: 'Property updated successfully', data: result });
  } catch (err) {
    console.error('updateProperty:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Error updating property',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
},


  deleteProperty: async (req, res) => {
    try {
      const { id } = req.params;
      const guard = await ensureNotDeleted(prisma.property, id, 'Property');
      if (guard.error) return res.status(404).json({ success: false, message: guard.error });
      await prisma.property.update({ where: { id }, data: { isDeleted: true } });
      res.json({ success: true, message: 'Property deleted' });
    } catch (err) {
      console.error('deleteProperty:', err);
      res.status(500).json({ success: false, message: 'Error deleting property' });
    }
  },

  // ========== ROOMS ==========
 addRooms: async (req, res) => {
  const { propertyId } = req.params;

  console.log('addRooms req.body:', req.body);

  if (!propertyId) {
    return res.status(400).json({ success: false, message: 'propertyId is required' });
  }

  // Expect array of room configurations
  const roomConfigs = req.body;
  
  if (!Array.isArray(roomConfigs) || roomConfigs.length === 0) {
    return res.status(400).json({ success: false, message: 'Room configurations array is required' });
  }

  try {
    // ✅ Check property exists
    const property = await prisma.property.findFirst({
      where: { id: propertyId, isDeleted: false },
    });
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // ✅ Validate all room configurations
    for (const config of roomConfigs) {
      const { propertyRoomTypeId, namePrefix, roomCount, fromDate, toDate } = config;

      if (!propertyRoomTypeId) {
        return res.status(400).json({ success: false, message: 'propertyRoomTypeId is required for all configurations' });
      }
      if (!namePrefix?.trim()) {
        return res.status(400).json({ success: false, message: 'namePrefix is required for all configurations' });
      }
      if (!roomCount || roomCount < 1 || roomCount > 50) {
        return res.status(400).json({ success: false, message: 'roomCount must be between 1 and 50' });
      }
      if (!fromDate || !toDate) {
        return res.status(400).json({ success: false, message: 'fromDate and toDate are required for all configurations' });
      }

      // ✅ Validate date range
      const startDate = new Date(fromDate);
      const endDate = new Date(toDate);
      if (startDate >= endDate) {
        return res.status(400).json({ success: false, message: 'fromDate must be before toDate' });
      }

      // ✅ Check room type exists for this property
      const propertyRoomType = await prisma.propertyRoomType.findFirst({
        where: { id: propertyRoomTypeId, propertyId, isDeleted: false },
      });
      if (!propertyRoomType) {
        return res.status(404).json({ success: false, message: `Property room type not found: ${propertyRoomTypeId}` });
      }
    }

    // ✅ Create rooms and availability for each configuration
    const createdRooms = [];
    const totalAvailabilityCount = [];

    for (const config of roomConfigs) {
      const { propertyRoomTypeId, namePrefix, roomCount, fromDate, toDate } = config;
      
      // Create multiple rooms for this room type
      for (let i = 1; i <= roomCount; i++) {
        const roomName = `${namePrefix.trim()} ${i}`;
        
        // ✅ Create room
        const newRoom = await prisma.room.create({
          data: {
            propertyRoomTypeId,
            name: roomName,
            code: null, // No code needed for bulk creation
            spaceSqft: null, // No space needed for bulk creation
            images: null, // No images for bulk creation
            status: 'active',
          }
        });

        createdRooms.push(newRoom);

        // ✅ Create availability records for this room
        const availabilities = [];
        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          availabilities.push({
            roomId: newRoom.id,
            date: new Date(currentDate),
            minNights: 1,
            status: 'available',
            isDeleted: false,
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }

        await prisma.availability.createMany({
          data: availabilities,
          skipDuplicates: true,
        });

        totalAvailabilityCount.push(availabilities.length);
      }
    }

    const totalRooms = createdRooms.length;
    const totalAvailabilityRecords = totalAvailabilityCount.reduce((sum, count) => sum + count, 0);

    return res.status(201).json({
      success: true,
      message: `Successfully created ${totalRooms} rooms with ${totalAvailabilityRecords} availability records`,
      data: {
        totalRooms,
        totalAvailabilityRecords,
        roomConfigs: roomConfigs.map(config => ({
          roomTypeId: config.propertyRoomTypeId,
          namePrefix: config.namePrefix,
          roomCount: config.roomCount,
          fromDate: config.fromDate,
          toDate: config.toDate,
        })),
        createdRooms: createdRooms.map(room => ({
          id: room.id,
          name: room.name,
          propertyRoomTypeId: room.propertyRoomTypeId,
        }))
      },
    });
  } catch (err) {
    console.error('addRooms:', err);
    return res.status(500).json({
      success: false,
      message: 'Error creating rooms',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
},

  updateRooms: async (req, res) => {
    const { propertyId } = req.params;

    console.log('updateRooms req.body:', req.body);

    if (!propertyId) {
      return res.status(400).json({ success: false, message: 'propertyId is required' });
    }

    // Expect array of room configurations
    const roomConfigs = req.body;
    
    if (!Array.isArray(roomConfigs) || roomConfigs.length === 0) {
      return res.status(400).json({ success: false, message: 'Room configurations array is required' });
    }

    try {
      // ✅ Check property exists
      const property = await prisma.property.findFirst({
        where: { id: propertyId, isDeleted: false },
      });
      if (!property) {
        return res.status(404).json({ success: false, message: 'Property not found' });
      }

      // ✅ Validate all room configurations
      for (const config of roomConfigs) {
        const { propertyRoomTypeId, namePrefix, roomCount, fromDate, toDate } = config;

        if (!propertyRoomTypeId) {
          return res.status(400).json({ success: false, message: 'propertyRoomTypeId is required for all configurations' });
        }
        if (!namePrefix?.trim()) {
          return res.status(400).json({ success: false, message: 'namePrefix is required for all configurations' });
        }
        if (!roomCount || roomCount < 1 || roomCount > 50) {
          return res.status(400).json({ success: false, message: 'roomCount must be between 1 and 50' });
        }
        if (!fromDate || !toDate) {
          return res.status(400).json({ success: false, message: 'fromDate and toDate are required for all configurations' });
        }

        // ✅ Validate date range
        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);
        if (startDate >= endDate) {
          return res.status(400).json({ success: false, message: 'fromDate must be before toDate' });
        }

        // ✅ Check room type exists for this property
        const propertyRoomType = await prisma.propertyRoomType.findFirst({
          where: { id: propertyRoomTypeId, propertyId, isDeleted: false },
        });
        if (!propertyRoomType) {
          return res.status(404).json({ success: false, message: `Property room type not found: ${propertyRoomTypeId}` });
        }
      }

      // ✅ Process each room type configuration
      const updateResults = [];

      for (const config of roomConfigs) {
        const { propertyRoomTypeId, namePrefix, roomCount, fromDate, toDate } = config;
        
        // ✅ Get existing rooms for this room type
        const existingRooms = await prisma.room.findMany({
          where: { 
            propertyRoomTypeId, 
            isDeleted: false 
          },
          include: {
            availability: {
              where: { isDeleted: false },
              orderBy: { date: 'asc' }
            }
          },
          orderBy: { name: 'asc' }
        });

        const existingCount = existingRooms.length;
        const newCount = roomCount;
        const newDateRange = generateDateRange(fromDate, toDate);
        
        // ✅ Handle room count changes
        if (newCount > existingCount) {
          // Create additional rooms
          for (let i = existingCount + 1; i <= newCount; i++) {
            const roomName = `${namePrefix.trim()} ${i}`;
            
            const newRoom = await prisma.room.create({
              data: {
                propertyRoomTypeId,
                name: roomName,
                code: null,
                spaceSqft: null,
                images: null,
                status: 'active',
              }
            });

            // Create availability for new room
            await createAvailabilityForRoom(newRoom.id, newDateRange);
          }
        } else if (newCount < existingCount) {
          // Delete excess rooms
          const roomsToDelete = existingRooms.slice(newCount);
          const roomIdsToDelete = roomsToDelete.map(room => room.id);
          
          // Soft delete rooms
          await prisma.room.updateMany({
            where: { id: { in: roomIdsToDelete } },
            data: { isDeleted: true }
          });

          // Soft delete their availability
          await prisma.availability.updateMany({
            where: { roomId: { in: roomIdsToDelete } },
            data: { isDeleted: true }
          });
        }

        // ✅ Handle room name changes (rename existing rooms)
        const roomsToUpdate = existingRooms.slice(0, Math.min(existingCount, newCount));
        for (let i = 0; i < roomsToUpdate.length; i++) {
          const room = roomsToUpdate[i];
          const newRoomName = `${namePrefix.trim()} ${i + 1}`;
          
          if (room.name !== newRoomName) {
            await prisma.room.update({
              where: { id: room.id },
              data: { name: newRoomName }
            });
          }
        }

        // ✅ Handle availability date changes for all rooms (existing + new)
        const allRooms = await prisma.room.findMany({
          where: { 
            propertyRoomTypeId, 
            isDeleted: false 
          }
        });

        for (const room of allRooms) {
          await updateRoomAvailability(room.id, newDateRange);
        }

        // ✅ Collect results
        const finalRooms = await prisma.room.findMany({
          where: { 
            propertyRoomTypeId, 
            isDeleted: false 
          },
          include: {
            availability: {
              where: { isDeleted: false },
              orderBy: { date: 'asc' }
            }
          }
        });

        updateResults.push({
          roomTypeId: propertyRoomTypeId,
          namePrefix,
          roomCount: finalRooms.length,
          fromDate,
          toDate,
          rooms: finalRooms.map(room => ({
            id: room.id,
            name: room.name,
            availabilityCount: room.availability.length
          }))
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Rooms updated successfully',
        data: {
          updateResults,
          summary: {
            totalRoomTypes: updateResults.length,
            totalRooms: updateResults.reduce((sum, result) => sum + result.roomCount, 0),
            totalAvailabilityRecords: updateResults.reduce((sum, result) => 
              sum + result.rooms.reduce((roomSum, room) => roomSum + room.availabilityCount, 0), 0
            )
          }
        },
      });
    } catch (err) {
      console.error('updateRooms:', err);
      return res.status(500).json({
        success: false,
        message: 'Error updating rooms',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      });
    }
  },

  getRoomConfigurations: async (req, res) => {
    const { propertyId } = req.params;

    try {
      // Get all property room types with their rooms and availability
      const propertyRoomTypes = await prisma.propertyRoomType.findMany({
        where: { 
          propertyId, 
          isDeleted: false 
        },
        include: {
          roomType: true,
          rooms: {
            where: { isDeleted: false },
            include: {
              availability: {
                where: { isDeleted: false },
                orderBy: { date: 'asc' }
              }
            },
            orderBy: { name: 'asc' }
          }
        }
      });

      // Transform data to match frontend format
      const roomConfigurations = propertyRoomTypes.map(prt => {
        const rooms = prt.rooms;
        if (rooms.length === 0) {
          return {
            propertyRoomTypeId: prt.id,
            namePrefix: prt.roomType.name,
            roomCount: 0,
            fromDate: null,
            toDate: null,
            hasRooms: false
          };
        }

        // Get date range from availability
        const allDates = rooms.flatMap(room => 
          room.availability.map(av => av.date.toISOString().split('T')[0])
        );
        
        const uniqueDates = [...new Set(allDates)].sort();
        const fromDate = uniqueDates[0] || null;
        const toDate = uniqueDates[uniqueDates.length - 1] || null;

        // Extract name prefix (remove numbers)
        const namePrefix = rooms[0]?.name.replace(/\s+\d+$/, '') || prt.roomType.name;

        return {
          propertyRoomTypeId: prt.id,
          namePrefix,
          roomCount: rooms.length,
          fromDate,
          toDate,
          hasRooms: true,
          rooms: rooms.map(room => ({
            id: room.id,
            name: room.name,
            availabilityCount: room.availability.length
          }))
        };
      });

      return res.status(200).json({
        success: true,
        data: roomConfigurations
      });

    } catch (err) {
      console.error('getRoomConfigurations error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching room configurations',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      });
    }
  },

  getRooms: async (req, res) => {
    try {
      const { propertyId } = req.params;
      const rooms = await prisma.room.findMany({
        where: { propertyId, isDeleted: false },
        include: {
          roomType: true,
          amenities: { where: { isDeleted: false }, include: { amenity: true } }
        },
        orderBy: { name: 'asc' }
      });
      res.json({ success: true, data: rooms });
    } catch (err) {
      console.error('getRooms:', err);
      res.status(500).json({ success: false, message: 'Error fetching rooms' });
    }
  },

  updateRoom: async (req, res) => {
    try {
      const { id } = req.params;
      const guard = await ensureNotDeleted(prisma.room, id, 'Room');
      if (guard.error) return res.status(404).json({ success: false, message: guard.error });

      const room = await prisma.room.update({
        where: { id },
        data: req.body,
        include: {
          roomType: true,
          amenities: { where: { isDeleted: false }, include: { amenity: true } }
        }
      });

      res.json({ success: true, message: 'Room updated', data: room });
    } catch (err) {
      console.error('updateRoom:', err);
      res.status(500).json({ success: false, message: 'Error updating room' });
    }
  },

  deleteRoom: async (req, res) => {
    try {
      const { id } = req.params;
      const guard = await ensureNotDeleted(prisma.room, id, 'Room');
      if (guard.error) return res.status(404).json({ success: false, message: guard.error });

      await prisma.room.update({ where: { id }, data: { isDeleted: true } });
      res.json({ success: true, message: 'Room deleted' });
    } catch (err) {
      console.error('deleteRoom:', err);
      res.status(500).json({ success: false, message: 'Error deleting room' });
    }
  },
   getPropertyRoomtype: async (req, res) => {
  try {
    const { propertyId } = req.params;
    if (!propertyId) {
      return res.status(400).json({ success: false, message: 'propertyId is required' });
    }

    const rows = await prisma.propertyRoomType.findMany({
      where: {
        propertyId,
        isDeleted: false,
      },
      include: {
        roomType: { select: { id: true, name: true } }, 
      },
      orderBy: { createdAt: 'asc' },
    });

    // Map to the shape your UI expects
    const data = rows.map(rt => ({
      propertyRoomTypeId: rt.id,                  // <-- this is what you’ll send back to apply special rates
      roomTypeId: rt.roomTypeId,
      propertyId: rt.propertyId,
      name: rt.roomType?.name ?? 'Unnamed',       // used in your UI to match by name
      basePrice: Number(rt.basePrice),            // Prisma Decimal -> number
      isActive: rt.isActive,
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error('getPropertyRoomTypes error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
};

// ========== HELPER FUNCTIONS ==========

// Generate array of dates between fromDate and toDate
const generateDateRange = (fromDate, toDate) => {
  const dates = [];
  const startDate = new Date(fromDate);
  const endDate = new Date(toDate);
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

// Create availability records for a room
const createAvailabilityForRoom = async (roomId, dateRange) => {
  const availabilities = dateRange.map(date => ({
    roomId,
    date: new Date(date),
    minNights: 1,
    status: 'available',
    isDeleted: false,
  }));

  await prisma.availability.createMany({
    data: availabilities,
    skipDuplicates: true,
  });
};

// Update availability for a room (add/remove dates as needed)
const updateRoomAvailability = async (roomId, newDateRange) => {
  // Get existing availability dates
  const existingAvailability = await prisma.availability.findMany({
    where: { 
      roomId, 
      isDeleted: false 
    },
    orderBy: { date: 'asc' }
  });

  const existingDates = existingAvailability.map(av => 
    av.date.toISOString().split('T')[0]
  );
  
  const newDates = newDateRange.map(date => 
    date.toISOString().split('T')[0]
  );

  // Find dates to delete (exist in DB but not in new range)
  const datesToDelete = existingDates.filter(date => !newDates.includes(date));
  
  // Find dates to add (exist in new range but not in DB)
  const datesToAdd = newDates.filter(date => !existingDates.includes(date));

  // Soft delete removed dates
  if (datesToDelete.length > 0) {
    const deleteDateObjects = datesToDelete.map(date => new Date(date));
    await prisma.availability.updateMany({
      where: {
        roomId,
        date: { in: deleteDateObjects },
        isDeleted: false
      },
      data: { isDeleted: true }
    });
  }

  // Add new dates
  if (datesToAdd.length > 0) {
    const newAvailabilityRecords = datesToAdd.map(date => ({
      roomId,
      date: new Date(date),
      minNights: 1,
      status: 'available',
      isDeleted: false,
    }));

    await prisma.availability.createMany({
      data: newAvailabilityRecords,
      skipDuplicates: true,
    });
  }
};

module.exports = PropertyController;
