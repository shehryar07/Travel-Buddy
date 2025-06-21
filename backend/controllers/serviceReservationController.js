const ServiceReservation = require("../models/ServiceReservation");
const Service = require("../models/Service");
const User = require("../models/userModel");
const { createNotificationHelper } = require("./notificationController");

// Create a new reservation (customer endpoint)
const createReservation = async (req, res) => {
  try {
    const customerId = req.user?.id;
    const {
      serviceId,
      checkInDate,
      checkOutDate,
      guests,
      customerName,
      customerEmail,
      customerPhone,
      rooms,
      roomType,
      groupSize,
      vehicleType,
      eventType,
      specialRequests
    } = req.body;

    // Validate required fields
    if (!serviceId || !checkInDate || !checkOutDate || !customerName || !customerEmail || !customerPhone) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Get service details
    const service = await Service.findById(serviceId).populate('providerId');
    if (!service || service.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: "Service not found or not available"
      });
    }

    // Calculate total amount
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const units = rooms || guests || 1;
    const totalAmount = service.price * days * units;

    // Create reservation
    const reservation = new ServiceReservation({
      customerId,
      serviceId,
      providerId: service.providerId._id,
      checkInDate,
      checkOutDate,
      guests,
      customerName,
      customerEmail,
      customerPhone,
      rooms,
      roomType,
      groupSize,
      vehicleType,
      eventType,
      specialRequests,
      totalAmount,
      pricePerUnit: service.price
    });

    const savedReservation = await reservation.save();
    
    // Populate the saved reservation
    await savedReservation.populate([
      { path: 'serviceId', select: 'name type location' },
      { path: 'providerId', select: 'name businessName businessEmail businessPhone' }
    ]);

    // Send notification to provider about new booking
    try {
      await createNotificationHelper(
        service.providerId._id,
        'New Service Booking',
        `You have a new booking request for ${service.name} from ${customerName}. Check-in: ${new Date(checkInDate).toLocaleDateString()}. Total: Rs. ${totalAmount.toLocaleString()}`,
        'new_service_booking',
        {
          reservationId: savedReservation._id,
          serviceName: service.name,
          customerName,
          checkInDate,
          totalAmount
        }
      );
    } catch (notifError) {
      console.error('Error sending notification to provider:', notifError);
    }

    res.status(201).json({
      success: true,
      message: "Reservation created successfully",
      data: savedReservation
    });

  } catch (error) {
    console.error("Error creating reservation:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get reservations for a provider
const getProviderReservations = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { status, page = 1, limit = 20, type } = req.query;

    let allReservations = [];

    // Fetch service reservations
    if (!type || type === 'service') {
      const filter = { providerId };
      if (status) {
        filter.status = status;
      }

      const serviceReservations = await ServiceReservation.find(filter)
        .populate('serviceId', 'name type location')
        .populate('customerId', 'name email')
        .sort({ createdAt: -1 });

      allReservations = allReservations.concat(serviceReservations);
    }

    // Fetch tour reservations for tour owners
    if (!type || type === 'tour') {
      const TourReservation = require('../models/tourBook');
      const Tours = require('../models/tours');
      const User = require('../models/userModel');
      
      console.log('Searching for tour reservations owned by user:', providerId);
      
      // Get user's email to match against tour ownership
      const currentUser = await User.findById(providerId);
      const userEmail = currentUser?.email;
      
      console.log('User email for tour matching:', userEmail);
      
      // Find tour reservations where the user is the tour owner
      // Tour ownership is stored as email in tourOwnerId field
      const tourReservations = await TourReservation.find({ 
        $or: [
          { tourOwnerId: providerId.toString() },
          { tourOwnerId: userEmail }
        ]
      }).sort({ createdAt: -1 });
      
      console.log('Found tour reservations:', tourReservations.length);

      // Convert tour reservations to service reservation format
      for (const tReservation of tourReservations) {
        try {
          const [tour, customer] = await Promise.all([
            Tours.findById(tReservation.tourId),
            User.findOne({ email: tReservation.customerEmail })
          ]);

          if (tour) {
            const convertedReservation = {
              _id: tReservation._id,
              customerId: customer ? {
                _id: customer._id,
                name: customer.name,
                email: customer.email
              } : {
                _id: tReservation.customerId,
                name: tReservation.customerName,
                email: tReservation.customerEmail
              },
              serviceId: {
                _id: tour._id,
                name: tour.name,
                type: 'tour',
                location: tour.cities || tour.category
              },
              checkInDate: tReservation.tourDate,
              checkOutDate: tReservation.tourDate, // Tours are typically single day
              guests: tReservation.guests,
              customerName: tReservation.customerName,
              customerEmail: tReservation.customerEmail,
              customerPhone: tReservation.customerPhone,
              totalAmount: tReservation.totalAmount,
              pricePerUnit: tReservation.tourPrice,
              status: tReservation.status || 'pending',
              createdAt: tReservation.createdAt,
              updatedAt: tReservation.updatedAt,
              isTourReservation: true,
              tourDate: tReservation.tourDate,
              specialRequests: tReservation.specialRequests,
              confirmationNumber: tReservation.confirmationNumber,
              rejectionReason: tReservation.rejectionReason,
              responseDate: tReservation.responseDate
            };

            // Apply status filter if needed
            if (!status || convertedReservation.status === status) {
              allReservations.push(convertedReservation);
            }
          }
        } catch (error) {
          console.error('Error converting tour reservation for provider:', error);
        }
      }
    }

    // Fetch legacy vehicle reservations for vehicle owners
    if (!type || type === 'vehicle') {
      const VehicleReservation = require('../models/VehicleReservation');
      const Vehicle = require('../models/Vehicle');
      const User = require('../models/userModel');
      
      console.log('Searching for vehicles owned by user:', providerId);
      
      // First find all vehicles owned by this user
      const ownedVehicles = await Vehicle.find({ userId: providerId.toString() });
      console.log('Found owned vehicles:', ownedVehicles.length);
      
      if (ownedVehicles.length > 0) {
        const vehicleIds = ownedVehicles.map(v => v._id.toString());
        console.log('Vehicle IDs:', vehicleIds);
        
        const vehicleReservations = await VehicleReservation.find({ 
          vehicleOwnerId: providerId.toString() 
        }).sort({ date: -1 });
        
        console.log('Found vehicle reservations:', vehicleReservations.length);

        // Convert vehicle reservations to service reservation format
        for (const vReservation of vehicleReservations) {
          try {
            const [vehicle, customer] = await Promise.all([
              Vehicle.findById(vReservation.vehicleId),
              User.findById(vReservation.userId)
            ]);

            if (vehicle && customer) {
              const convertedReservation = {
                _id: vReservation._id,
                customerId: {
                  _id: customer._id,
                  name: customer.name,
                  email: customer.email
                },
                serviceId: {
                  _id: vehicle._id,
                  name: `${vehicle.brand} ${vehicle.model}`,
                  type: 'vehicle',
                  location: vReservation.location
                },
                checkInDate: vReservation.pickupDate,
                checkOutDate: vReservation.returnDate,
                guests: 1,
                customerName: customer.name,
                customerEmail: customer.email,
                customerPhone: customer.phone || '',
                totalAmount: vReservation.price,
                pricePerUnit: vReservation.price,
                status: vReservation.status || 'pending', // Use actual status or default to pending
                createdAt: vReservation.date,
                updatedAt: vReservation.date,
                isLegacyVehicle: true,
                vehicleNumber: vReservation.vehicleNumber,
                needDriver: vReservation.needDriver,
                transactionId: vReservation.transactionId,
                confirmationNumber: vReservation.confirmationNumber,
                rejectionReason: vReservation.rejectionReason,
                responseDate: vReservation.responseDate
              };

              // Apply status filter if needed
              if (!status || convertedReservation.status === status) {
                allReservations.push(convertedReservation);
              }
            }
          } catch (error) {
            console.error('Error converting vehicle reservation for provider:', error);
          }
        }
      }
    }

    // Sort all reservations by creation date
    allReservations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedReservations = allReservations.slice(skip, skip + parseInt(limit));
    const total = allReservations.length;

    res.status(200).json({
      success: true,
      count: paginatedReservations.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: paginatedReservations
    });

  } catch (error) {
    console.error("Error fetching provider reservations:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Update reservation status (provider endpoint)
const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const providerId = req.user.id;
    const { status, rejectionReason } = req.body;

    // Find reservation and verify ownership
    const reservation = await ServiceReservation.findOne({ 
      _id: id, 
      providerId 
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found or you don't have permission to update it"
      });
    }

    // Update reservation
    reservation.status = status;
    reservation.responseDate = new Date();
    
    if (status === 'cancelled' && rejectionReason) {
      reservation.rejectionReason = rejectionReason;
    }

    if (status === 'confirmed') {
      // Generate confirmation number if confirming
      if (!reservation.confirmationNumber) {
        reservation.confirmationNumber = `TR${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      }
    }

    const updatedReservation = await reservation.save();
    
    // Populate the updated reservation
    await updatedReservation.populate([
      { path: 'serviceId', select: 'name type' },
      { path: 'customerId', select: 'name email' }
    ]);

    // Send notification to customer about status update
    try {
      if (status === 'confirmed') {
        await createNotificationHelper(
          reservation.customerId,
          'Booking Confirmed!',
          `Your booking for ${updatedReservation.serviceId.name} has been confirmed! Confirmation number: ${updatedReservation.confirmationNumber}. Check-in: ${new Date(reservation.checkInDate).toLocaleDateString()}`,
          'booking_confirmed',
          {
            reservationId: updatedReservation._id,
            serviceName: updatedReservation.serviceId.name,
            confirmationNumber: updatedReservation.confirmationNumber,
            checkInDate: reservation.checkInDate
          }
        );
      } else if (status === 'cancelled') {
        await createNotificationHelper(
          reservation.customerId,
          'Booking Cancelled',
          `Your booking for ${updatedReservation.serviceId.name} has been cancelled. ${rejectionReason ? `Reason: ${rejectionReason}` : 'Please contact the provider for more information.'}`,
          'booking_cancelled',
          {
            reservationId: updatedReservation._id,
            serviceName: updatedReservation.serviceId.name,
            rejectionReason
          }
        );
      }
    } catch (notifError) {
      console.error('Error sending notification to customer:', notifError);
    }

    res.status(200).json({
      success: true,
      message: "Reservation status updated successfully",
      data: updatedReservation
    });

  } catch (error) {
    console.error("Error updating reservation status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get customer reservations
const getCustomerReservations = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { status, page = 1, limit = 20, type } = req.query;

    let allReservations = [];

    // Fetch service reservations
    if (!type || type === 'service') {
      const filter = { customerId };
      if (status) {
        filter.status = status;
      }

      const serviceReservations = await ServiceReservation.find(filter)
        .populate('serviceId', 'name type location')
        .populate('providerId', 'name businessName businessPhone businessEmail')
        .sort({ createdAt: -1 });

      allReservations = allReservations.concat(serviceReservations);
    }

    // Fetch tour reservations for customers
    if (!type || type === 'tour') {
      const TourReservation = require('../models/tourBook');
      const Tours = require('../models/tours');
      const User = require('../models/userModel');
      
      console.log('Searching for tour reservations for customer:', customerId);
      
      // Get user's email to match against tour reservations
      const currentUser = await User.findById(customerId);
      const userEmail = currentUser?.email;
      
      console.log('Customer email for tour matching:', userEmail);
      
      // Find tour reservations where the user is the customer
      const tourReservations = await TourReservation.find({ 
        $or: [
          { customerId: customerId.toString() },
          { customerEmail: userEmail }
        ]
      }).sort({ createdAt: -1 });
      
      console.log('Found customer tour reservations:', tourReservations.length);

      // Convert tour reservations to service reservation format
      for (const tReservation of tourReservations) {
        try {
          const tour = await Tours.findById(tReservation.tourId);
          
          if (tour) {
            const convertedReservation = {
              _id: tReservation._id,
              customerId: tReservation.customerId,
              serviceId: {
                _id: tour._id,
                name: tour.name,
                type: 'tour',
                location: tour.cities || tour.category
              },
              providerId: {
                _id: tReservation.tourOwnerId,
                name: 'Tour Provider',
                businessName: 'Tour Services',
                businessPhone: '',
                businessEmail: tReservation.tourOwnerId // Email-based ownership
              },
              checkInDate: tReservation.tourDate,
              checkOutDate: tReservation.tourDate, // Tours are typically single day
              guests: tReservation.guests,
              customerName: tReservation.customerName,
              customerEmail: tReservation.customerEmail,
              customerPhone: tReservation.customerPhone,
              totalAmount: tReservation.totalAmount,
              pricePerUnit: tReservation.tourPrice,
              status: tReservation.status || 'pending',
              createdAt: tReservation.createdAt,
              updatedAt: tReservation.updatedAt,
              isTourReservation: true,
              tourDate: tReservation.tourDate,
              specialRequests: tReservation.specialRequests,
              confirmationNumber: tReservation.confirmationNumber,
              rejectionReason: tReservation.rejectionReason,
              responseDate: tReservation.responseDate
            };

            // Apply status filter if needed
            if (!status || convertedReservation.status === status) {
              allReservations.push(convertedReservation);
            }
          }
        } catch (error) {
          console.error('Error converting tour reservation for customer:', error);
        }
      }
    }

    // Fetch legacy vehicle reservations
    if (!type || type === 'vehicle') {
      const VehicleReservation = require('../models/VehicleReservation');
      const Vehicle = require('../models/Vehicle');
      
      const vehicleReservations = await VehicleReservation.find({ userId: customerId })
        .sort({ date: -1 });

      // Convert vehicle reservations to service reservation format
      for (const vReservation of vehicleReservations) {
        try {
          const vehicle = await Vehicle.findById(vReservation.vehicleId);
          if (vehicle) {
            const convertedReservation = {
              _id: vReservation._id,
              customerId: vReservation.userId,
              serviceId: {
                _id: vehicle._id,
                name: `${vehicle.brand} ${vehicle.model}`,
                type: 'vehicle',
                location: vReservation.location
              },
              providerId: {
                _id: vReservation.vehicleOwnerId,
                name: 'Vehicle Owner',
                businessName: 'Vehicle Rental',
                businessPhone: '',
                businessEmail: ''
              },
              checkInDate: vReservation.pickupDate,
              checkOutDate: vReservation.returnDate,
              guests: 1, // Default for vehicles
              customerName: req.user.name || 'Customer',
              customerEmail: req.user.email || '',
              customerPhone: req.user.phone || '',
              totalAmount: vReservation.price,
              pricePerUnit: vReservation.price,
              status: vReservation.status || 'pending', // Use actual status or default to pending
              createdAt: vReservation.date,
              updatedAt: vReservation.date,
              isLegacyVehicle: true,
              vehicleNumber: vReservation.vehicleNumber,
              needDriver: vReservation.needDriver,
              transactionId: vReservation.transactionId,
              confirmationNumber: vReservation.confirmationNumber,
              rejectionReason: vReservation.rejectionReason,
              responseDate: vReservation.responseDate
            };

            // Apply status filter if needed
            if (!status || convertedReservation.status === status) {
              allReservations.push(convertedReservation);
            }
          }
        } catch (error) {
          console.error('Error converting vehicle reservation:', error);
        }
      }
    }

    // Sort all reservations by creation date
    allReservations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedReservations = allReservations.slice(skip, skip + parseInt(limit));
    const total = allReservations.length;

    res.status(200).json({
      success: true,
      count: paginatedReservations.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: paginatedReservations
    });

  } catch (error) {
    console.error("Error fetching customer reservations:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get reservation details
const getReservationDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reservation = await ServiceReservation.findById(id)
      .populate('serviceId')
      .populate('customerId', 'name email')
      .populate('providerId', 'name businessName businessPhone businessEmail');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found"
      });
    }

    // Check if user has permission to view this reservation
    if (reservation.customerId._id.toString() !== userId && 
        reservation.providerId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this reservation"
      });
    }

    res.status(200).json({
      success: true,
      data: reservation
    });

  } catch (error) {
    console.error("Error fetching reservation details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  createReservation,
  getProviderReservations,
  updateReservationStatus,
  getCustomerReservations,
  getReservationDetails
}; 