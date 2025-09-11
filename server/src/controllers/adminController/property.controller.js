// controllers/PropertyController.js
const { PrismaClient } = require('@prisma/client');
const { log, Console } = require('console');
const prisma = new PrismaClient();
const path = require('path');

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

/* -------------------------- controller -------------------------- */
const PropertyController = {
  // ========== AMENITIES ==========
  createAmenity: async (req, res) => {
    try {
      const { name, isActive = true } = req.body;
      const icon = req.file ? `/uploads/amenities/${req.file.filename}` : null;

      const amenity = await prisma.amenity.create({
        data: { name, icon, isActive: parseBool(isActive, true) }
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

      const { name, isActive } = req.body;
      const icon = req.file ? `/uploads/amenities/${req.file.filename}` : undefined;

      const amenity = await prisma.amenity.update({
        where: { id },
        data: {
          ...(name && { name }),
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
      const { name } = req.body;
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
createProperty: async (req, res) => {
  let uploadedFiles = [];
  
  try {
    // Store uploaded files for potential cleanup
    uploadedFiles = req.files || [];
    
    // ----------- READ/VALIDATE BASIC FIELDS -----------
    const {
      title,
      ownerHostId,
      propertyTypeId,
      amenityIds = [],
      facilityIds = [],
      safetyIds = [],
      roomTypeIds = [],
      coverImageIndex = 0,
      status,
      description,
      rulesAndPolicies,
      location
    } = req.body;

    // Basic validation
    if (!title || !ownerHostId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and ownerHostId are required' 
      });
    }

    if (!req.files || !req.files.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one media file is required' 
      });
    }

    // ----------- NORMALIZE ROOMS -----------
    const roomsRaw = normalizeToArray(req.body.rooms);

    const parsedRooms = roomsRaw.map((s, i) => {
      const obj = parseJSON(s, s); // if already object, keep as is
      if (!obj || typeof obj !== 'object') {
        throw new Error(`rooms[${i}] is not valid JSON/object`);
      }
      return obj;
    });

    const rooms = [...parsedRooms];

    if (!rooms.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one room is required' 
      });
    }

    // Additional validation for reasonable limits
    if (rooms.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Too many rooms (maximum 100 allowed)'
      });
    }

    // Validate room data
    for (const [index, room] of rooms.entries()) {
      if (!room.roomTypeId) {
        return res.status(400).json({
          success: false,
          message: `Room ${index + 1}: roomTypeId is required`
        });
      }
      
      if (room.price && (isNaN(room.price) || Number(room.price) < 0)) {
        return res.status(400).json({
          success: false,
          message: `Room ${index + 1}: Price must be a non-negative number`
        });
      }
      
      if (room.maxOccupancy && (isNaN(room.maxOccupancy) || Number(room.maxOccupancy) <= 0)) {
        return res.status(400).json({
          success: false,
          message: `Room ${index + 1}: Max occupancy must be a positive number`
        });
      }
      
      if (room.spaceSqft && (isNaN(room.spaceSqft) || Number(room.spaceSqft) <= 0)) {
        return res.status(400).json({
          success: false,
          message: `Room ${index + 1}: Space sqft must be a positive number`
        });
      }
    }

    // ----------- PRE-VALIDATION OUTSIDE TX -----------
    const toIdArray = (v) => {
      if (v == null) return [];
      if (Array.isArray(v)) return v.filter(Boolean);

      if (typeof v === 'string') {
        const s = v.trim();
        if (!s) return [];
        // JSON array string?
        const parsed = parseJSON(s, null);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
        // Comma-separated?
        if (s.includes(',')) return s.split(',').map(x => x.trim()).filter(Boolean);
        // Single id
        return [s];
      }
      return [];
    };

    const amenityList = Array.from(new Set(toIdArray(amenityIds)));
    const facilityList = Array.from(new Set(toIdArray(facilityIds)));
    const safetyList = Array.from(new Set(toIdArray(safetyIds)));
    const propRoomTypes = Array.from(new Set(toIdArray(roomTypeIds)));

    const roomRTsFromRooms = Array.from(new Set(rooms.map(r => r.roomTypeId).filter(Boolean)));

    // Validate host
    {
      const host = await prisma.host.findUnique({
        where: { id: ownerHostId },
        select: { id: true, isDeleted: true }
      });
      if (!host || host.isDeleted) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid ownerHostId' 
        });
      }
    }

    // Validate property type (optional)
    if (propertyTypeId) {
      const pt = await prisma.propertyType.findUnique({
        where: { id: propertyTypeId },
        select: { id: true, isDeleted: true }
      });
      if (!pt || pt.isDeleted) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid propertyTypeId' 
        });
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
      const missing = [...new Set(ids)].filter(id => !ok.has(id));
      if (missing.length) {
        throw new Error(`Invalid ${label} id(s): ${missing.join(', ')}`);
      }
    };

    await mustExist(prisma.amenity, amenityList, 'amenity');
    await mustExist(prisma.facility, facilityList, 'facility');
    await mustExist(prisma.safetyHygiene, safetyList, 'safety');
    await mustExist(prisma.roomType, propRoomTypes, 'roomType');
    await mustExist(prisma.roomType, roomRTsFromRooms, 'roomType (in rooms)');

    // Prevent duplicates
    {
      const existing = await prisma.property.findFirst({
        where: { title, ownerHostId, isDeleted: false },
        select: { id: true }
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'A property with this title already exists for this host.'
        });
      }
    }

    // ----------- PREP FILES (works with upload.any()) -----------
    const filesByField = (req.files || []).reduce((acc, f) => {
      (acc[f.fieldname] ||= []).push(f);
      return acc;
    }, {});

    const propMediaFiles = filesByField['media'] || [];
    
    // Validate file types and sizes
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/mov'];
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    
    for (const file of propMediaFiles) {
      if (!allowedImageTypes.includes(file.mimetype) && !allowedVideoTypes.includes(file.mimetype)) {
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

    const propertyMedia = propMediaFiles.map((f, idx) => {
      const url = fileToUrl(req, f);
      return {
        url,
        type: f.mimetype?.startsWith('image/') ? 'image' : 'video',
        isFeatured: Number(coverImageIndex) === idx,
        order: idx
      };
    });

    const coverImage =
      propertyMedia.find(m => m.isFeatured)?.url
      ?? propertyMedia[0]?.url
      ?? null;

    // ----------- DO ALL WRITES IN ONE TRANSACTION -----------
    const result = await prisma.$transaction(async (tx) => {
      const { id: propertyId } = await tx.property.create({
        data: {
          title,
          description: description ?? null,
          rulesAndPolicies: rulesAndPolicies ?? null,
          status: status ?? 'active',
          location: parseJSON(location, null),
          ownerHostId,
          propertyTypeId: propertyTypeId || null,
          coverImage,
          ...(propRoomTypes.length && { 
            roomTypes: { connect: propRoomTypes.map(id => ({ id })) } 
          }),
        },
        select: { id: true }
      });

      const createdRooms = [];
      for (const [index, roomDataRaw] of rooms.entries()) {
        const roomData = typeof roomDataRaw === 'string'
          ? parseJSON(roomDataRaw, {})
          : roomDataRaw || {};

        if (!roomData.roomTypeId) {
          throw new Error(`rooms[${index}].roomTypeId is required`);
        }

        const uploads = filesByField[`roomImages_${index}`] || [];
        
        // Validate room image files
        for (const file of uploads) {
          if (!allowedImageTypes.includes(file.mimetype)) {
            throw new Error(`Invalid room image type: ${file.mimetype} for room ${index + 1}`);
          }
          
          if (file.size > maxFileSize) {
            throw new Error(`Room image too large for room ${index + 1}: ${file.originalname}`);
          }
        }
        
        const uploadedImages = uploads.map((f, idx) => ({
          url: fileToUrl(req, f),
          isFeatured: idx === 0,
          caption: `Room Image ${idx + 1}`,
          order: idx
        }));

        let existingImages = roomData.existingImages || [];
        if (typeof existingImages === 'string') {
          existingImages = parseJSON(existingImages, []);
        }
        if (!Array.isArray(existingImages)) existingImages = [];
        
        const existingImagesData = existingImages.map((url, idx) => ({
          url,
          isFeatured: idx === 0 && uploadedImages.length === 0,
          caption: `Room Image ${uploadedImages.length + idx + 1}`,
          order: uploadedImages.length + idx
        }));

        const roomImages = [...uploadedImages, ...existingImagesData];

        const room = await tx.room.create({
          data: {
            propertyId,
            roomTypeId: roomData.roomTypeId,
            name: roomData.name || `Room ${index + 1}`,
            code: roomData.code || null,
            spaceSqft: roomData.spaceSqft ? parseInt(roomData.spaceSqft, 10) : null,
            maxOccupancy: roomData.maxOccupancy ? parseInt(roomData.maxOccupancy, 10) : 2,
            price: roomData.price ? Number(roomData.price) : 0,
            images: roomImages,
            status: roomData.status || 'active',
          },
          include: { roomType: true }
        });

        // CHANGED: normalize room amenity IDs with toIdArray
        const roomAmenityIds = toIdArray(roomData.amenityIds);
        if (roomAmenityIds.length) {
          await tx.roomAmenity.createMany({
            data: Array.from(new Set(roomAmenityIds)).map(amenityId => ({
              roomId: room.id,
              amenityId
            }))
          });
        }

        createdRooms.push(room);
      }

      if (amenityList.length) {
        await tx.propertyAmenity.createMany({
          data: amenityList.map(amenityId => ({ propertyId, amenityId }))
        });
      }
      
      if (facilityList.length) {
        await tx.propertyFacility.createMany({
          data: facilityList.map(facilityId => ({ propertyId, facilityId }))
        });
      }
      
      if (safetyList.length) {
        await tx.propertySafety.createMany({
          data: safetyList.map(safetyId => ({ propertyId, safetyId }))
        });
      }

      if (propertyMedia.length) {
        await tx.propertyMedia.createMany({
          data: propertyMedia.map(m => ({
            propertyId,
            url: m.url,
            type: m.type,
            isFeatured: m.isFeatured,
            order: m.order
          }))
        });
      }

      const property = await tx.property.findUnique({
        where: { id: propertyId },
        include: {
          amenities: { include: { amenity: true } },
          facilities: { include: { facility: true } },
          safeties: { include: { safety: true } },
          roomTypes: true,
          media: true,
          rooms: {
            include: {
              roomType: true,
              amenities: { include: { amenity: true } }
            }
          }
        }
      });

      return { property };
    }, {
      timeout: 30000, // 30 seconds timeout for large operations
      isolationLevel: 'Serializable' // Highest isolation level
    }); // rollback on any throw

    // Success - files are now committed with the database transaction
    return res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: result
    });

  } catch (err) {
    console.error('createProperty Error:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      timestamp: new Date().toISOString(),
      userId: req.user?.id,
      hostId: req.body?.ownerHostId
    });

    // Clean up uploaded files on any error
    if (uploadedFiles.length > 0) {
      try {
        // If you have a cleanup function, uncomment and implement:
        // await cleanupUploadedFiles(uploadedFiles);
        console.log('Files would be cleaned up here:', uploadedFiles.map(f => f.filename));
      } catch (cleanupErr) {
        console.error('File cleanup error:', cleanupErr);
      }
    }

    // Handle specific Prisma errors
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'A resource with this data already exists',
        error: 'DUPLICATE_RESOURCE'
      });
    }

    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reference to related data',
        error: 'FOREIGN_KEY_CONSTRAINT'
      });
    }

    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Related record not found',
        error: 'RECORD_NOT_FOUND'
      });
    }

    // Handle transaction timeout
    if (err.message?.includes('timeout') || err.code === 'P2024') {
      return res.status(408).json({
        success: false,
        message: 'Operation timed out. Please try again.',
        error: 'TIMEOUT'
      });
    }

    // Handle validation errors (our custom errors)
    if (err.message?.includes('rooms[') || 
        err.message?.includes('Invalid') || 
        err.message?.includes('required') ||
        err.message?.includes('Room ')) {
      return res.status(400).json({
        success: false,
        message: err.message,
        error: 'VALIDATION_ERROR'
      });
    }

    // Handle file-related errors
    if (err.message?.includes('file') || err.message?.includes('File')) {
      return res.status(400).json({
        success: false,
        message: err.message,
        error: 'FILE_ERROR'
      });
    }

    // Generic server error
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred. Please try again later.',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
},


getProperties: async (req, res) => {
  try {
    const { page, limit, skip, take } = pickPagination(req);
    const { search } = req.query;

    const where = {
      isDeleted: false,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          propertyType: { where: { isDeleted: false } },

          // property-level
          amenities: {
            where: { isDeleted: false, amenity: { isDeleted: false } },
            include: { amenity: true }
          },
          facilities: {
            where: { isDeleted: false, facility: { isDeleted: false } },
            include: { facility: true }
          },
          safeties: {
            where: { isDeleted: false, safety: { isDeleted: false } },
            include: { safety: true }
          },

          roomTypes: { where: { isDeleted: false } },

          // rooms with full details
          rooms: {
            where: { isDeleted: false },
            include: {
              roomType: true,
              amenities: {
                where: { isDeleted: false, amenity: { isDeleted: false } },
                include: { amenity: true }
              },
              availability: { where: { isDeleted: false } } // keep or remove as needed
            }
          },

          media: { where: { isDeleted: false } }
        }
      }),
      prisma.property.count({ where })
    ]);

    res.json({
      success: true,
      data: properties,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('getProperties:', err);
    res.status(500).json({ success: false, message: 'Error fetching properties' });
  }
},



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
          rooms: {
            where: { isDeleted: false },
            include: {
              roomType: true,
              amenities: { where: { isDeleted: false }, include: { amenity: true } }
            }
          },
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
        const host = await prisma.user.findUnique({
          where: { id: ownerHostId },
          select: { id: true, isDeleted: true }
        });
        if (!host || host.isDeleted) {
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid ownerHostId' 
          });
        }
      }

      // Validate property type
      if (propertyTypeId) {
        const pt = await prisma.propertyType.findUnique({
          where: { id: propertyTypeId },
          select: { id: true, isDeleted: true }
        });
        if (!pt || pt.isDeleted) {
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid propertyTypeId' 
          });
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
        const missing = [...new Set(ids)].filter(id => !ok.has(id));
        if (missing.length) {
          throw new Error(`Invalid ${label} id(s): ${missing.join(', ')}`);
        }
      };

      await mustExist(prisma.amenity, amenityList, 'amenity');
      await mustExist(prisma.facility, facilityList, 'facility');
      await mustExist(prisma.safetyHygiene, safetyList, 'safety');
      await mustExist(prisma.roomType, roomTypeList, 'roomType');

      // Handle files
      const filesByField = (req.files || []).reduce((acc, f) => {
        (acc[f.fieldname] ||= []).push(f);
        return acc;
      }, {});

      const newMediaFiles = filesByField['media'] || [];
      
      // Validate file types and sizes
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/mov'];
      const maxFileSize = 50 * 1024 * 1024; // 50MB
      
      for (const file of newMediaFiles) {
        if (!allowedImageTypes.includes(file.mimetype) && !allowedVideoTypes.includes(file.mimetype)) {
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

      // Process media files
      const newPropertyMedia = newMediaFiles.map((f, idx) => {
        const url = fileToUrl(req, f);
        return {
          url,
          type: f.mimetype?.startsWith('image/') ? 'image' : 'video',
          isFeatured: Number(coverImageIndex) === (existingMediaList.length + idx),
          order: existingMediaList.length + idx
        };
      });

      // Process existing media
      const existingPropertyMedia = existingMediaList.map((url, idx) => ({
        url,
        type: 'image', // assume existing are images
        isFeatured: Number(coverImageIndex) === idx && newMediaFiles.length === 0,
        order: idx
      }));

      const allPropertyMedia = [...existingPropertyMedia, ...newPropertyMedia];
      const coverImage = allPropertyMedia.find(m => m.isFeatured)?.url || allPropertyMedia[0]?.url || null;

      // Update in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update basic property data
        const updatedProperty = await tx.property.update({
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
            data: allPropertyMedia.map(media => ({
              propertyId: id,
              ...media
            }))
          });
        }

        // Handle room updates
        if (roomsData.length) {
          // For simplicity, delete existing rooms and recreate
          // In production, you might want more sophisticated room updating
          await tx.roomAmenity.deleteMany({ 
            where: { room: { propertyId: id } }
          });
          await tx.room.deleteMany({ where: { propertyId: id } });

          // Process each room
          for (const [index, roomDataRaw] of roomsData.entries()) {
            const roomData = typeof roomDataRaw === 'string'
              ? parseJSON(roomDataRaw, {})
              : roomDataRaw || {};

            if (!roomData.roomTypeId) {
              throw new Error(`rooms[${index}].roomTypeId is required`);
            }

            // Handle room images
            const newRoomImages = filesByField[`rooms[${index}][newImages]`] || [];
            const existingRoomImages = normalizeToArray(roomData.existingImages || []);

            // Validate room image files
            for (const file of newRoomImages) {
              if (!allowedImageTypes.includes(file.mimetype)) {
                throw new Error(`Invalid room image type: ${file.mimetype} for room ${index + 1}`);
              }
              
              if (file.size > maxFileSize) {
                throw new Error(`Room image too large for room ${index + 1}: ${file.originalname}`);
              }
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

            // Create room
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

            // Handle room amenities
            const roomAmenityIds = normalizeToArray(roomData.amenityIds || []);
            if (roomAmenityIds.length) {
              await tx.roomAmenity.createMany({
                data: Array.from(new Set(roomAmenityIds)).map(amenityId => ({
                  roomId: room.id,
                  amenityId
                }))
              });
            }
          }
        }

        // Return updated property with all relations
        return await tx.property.findUnique({
          where: { id },
          include: {
            propertyType: { where: { isDeleted: false } },
            amenities: { 
              where: { isDeleted: false }, 
              include: { amenity: { where: { isDeleted: false } } } 
            },
            facilities: { 
              where: { isDeleted: false }, 
              include: { facility: { where: { isDeleted: false } } } 
            },
            safeties: { 
              where: { isDeleted: false }, 
              include: { safety: { where: { isDeleted: false } } } 
            },
            roomTypes: { where: { isDeleted: false } },
            rooms: { 
              where: { isDeleted: false },
              include: {
                roomType: { where: { isDeleted: false } },
                amenities: { 
                  where: { isDeleted: false }, 
                  include: { amenity: { where: { isDeleted: false } } } 
                }
              }
            },
            media: { where: { isDeleted: false } },
            ownerHost: { where: { isDeleted: false } }
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
    try {
      const { propertyId } = req.params;
      const { roomTypeId, name, code, spaceSqft, maxOccupancy, price, status } = req.body;
      console.log('req.body:', req.body);
      

      if (!propertyId || !roomTypeId || !name) {
        return res.status(400).json({ success: false, message: 'propertyId, roomTypeId, and name are required' });
      }

      const property = await prisma.property.findFirst({ where: { id: propertyId, isDeleted: false } });
      if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

      let imagesData = null;
      if (req.files && req.files.length > 0) {
        imagesData = req.files.map((file, index) => ({
          url: `/uploads/rooms/${file.filename}`,
          isFeatured: index === 0,
          caption: `Image ${index + 1}`,
          order: index
        }));
      }

      const room = await prisma.room.create({
        data: {
          propertyId,
          roomTypeId,
          name,
          code: code || null,
          spaceSqft: spaceSqft ? parseInt(spaceSqft) : null,
          maxOccupancy: Number(maxOccupancy) || 1,
          price: price ? Number(price).toFixed(2) : '0.00',
          images: imagesData,
          status: status || 'active'
        },
        include: {
          roomType: true,
          property: { select: { id: true, title: true } }
        }
      });

      res.status(201).json({ success: true, message: 'Room added', data: room });
    } catch (err) {
      console.error('addRooms:', err);
      res.status(500).json({ success: false, message: err?.message || 'Error adding room' });
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
  }
};

module.exports = PropertyController;
