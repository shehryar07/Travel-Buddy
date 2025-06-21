const Service = require("../models/Service");
const User = require("../models/userModel");

// Get all services by type (public endpoint for users to view services)
const getServicesByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { 
      location, 
      minPrice, 
      maxPrice, 
      limit = 20, 
      page = 1,
      featured 
    } = req.query;

    // Build query filter
    const filter = { 
      type, 
      status: 'active' 
    };

    // Add optional filters
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (featured === 'true') {
      filter.featured = true;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const services = await Service.find(filter)
      .populate('providerId', 'name email')
      .sort({ featured: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Service.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: services.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: services
    });

  } catch (error) {
    console.error("Error fetching services by type:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get service details by ID (public endpoint)
const getServiceDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findOne({ _id: id, status: 'active' })
      .populate('providerId', 'name email phone businessName businessPhone businessEmail');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found"
      });
    }

    res.status(200).json({
      success: true,
      data: service
    });

  } catch (error) {
    console.error("Error fetching service details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Search services across all types
const searchServices = async (req, res) => {
  try {
    const { 
      query, 
      type, 
      location, 
      minPrice, 
      maxPrice, 
      limit = 20, 
      page = 1 
    } = req.query;

    // Build search filter
    const filter = { status: 'active' };

    if (type) {
      filter.type = type;
    }

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const services = await Service.find(filter)
      .populate('providerId', 'name email businessName')
      .sort({ featured: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Service.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: services.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: services
    });

  } catch (error) {
    console.error("Error searching services:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get featured services for homepage
const getFeaturedServices = async (req, res) => {
  try {
    const { limit = 12 } = req.query;

    const services = await Service.find({ 
      featured: true, 
      status: 'active' 
    })
      .populate('providerId', 'name businessName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });

  } catch (error) {
    console.error("Error fetching featured services:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  getServicesByType,
  getServiceDetails,
  searchServices,
  getFeaturedServices
}; 