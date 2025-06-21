const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema(
  {
    // Provider reference
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Basic service information
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['hotel', 'vehicle', 'tour', 'restaurant', 'flight', 'event', 'train'],
    },
    price: {
      type: Number,
      required: true,
    },
    
    // Hotel specific fields
    location: String,
    roomType: String,
    availableRooms: Number,
    
    // Tour specific fields
    duration: String,
    maxGroupSize: Number,
    
    // Vehicle specific fields
    vehicleType: String,
    capacity: Number,
    features: String,
    
    // Restaurant specific fields
    cuisineType: String,
    specialties: String,
    
    // Flight specific fields
    aircraftType: String,
    routes: String,
    from: String,           // Origin location/airport
    to: String,             // Destination location/airport
    arrivalTime: String,    // Arrival time
    departureTime: String,  // Departure time
    flightNumber: String,   // Flight identifier
    airline: String,        // Airline name
    
    // Event specific fields
    eventType: String,
    maxAttendees: Number,
    venue: String,
    
    // Train specific fields
    trainType: String,
    route: String,
    amenities: String,
    trainNumber: String,    // Train identifier
    classType: String,      // First class, Business, Economy
    maxBaggage: String,     // Baggage allowance
    cancelCharges: String,  // Cancellation charges
    availableSeats: Number, // Available seats
    
    // Common scheduling fields for trains and flights
    scheduleDate: String,   // Specific date for the service
    
    // Service status
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'suspended'],
      default: 'active',
    },
    
    // Additional metadata
    images: [String],
    featured: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for efficient querying
ServiceSchema.index({ providerId: 1, type: 1 });
ServiceSchema.index({ type: 1, status: 1 });
ServiceSchema.index({ from: 1, to: 1, type: 1 }); // For train/flight route searches

module.exports = mongoose.model("Service", ServiceSchema); 