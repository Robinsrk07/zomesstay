const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware to check if user is authenticated
const isAuthenticated = async (req, res, next) => {
  try {
    // In a real app, you would verify JWT token here
    const adminId = req.headers['x-admin-id'];
    
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId, status: 'ACTIVE' }
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive admin account'
      });
    }

    // Attach admin to request object
    req.admin = admin;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Middleware to check user role
const checkRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
};

module.exports = {
  isAuthenticated,
  checkRole
};
