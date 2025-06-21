const mongoose = require("mongoose");

const ServiceProviderRequestSchema = new mongoose.Schema(
  {
    // User reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Personal Details
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    
    // Business Details
    businessName: {
      type: String,
      required: true,
    },
    businessAddress: {
      type: String,
      required: true,
    },
    businessCity: {
      type: String,
      required: true,
    },
    businessState: {
      type: String,
      required: true,
    },
    businessZip: {
      type: String,
      required: true,
    },
    businessPhone: {
      type: String,
      required: true,
    },
    businessEmail: {
      type: String,
      required: true,
    },
    businessWebsite: {
      type: String,
    },
    
    // Documentation
    registrationNumber: {
      type: String,
      required: true,
    },
    licenseNumber: {
      type: String,
      required: true,
    },
    taxId: {
      type: String,
      required: true,
    },
    
    // Service Details
    providerType: {
      type: String,
      required: true,
      enum: ['hotel', 'vehicle', 'tour', 'restaurant', 'flight', 'event', 'train'],
    },
    serviceDetails: {
      type: String,
      required: true,
    },
    experience: {
      type: Number,
      required: true,
    },
    additionalInfo: {
      type: String,
    },
    
    // Status and Review
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    
    // Submission Details
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index to prevent duplicate applications for same user and provider type
ServiceProviderRequestSchema.index(
  { userId: 1, providerType: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'approved'] } }
  }
);

// Index for efficient querying
ServiceProviderRequestSchema.index({ userId: 1, status: 1 });
ServiceProviderRequestSchema.index({ status: 1, submittedAt: -1 });

module.exports = mongoose.model("ServiceProviderRequest", ServiceProviderRequestSchema); 