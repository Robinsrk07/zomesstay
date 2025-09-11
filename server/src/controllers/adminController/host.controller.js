// src/controllers/adminController/host.controller.js
const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

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

      // hash password
      const hashed = await bcrypt.hash(String(password), 10);

      // optional profile image from multer
      const profileImage = req.file ? req.file.filename : null; // or `/uploads/images/${req.file.filename}`

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

      // handle unique email error
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
  }
};

module.exports = HostController;
