// src/controllers/adminController/host.controller.js
const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const { logout } = require('./auth.controller');
const jwt = require('jsonwebtoken');
const ALLOWED_FIELDS_HOST = ['email', 'password']; // don't accept role from client

const isValidRequest = (req, allowed) =>
  Object.keys(req.body || {}).every((k) => allowed.includes(k));

const HostController = {
  createHost: async (req, res) => {
    try {
      const { email, password, firstName, lastName, phone } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'email and password are required'
        });
      }

      const hashed = await bcrypt.hash(String(password), 10);

      const profileImage = req.file ? req.file.filename : null; 

      const host = await prisma.host.create({
        data: {
          email: String(email).toLowerCase().trim(),
          password: hashed,
          firstName: firstName || null,
          lastName: lastName || null,
          phone: phone || null,
          profileImage
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          profileImage: true,
          isVerified: true,
          createdAt: true
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Host created successfully',
        data: host
      });
    } catch (err) {
      console.error('Error creating host:', err);

      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }

      return res.status(500).json({
        success: false,
        message: err?.message || 'Error creating host'
      });
    }
  },

  hostLogin :async (req, res) => {

  try {

    if (!isValidRequest(req, ALLOWED_FIELDS_HOST)) {
      return res.status(400).json({ success: false, message: 'unauthorised request' });
    }

    const email = String(req.body.email || '').toLowerCase().trim();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }

    // 2) Look up host
    const host = await prisma.host.findUnique({ where: { email } });
    if (!host) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  console.log("host ",host)
    // 3) Verify password
    const ok = await bcrypt.compare(password, host.password);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const accessToken = jwt.sign(
      { id: host.id, role: 'host' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { id: host.id, tokenType: 'refresh', role: 'host' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    // 5) Set refresh cookie (same path as your refresh endpoint)
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in prod; false for localhost dev
      sameSite: 'lax',
      path: '/auth/refresh', // keep same as admin’s refresh endpoint
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // 6) Respond with access token + host profile
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token: accessToken,
        host: {
          id: host.id,
          email: host.email,
          firstName: host.firstName,
          lastName: host.lastName,
          phone: host.phone,
          profileImage: host.profileImage,
          isVerified: host.isVerified,
          role: 'host',
          createdAt: host.createdAt,
          updatedAt: host.updatedAt,
        },
      },
    });
  } catch (err) {
    console.error('Error logging in host:', err);
    return res.status(500).json({
      success: false,
      message: err?.message || 'Error logging in host',
    });
  }
},
  hostLogout: async (req, res) => {
  try {
    res.clearCookie("refresh_token");
    
    return res.status(200).json({
      success: true,
      message: "Logout successful"
    });
  } catch (error) {
    console.error('Error logging out:', error);
    return res.status(500).json({
      success: false,
      message: 'Error logging out'
    });
  }
},
hostPropertys: async (req, res) => {
  try {
    const { hostId } = req.params;
    if (!hostId) {
      return res.status(400).json({ success: false, message: 'Invalid host ID' });
    }

    const props = await prisma.property.findMany({
      where: { ownerHostId: hostId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      include: {
        propertyType: true,

        media: {
          where: { isDeleted: false },
          orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }, { createdAt: 'asc' }],
        },

        // join tables -> include the actual vocab
        amenities: {
          where: { isDeleted: false },
          include: { amenity: true },
        },
        facilities: {
          where: { isDeleted: false },
          include: { facility: true },
        },
        safeties: {
          where: { isDeleted: false },
          include: { safety: true }, // safety is SafetyHygiene
        },

        // global room type catalog linked to this property (M:N)
        roomTypes: {
          where: { isDeleted: false, status: 'active' },
          include: {
            amenities: {
              where: { isDeleted: false },
              include: { amenity: true },
            },
          },
        },

        // physical rooms inside this property
        rooms: {
          where: { isDeleted: false, status: 'active' },
          include: {
            roomType: true,
            amenities: {
              where: { isDeleted: false },
              include: { amenity: true },
            },
          },
        },

        promotions: {
          where: { isDeleted: false, status: 'active' },
        },

        reviews: {
          where: { isDeleted: false },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, firstname: true, lastname: true, profileImage: true } },
          },
        },

        _count: {
          select: {
            rooms: true,
            reviews: true,
            promotions: true,
          },
        },
      },
    });

    if (props.length === 0) {
      return res.status(404).json({ success: false, message: 'No properties found for this host' });
    }

    return res.status(200).json({
      success: true,
      message: 'Host properties retrieved successfully',
      data: props,
    });
  } catch (error) {
    console.error('Error fetching host properties:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching host properties',
      code: error.code,
      detail: error.meta || error.message,
    });
  }
}}
module.exports = HostController;
