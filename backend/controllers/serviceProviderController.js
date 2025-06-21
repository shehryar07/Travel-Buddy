const ServiceProviderRequest = require("../models/ServiceProviderRequest");
const User = require("../models/userModel");

// Enhanced validation function
const validateProviderRequest = (data) => {
  const errors = {};
  const {
    firstName,
    lastName,
    email,
    phone,
    businessName,
    businessAddress,
    businessCity,
    businessState,
    businessZip,
    businessPhone,
    businessEmail,
    businessWebsite,
    registrationNumber,
    licenseNumber,
    taxId,
    providerType,
    serviceDetails,
    experience
  } = data;

  // Personal Information Validation
  if (!firstName || !firstName.trim()) {
    errors.firstName = "First name is required";
  }

  if (!lastName || !lastName.trim()) {
    errors.lastName = "Last name is required";
  }

  if (!email || !email.trim()) {
    errors.email = "Email address is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email address";
  }

  if (!phone || !phone.trim()) {
    errors.phone = "Phone number is required";
  } else if (!/^[0-9]{10}$/.test(phone.replace(/\D/g, ''))) {
    errors.phone = "Please enter a valid 10-digit phone number";
  }

  // Business Information Validation
  if (!businessName || !businessName.trim()) {
    errors.businessName = "Business name is required";
  }

  if (!businessAddress || !businessAddress.trim()) {
    errors.businessAddress = "Business address is required";
  }

  if (!businessCity || !businessCity.trim()) {
    errors.businessCity = "Business city is required";
  }

  if (!businessState || !businessState.trim()) {
    errors.businessState = "Business state is required";
  }

  if (!businessZip || !businessZip.trim()) {
    errors.businessZip = "ZIP code is required";
  } else if (!/^[0-9]{5}(-[0-9]{4})?$/.test(businessZip)) {
    errors.businessZip = "Please enter a valid ZIP code";
  }

  if (!businessPhone || !businessPhone.trim()) {
    errors.businessPhone = "Business phone number is required";
  } else if (!/^[0-9]{10}$/.test(businessPhone.replace(/\D/g, ''))) {
    errors.businessPhone = "Please enter a valid 10-digit business phone number";
  }

  if (!businessEmail || !businessEmail.trim()) {
    errors.businessEmail = "Business email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessEmail)) {
    errors.businessEmail = "Please enter a valid business email address";
  }

  // Business website is optional, but if provided, validate format
  if (businessWebsite && businessWebsite.trim() && !/^https?:\/\/.+\..+/.test(businessWebsite)) {
    errors.businessWebsite = "Please enter a valid website URL";
  }

  // Documentation Validation
  if (!registrationNumber || !registrationNumber.trim()) {
    errors.registrationNumber = "Business registration number is required";
  } else if (registrationNumber.length < 5) {
    errors.registrationNumber = "Please enter a valid business registration number";
  }

  if (!licenseNumber || !licenseNumber.trim()) {
    errors.licenseNumber = "License number is required";
  } else if (licenseNumber.length < 3) {
    errors.licenseNumber = "Please enter a valid license number";
  }

  if (!taxId || !taxId.trim()) {
    errors.taxId = "Tax ID is required";
  } else if (!/^[0-9]{9,12}$/.test(taxId)) {
    errors.taxId = "Please enter a valid tax ID (9-12 digits)";
  }

  if (!providerType || !providerType.trim()) {
    errors.providerType = "Service provider type is required";
  }

  if (!serviceDetails || !serviceDetails.trim()) {
    errors.serviceDetails = "Service details are required";
  }

  if (!experience) {
    errors.experience = "Years of experience is required";
  } else if (isNaN(experience) || parseFloat(experience) < 0) {
    errors.experience = "Please enter a valid number of years of experience";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Submit a new service provider request
const submitProviderRequest = async (req, res) => {
  try {
    console.log('=== Service Provider Request Submission ===');
    console.log('Request body:', req.body);
    console.log('User from token:', req.user);
    
    const {
      firstName,
      lastName,
      email,
      phone,
      businessName,
      businessAddress,
      businessCity,
      businessState,
      businessZip,
      businessPhone,
      businessEmail,
      businessWebsite,
      registrationNumber,
      licenseNumber,
      taxId,
      providerType,
      serviceDetails,
      experience,
      additionalInfo,
      userId
    } = req.body;

    // Enhanced validation with specific field errors
    console.log('Starting validation...');
    const validation = validateProviderRequest(req.body);
    console.log('Validation result:', validation);
    
    if (!validation.isValid) {
      const errorFields = Object.keys(validation.errors);
      const firstError = validation.errors[errorFields[0]];
      
      console.log('Validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        message: `Validation failed: ${firstError}`,
        errors: validation.errors,
        fieldErrors: validation.errors // For compatibility with frontend
      });
    }

    console.log('Validation passed, checking existing requests...');
    // Check if user already has a pending or approved request for this specific provider type
    const existingRequest = await ServiceProviderRequest.findOne({
      userId: req.user.id,
      providerType: providerType,
      status: { $in: ['pending', 'approved'] }
    });

    console.log('Existing request check for provider type:', existingRequest);
    if (existingRequest) {
      console.log(`User already has a ${existingRequest.status} request for ${providerType}`);
      return res.status(400).json({
        success: false,
        message: `You already have a ${existingRequest.status} service provider request for ${providerType}. You can apply for other service types separately.`
      });
    }

    console.log('Creating new service provider request...');
    // Create new service provider request
    const newRequest = new ServiceProviderRequest({
      userId: req.user.id,
      firstName,
      lastName,
      email,
      phone,
      businessName,
      businessAddress,
      businessCity,
      businessState,
      businessZip,
      businessPhone,
      businessEmail,
      businessWebsite,
      registrationNumber,
      licenseNumber,
      taxId,
      providerType,
      serviceDetails,
      experience,
      additionalInfo,
      status: 'pending'
    });

    console.log('New request object created:', newRequest);
    console.log('Attempting to save to database...');
    
    const savedRequest = await newRequest.save();
    console.log('Successfully saved to database!');
    console.log('Saved request:', savedRequest);

    res.status(201).json({
      success: true,
      message: "Service provider request submitted successfully",
      data: savedRequest
    });

  } catch (error) {
    console.error("=== ERROR in submitProviderRequest ===");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get all service provider requests (Admin only)
const getAllProviderRequests = async (req, res) => {
  try {
    const requests = await ServiceProviderRequest.find()
      .populate('userId', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });

  } catch (error) {
    console.error("Error fetching provider requests:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get service provider request by ID
const getProviderRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ServiceProviderRequest.findById(id)
      .populate('userId', 'name email')
      .populate('reviewedBy', 'name email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Service provider request not found"
      });
    }

    res.status(200).json({
      success: true,
      data: request
    });

  } catch (error) {
    console.error("Error fetching provider request:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Approve service provider request (Admin only)
const approveProviderRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const request = await ServiceProviderRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Service provider request not found"
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "Request has already been processed"
      });
    }

    // Update request status
    request.status = 'approved';
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();

    await request.save();

    // Update user to add the new provider type to their approved types
    const user = await User.findById(request.userId);
    
    // Set user type to provider if not already
    if (user.type !== 'provider') {
      user.type = 'provider';
    }
    
    // Add the new provider type if not already present
    if (!user.providerTypes.includes(request.providerType)) {
      user.providerTypes.push(request.providerType);
    }
    
    // For backward compatibility, set providerType to the first approved type
    if (!user.providerType) {
      user.providerType = request.providerType;
    }
    
    await user.save();

    res.status(200).json({
      success: true,
      message: "Service provider request approved successfully",
      data: request
    });

  } catch (error) {
    console.error("Error approving provider request:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Reject service provider request (Admin only)
const rejectProviderRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required"
      });
    }

    const request = await ServiceProviderRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Service provider request not found"
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "Request has already been processed"
      });
    }

    // Update request status
    request.status = 'rejected';
    request.rejectionReason = reason;
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();

    await request.save();

    res.status(200).json({
      success: true,
      message: "Service provider request rejected successfully",
      data: request
    });

  } catch (error) {
    console.error("Error rejecting provider request:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get user's own service provider requests
const getUserProviderRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await ServiceProviderRequest.find({ userId })
      .populate('reviewedBy', 'name email')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });

  } catch (error) {
    console.error("Error fetching user provider requests:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  submitProviderRequest,
  getAllProviderRequests,
  getProviderRequestById,
  approveProviderRequest,
  rejectProviderRequest,
  getUserProviderRequests
}; 