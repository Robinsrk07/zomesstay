// src/routes/adminRoutes/host.routes.js
const express = require('express');
const HostRoute = express.Router();
const { uploadImage } = require('../../config/multer');
const HostController = require('../../controllers/adminController/host.controller');

// Create Host (multipart or JSON). If sending an image, use field name: profileImage
HostRoute.post('/create-host', uploadImage.single('profileImage'), HostController.createHost);
HostRoute.post('/host-login', HostController.hostLogin);
HostRoute.post('/host-logout', HostController.hostLogout);
HostRoute.get('/host-properties/:hostId', HostController.hostPropertys);
module.exports = HostRoute;
