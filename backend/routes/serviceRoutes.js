const express = require("express");
const {
  getServicesByType,
  getServiceDetails,
  searchServices,
  getFeaturedServices
} = require("../controllers/serviceController");

const router = express.Router();

// Public routes (no authentication required)
router.get('/search', searchServices);           // GET /api/services/search
router.get('/featured', getFeaturedServices);   // GET /api/services/featured
router.get('/:type', getServicesByType);        // GET /api/services/hotel, /api/services/tour, etc.
router.get('/details/:id', getServiceDetails);  // GET /api/services/details/:id

module.exports = router; 