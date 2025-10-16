const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const path = require('path');

// Initialize express app
const app = express();
const port = process.env.PORT || 5000;

// Initialize Prisma client
const prisma = new PrismaClient();

// Import routes
let adminAuthRouter;
try {
  adminAuthRouter = require('./src/routes/adminRoutes/auth.routes');
} catch (error) {
  console.error('Error loading routes:', error);
  process.exit(1);
}
const PropertyRouter = require('./src/routes/adminRoutes/property.routes');
const HostRouter = require('./src/routes/adminRoutes/host.routes');
const AvailabilityRouter = require('./src/routes/adminRoutes/avalibility.routes');
const SpecialRateRoute   = require("./src/routes/adminRoutes/specialRate.routes")
const MealPlanRouter = require('./src/routes/adminRoutes/mealPlan.routes');
const propertyDetailsRoute = require('./src/routes/userRoutes/propertyDetials.routes');
const specialRateApplicationRoute = require('./src/routes/adminRoutes/specialRateApplication.routes');
const PropertyRoomTypeRoute = require('./src/routes/adminRoutes/propertyRoomTypes.routes');
const PropertycreateRoute = require('./src/routes/adminRoutes/propertycreation.routes');
const RateCalendarRoute = require('./src/routes/adminRoutes/rateCalendar.routes');
const roomtypeMealplanRoute = require('./src/routes/HostRoutes/roomtype_mealplan.routes');
 3// Enable CORS
app.use(cors({
  origin: ["http://localhost:5173", "https://zomesstay-web.onrender.com"],
  credentials: true
}));



// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/', (req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
}, AvailabilityRouter);
app.use('/', adminAuthRouter);
app.use('/', PropertyRouter);
app.use('/', HostRouter);
app.use('/', SpecialRateRoute)
app.use('/', MealPlanRouter);
app.use('/', propertyDetailsRoute);
app.use('/', specialRateApplicationRoute);
app.use('/', PropertyRoomTypeRoute);
app.use('/', PropertycreateRoute);
app.use('/', RateCalendarRoute);
app.use('/', roomtypeMealplanRoute);



app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Connect to database and start server
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Start the server
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to the database:', error);
    process.exit(1);
  }
}

// Start the application
startServer().catch(error => {
  console.error('Fatal error during startup:', error);
  process.exit(1);
});
