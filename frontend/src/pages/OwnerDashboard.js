import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Divider
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  Visibility,
  DirectionsCar,
  Hotel,
  Map
} from '@mui/icons-material';
import { notificationManager, NotificationTypes } from '../services/notificationService';
import { AuthContext } from '../context/authContext';

const ServiceProviderDashboard = () => {
  const { user } = useContext(AuthContext);
  const [currentTab, setCurrentTab] = useState(0);
  const [services, setServices] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [openServiceDialog, setOpenServiceDialog] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceFormData, setServiceFormData] = useState({});
  const [rejectionReason, setRejectionReason] = useState('');
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [providerStatus, setProviderStatus] = useState(null);
  const [selectedServiceType, setSelectedServiceType] = useState('all');

  // Service type options for the dashboard
  const serviceTypeOptions = [
    { value: 'all', label: 'All Services', icon: '🏢' },
    { value: 'hotel', label: 'Hotels', icon: '🏨' },
    { value: 'vehicle', label: 'Vehicles', icon: '🚗' },
    { value: 'tour', label: 'Tours', icon: '🗺️' },
    { value: 'restaurant', label: 'Restaurants', icon: '🍽️' },
    { value: 'flight', label: 'Flights', icon: '✈️' },
    { value: 'event', label: 'Events', icon: '🎉' },
    { value: 'train', label: 'Trains', icon: '🚂' }
  ];

  useEffect(() => {
    if (user && user.type === 'provider') {
      loadProviderStatus();
    }
  }, [user]);

  useEffect(() => {
    if (providerStatus && providerStatus.approvedTypes.length > 0) {
      loadServices();
      loadReservations();
    }
  }, [providerStatus, selectedServiceType]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const loadProviderStatus = async () => {
    try {
      const response = await fetch('/api/provider/services/status/me', {
        headers: getAuthHeaders()
      });
      const result = await response.json();
      
      if (result.success) {
        setProviderStatus(result.data);
        // Set default service type to first approved type
        if (result.data.approvedTypes.length > 0) {
          setSelectedServiceType(result.data.approvedTypes[0]);
        }
      } else {
        setError(result.message || 'Failed to load provider status');
      }
    } catch (error) {
      console.error('Error loading provider status:', error);
      setError('Error loading provider status');
    }
  };

  const repairProviderData = async () => {
    try {
      setLoading(true);
      console.log('Attempting to repair provider data...');
      
      const response = await fetch('/api/provider/services/repair', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      const result = await response.json();
      console.log('Repair result:', result);
      
      if (result.success) {
        setError(''); // Clear any existing errors
        
        // Show repair results
        if (result.data.repairsMade.length > 0) {
          alert(`Data repaired successfully!\n\nRepairs made:\n${result.data.repairsMade.join('\n')}`);
        } else {
          alert('No repairs needed - your provider data is consistent.');
        }
        
        // Reload provider status
        await loadProviderStatus();
        await loadServices();
      } else {
        setError(result.message || 'Failed to repair provider data');
      }
    } catch (error) {
      console.error('Error repairing provider data:', error);
      setError('Error repairing provider data');
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      let allServices = [];

      // Load tours from tours API if tour type is selected or all services
      if (selectedServiceType === 'tour' || selectedServiceType === 'all') {
        try {
          const toursResponse = await fetch('/api/tours', {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (toursResponse.ok) {
            const toursData = await toursResponse.json();
            console.log('Tours data:', toursData);
            
            // Filter tours by current user
            const userTours = (toursData || []).filter(tour => 
              tour.currentUser === user?.email
            ).map(tour => ({
              ...tour,
              type: 'tour',
              price: tour.price,
              status: 'active' // Tours don't have explicit status
            }));
            
            allServices = [...allServices, ...userTours];
          }
        } catch (error) {
          console.error('Error loading tours:', error);
        }
      }

      // Load other services from provider services API
      if (selectedServiceType !== 'tour') {
        try {
          const serviceType = selectedServiceType === 'all' ? '' : selectedServiceType;
          const servicesResponse = await fetch(`/api/provider/services?type=${serviceType}`, {
            headers: getAuthHeaders()
          });
          
          if (servicesResponse.ok) {
            const servicesResult = await servicesResponse.json();
            
            if (servicesResult.success) {
              // Filter out tours as they're handled separately
              const nonTourServices = (servicesResult.data || []).filter(service => 
                service.type !== 'tour'
              );
              allServices = [...allServices, ...nonTourServices];
            }
          }
        } catch (error) {
          console.error('Error loading provider services:', error);
        }
      }

      setServices(allServices);
      
    } catch (error) {
      console.error('Error loading services:', error);
      setError('Error loading services');
    } finally {
      setLoading(false);
    }
  };

  const loadReservations = async () => {
    try {
      const response = await fetch('/api/reservations/provider', {
        headers: getAuthHeaders()
      });
      const result = await response.json();
      
      if (result.success) {
        setReservations(result.data || []);
      } else {
        console.error('Failed to load reservations:', result.message);
      }
    } catch (error) {
      console.error('Error loading reservations:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleAddService = () => {
    setSelectedService(null);
    setServiceFormData({ 
      type: selectedServiceType === 'all' 
        ? (providerStatus?.approvedTypes[0] || 'hotel') 
        : selectedServiceType 
    });
    setOpenServiceDialog(true);
  };

  const handleEditService = (service) => {
    setSelectedService(service);
    setServiceFormData(service);
    setOpenServiceDialog(true);
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      // Find the service to determine if it's a tour
      const service = services.find(s => s._id === serviceId);
      
      if (service && service.type === 'tour') {
        // Delete from tours API
        const response = await fetch(`/api/tours/${serviceId}`, { 
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          loadServices();
          alert('Tour deleted successfully!');
        } else {
          const result = await response.json();
          setError(result.message || 'Failed to delete tour');
        }
      } else {
        // Delete from provider services API
        const response = await fetch(`/api/provider/services/${serviceId}`, { 
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        
        const result = await response.json();
        if (result.success) {
          loadServices();
        } else {
          setError(result.message || 'Failed to delete service');
        }
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      setError('Error deleting service');
    }
  };

  const handleSaveService = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      const { name, description, price, type } = serviceFormData;
      
      if (!name?.trim() || !description?.trim() || !price || !type) {
        setError('Please fill in all required fields (Name, Description, Price, Type)');
        return;
      }

      if (isNaN(price) || parseFloat(price) <= 0) {
        setError('Please enter a valid price greater than 0');
        return;
      }

      // Additional validation for tour services
      if (type === 'tour') {
        const { category, groupCount, languages, duration, cities, introduction } = serviceFormData;
        if (!category?.trim() || !groupCount || !languages?.trim() || !duration?.trim() || !cities?.trim() || !introduction?.trim()) {
          setError('For tour services, please fill in all fields: Category, Group Size, Languages, Duration, Cities, Description, and Introduction');
          return;
        }
        
        if (isNaN(groupCount) || parseInt(groupCount) <= 0) {
          setError('Please enter a valid group size greater than 0');
          return;
        }
      }

      // Additional validation for vehicle services
      if (type === 'vehicle') {
        const { vehicleType, capacity, location } = serviceFormData;
        if (!vehicleType?.trim() || !capacity || !location?.trim()) {
          setError('For vehicle services, please fill in Vehicle Type, Capacity, and Location');
          return;
        }
        
        if (isNaN(capacity) || parseInt(capacity) <= 0) {
          setError('Please enter a valid seating capacity greater than 0');
          return;
        }
      }

      // Handle tours separately to save to the correct API
      if (type === 'tour') {
        await handleSaveTour();
      } else {
        await handleSaveGenericService();
      }

    } catch (error) {
      console.error('Error saving service:', error);
      setError('Error saving service');
    } finally {
      setLoading(false);
    }
  };

  // Function to save tours to the tours API
  const handleSaveTour = async () => {
    try {
      let imageUrl = '';
      
      // Handle image upload to Cloudinary if there's a new image
      if (serviceFormData.images && serviceFormData.images.length > 0) {
        const firstImage = serviceFormData.images[0];
        
        if (firstImage instanceof File) {
          try {
            // Upload to Cloudinary
            const formData = new FormData();
            formData.append("file", firstImage);
            formData.append("upload_preset", "upload"); // Make sure this matches your Cloudinary upload preset
            
            console.log("Uploading image to Cloudinary...");
            const uploadResponse = await fetch(
              "https://api.cloudinary.com/v1_1/dpgelkpd4/image/upload", // Make sure this matches your Cloudinary cloud name
              {
                method: "POST",
                body: formData
              }
            );
            
            if (uploadResponse.ok) {
              const uploadResult = await uploadResponse.json();
              imageUrl = uploadResult.url;
              console.log("Image uploaded successfully:", imageUrl);
            } else {
              console.error("Failed to upload image to Cloudinary");
              setError("Failed to upload image. Please try again.");
              return;
            }
          } catch (uploadError) {
            console.error("Error uploading image:", uploadError);
            setError("Error uploading image. Please try again.");
            return;
          }
        } else if (typeof firstImage === 'string') {
          // It's already a URL
          imageUrl = firstImage;
        }
      }

      // Prepare tour data for the tours API
      const tourData = {
        currentUser: user?.email || '',
        img: imageUrl || serviceFormData.img || '', // Use uploaded image or existing image
        name: serviceFormData.name,
        category: serviceFormData.category,
        price: parseFloat(serviceFormData.price),
        groupCount: parseInt(serviceFormData.groupCount),
        languages: serviceFormData.languages,
        duration: serviceFormData.duration,
        cities: serviceFormData.cities,
        description: serviceFormData.description,
        introduction: serviceFormData.introduction
      };

      console.log('Saving tour with data:', tourData);

      const method = selectedService ? 'PATCH' : 'POST';
      const url = selectedService 
        ? `/api/tours/${selectedService._id}`
        : '/api/tours';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tourData)
      });

      const result = await response.json();
      console.log('Tour save result:', result);
      
      if (response.ok && (result.status === "Success" || result.message)) {
        setOpenServiceDialog(false);
        loadServices();
        setError('');
        
        // Show success message
        alert(selectedService ? 'Tour updated successfully!' : 'Tour created successfully! Your tour will now appear in the tours section.');
      } else {
        setError(result.message || 'Failed to save tour');
      }
    } catch (error) {
      console.error('Error saving tour:', error);
      setError('Error saving tour to tours collection');
    }
  };

  // Function to save other services to the provider services API
  const handleSaveGenericService = async () => {
    try {
      const method = selectedService ? 'PUT' : 'POST';
      const url = selectedService 
        ? `/api/provider/services/${selectedService._id}`
        : '/api/provider/services';

      // Prepare service data without File objects
      const serviceDataToSend = { ...serviceFormData };
      
      // Handle images - convert File objects to base64 or skip them for now
      if (serviceDataToSend.images) {
        const processedImages = [];
        for (const image of serviceDataToSend.images) {
          if (typeof image === 'string') {
            // It's already a URL/base64 string
            processedImages.push(image);
          } else if (image instanceof File) {
            // Convert File to base64 for now (you might want to implement proper file upload later)
            try {
              const base64 = await convertFileToBase64(image);
              processedImages.push(base64);
            } catch (error) {
              console.error('Error converting file to base64:', error);
              // Skip this file for now
            }
          }
        }
        serviceDataToSend.images = processedImages;
      }

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(serviceDataToSend)
      });

      // Log response details for debugging
      console.log('Service creation response status:', response.status);
      console.log('Service creation response headers:', response.headers);
      
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Error parsing response JSON:', parseError);
        setError('Server returned invalid response. Please check console for details.');
        return;
      }
      
      console.log('Service creation result:', result);
      
      if (result.success) {
        setOpenServiceDialog(false);
        loadServices();
        setError('');

        // Send notification for new service (non-blocking)
        if (!selectedService) {
          try {
            await notificationManager.sendToAdmin(NotificationTypes.SERVICE_ADDED, {
              serviceType: serviceDataToSend.type,
              serviceName: serviceDataToSend.name,
              providerName: user?.name || 'Provider'
            });
          } catch (notifError) {
            console.error('Error sending notification:', notifError);
            // Don't fail the entire operation if notification fails
          }
        }
      } else {
        setError(result.message || 'Failed to save service');
      }
    } catch (error) {
      console.error('Error saving generic service:', error);
      setError('Error saving service');
    }
  };

  // Helper function to convert File to base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleApproveReservation = async (reservation) => {
    try {
      let response;
      
      if (reservation.isLegacyVehicle) {
        // Handle legacy vehicle reservations
        response = await fetch(`/api/vehiclereservation/${reservation._id}/status`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ 
            status: 'confirmed'
          })
        });
      } else if (reservation.isTourReservation) {
        // Handle tour reservations
        response = await fetch(`/api/tours/reservations/${reservation._id}/status`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ 
            status: 'confirmed'
          })
        });
      } else {
        // Handle new service reservations
        response = await fetch(`/api/reservations/${reservation._id}/status`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ 
            status: 'confirmed'
          })
        });
      }

      const result = await response.json();
      if (result.success) {
        // Send notification to customer
        try {
          await notificationManager.sendToUser(reservation.customerId._id, NotificationTypes.RESERVATION_APPROVED, {
            serviceName: reservation.serviceId.name,
            confirmationNumber: result.data.confirmationNumber
          });
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
        }

        loadReservations();
      } else {
        setError(result.message || 'Failed to approve reservation');
      }
    } catch (error) {
      console.error('Error approving reservation:', error);
      setError('Error approving reservation');
    }
  };

  const handleRejectReservation = (reservation) => {
    setSelectedReservation(reservation);
    setOpenRejectDialog(true);
  };

  const confirmRejectReservation = async () => {
    try {
      let response;
      
      if (selectedReservation.isLegacyVehicle) {
        // Handle legacy vehicle reservations
        response = await fetch(`/api/vehiclereservation/${selectedReservation._id}/status`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ 
            status: 'cancelled',
            rejectionReason 
          })
        });
      } else if (selectedReservation.isTourReservation) {
        // Handle tour reservations
        response = await fetch(`/api/tours/reservations/${selectedReservation._id}/status`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ 
            status: 'cancelled',
            rejectionReason 
          })
        });
      } else {
        // Handle new service reservations
        response = await fetch(`/api/reservations/${selectedReservation._id}/status`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ 
            status: 'cancelled',
            rejectionReason 
          })
        });
      }

      const result = await response.json();
      if (result.success) {
        // Send notification to customer
        try {
          await notificationManager.sendToUser(selectedReservation.customerId._id, NotificationTypes.RESERVATION_REJECTED, {
            serviceName: selectedReservation.serviceId.name,
            reason: rejectionReason
          });
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
        }

        setOpenRejectDialog(false);
        setRejectionReason('');
        setSelectedReservation(null);
        loadReservations();
      } else {
        setError(result.message || 'Failed to reject reservation');
      }
    } catch (error) {
      console.error('Error rejecting reservation:', error);
      setError('Error rejecting reservation');
    }
  };

  const renderServiceForm = () => {
    const serviceFormType = serviceFormData.type || selectedServiceType;
    
    return (
      <Grid container spacing={3}>
        {!selectedService && (
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label="Service Type"
              value={serviceFormData.type || ''}
              onChange={(e) => setServiceFormData({ ...serviceFormData, type: e.target.value })}
              helperText="Select the type of service you want to add"
              required
            >
              {providerStatus?.approvedTypes.map((type) => {
                const option = serviceTypeOptions.find(opt => opt.value === type);
                return (
                  <MenuItem key={type} value={type}>
                    {option?.icon} {option?.label}
                  </MenuItem>
                );
              })}
            </TextField>
          </Grid>
        )}
        
        {serviceFormType && renderServiceTypeForm(serviceFormType)}
      </Grid>
    );
  };

  const renderServiceTypeForm = (serviceType) => {
    switch (serviceType) {
      case 'hotel':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hotel Name"
                value={serviceFormData.name || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={serviceFormData.location || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Room Type"
                value={serviceFormData.roomType || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, roomType: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price per Night"
                type="number"
                value={serviceFormData.price || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, price: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Available Rooms"
                type="number"
                value={serviceFormData.availableRooms || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, availableRooms: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Upload Images
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  sx={{ mb: 2 }}
                >
                  Choose Images
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    hidden
                    onChange={(e) => handleImageUpload(e.target.files)}
                  />
                </Button>
                {serviceFormData.images && serviceFormData.images.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                    {serviceFormData.images.map((image, index) => (
                      <Box key={index} sx={{ position: 'relative' }}>
                        <img
                          src={typeof image === 'string' ? image : URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
                        />
                        <IconButton
                          size="small"
                          sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper' }}
                          onClick={() => removeImage(index)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={serviceFormData.description || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
              />
            </Grid>
          </Grid>
        );

      case 'tour':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tour Name"
                value={serviceFormData.name || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Tour Category"
                value={serviceFormData.category || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, category: e.target.value })}
                required
              >
                <MenuItem value="">--Select one--</MenuItem>
                <MenuItem value="sun and beach">Sun and Beach</MenuItem>
                <MenuItem value="hiking and trekking">Hiking and Trekking</MenuItem>
                <MenuItem value="wild safari">Wild Safari</MenuItem>
                <MenuItem value="special tours">Special Tour</MenuItem>
                <MenuItem value="cultural">Cultural</MenuItem>
                <MenuItem value="festival">Festival</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price per Person"
                type="number"
                value={serviceFormData.price || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, price: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Maximum Group Size"
                type="number"
                value={serviceFormData.groupCount || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, groupCount: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Languages"
                value={serviceFormData.languages || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, languages: e.target.value })}
                placeholder="English, French, German etc.."
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Tour Duration"
                value={serviceFormData.duration || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, duration: e.target.value })}
                required
              >
                <MenuItem value="">--Select One--</MenuItem>
                <MenuItem value="1">1 Day</MenuItem>
                <MenuItem value="2">2 Days</MenuItem>
                <MenuItem value="3">3 Days</MenuItem>
                <MenuItem value="5">5 Days</MenuItem>
                <MenuItem value="7">7 Days</MenuItem>
                <MenuItem value="9">9 Days</MenuItem>
                <MenuItem value="12">12 Days</MenuItem>
                <MenuItem value="15">15 Days</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cities"
                value={serviceFormData.cities || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, cities: e.target.value })}
                placeholder="Cities that will be visited during the tour"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Upload Images
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  sx={{ mb: 2 }}
                >
                  Choose Images
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    hidden
                    onChange={(e) => handleImageUpload(e.target.files)}
                  />
                </Button>
                {serviceFormData.images && serviceFormData.images.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                    {serviceFormData.images.map((image, index) => (
                      <Box key={index} sx={{ position: 'relative' }}>
                        <img
                          src={typeof image === 'string' ? image : URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
                        />
                        <IconButton
                          size="small"
                          sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper' }}
                          onClick={() => removeImage(index)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tour Description"
                multiline
                rows={4}
                value={serviceFormData.description || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
                placeholder="Provide a detailed description of the tour"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tour Introduction"
                multiline
                rows={4}
                value={serviceFormData.introduction || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, introduction: e.target.value })}
                placeholder="Introductory information about destinations and activities"
                required
              />
            </Grid>
          </Grid>
        );

      case 'vehicle':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vehicle Name"
                value={serviceFormData.name || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vehicle Type"
                value={serviceFormData.vehicleType || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, vehicleType: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price per Day"
                type="number"
                value={serviceFormData.price || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, price: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Seating Capacity"
                type="number"
                value={serviceFormData.capacity || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, capacity: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={serviceFormData.location || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, location: e.target.value })}
                placeholder="e.g., Colombo, Sri Lanka"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Features"
                multiline
                rows={3}
                value={serviceFormData.features || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, features: e.target.value })}
                placeholder="e.g., Air conditioning, GPS, Insurance included"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={serviceFormData.description || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
                placeholder="Provide a detailed description of your vehicle service"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Upload Images
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  sx={{ mb: 2 }}
                >
                  Choose Images
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    hidden
                    onChange={(e) => handleImageUpload(e.target.files)}
                  />
                </Button>
                {serviceFormData.images && serviceFormData.images.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                    {serviceFormData.images.map((image, index) => (
                      <Box key={index} sx={{ position: 'relative' }}>
                        <img
                          src={typeof image === 'string' ? image : URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
                        />
                        <IconButton
                          size="small"
                          sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper' }}
                          onClick={() => removeImage(index)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        );

      case 'restaurant':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Restaurant Name"
                value={serviceFormData.name || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location/Address"
                value={serviceFormData.location || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, location: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Cuisine Type</InputLabel>
                <Select
                  value={serviceFormData.cuisineType || ''}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, cuisineType: e.target.value })}
                  label="Cuisine Type"
                >
                  <MenuItem value="Pakistani">Pakistani</MenuItem>
                  <MenuItem value="Chinese">Chinese</MenuItem>
                  <MenuItem value="Italian">Italian</MenuItem>
                  <MenuItem value="Continental">Continental</MenuItem>
                  <MenuItem value="Fast Food">Fast Food</MenuItem>
                  <MenuItem value="BBQ & Grill">BBQ & Grill</MenuItem>
                  <MenuItem value="Seafood">Seafood</MenuItem>
                  <MenuItem value="Indian">Indian</MenuItem>
                  <MenuItem value="Arabic">Arabic</MenuItem>
                  <MenuItem value="Mixed">Mixed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Average Price per Person (Rs.)"
                type="number"
                value={serviceFormData.price || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, price: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Seating Capacity"
                type="number"
                value={serviceFormData.capacity || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, capacity: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Staff Size</InputLabel>
                <Select
                  value={serviceFormData.staffSize || ''}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, staffSize: e.target.value })}
                  label="Staff Size"
                >
                  <MenuItem value="4-7">4-7 Staff</MenuItem>
                  <MenuItem value="7-10">7-10 Staff</MenuItem>
                  <MenuItem value="10-15">10-15 Staff</MenuItem>
                  <MenuItem value="15-30">15-30 Staff</MenuItem>
                  <MenuItem value="30-50">30-50 Staff</MenuItem>
                  <MenuItem value="50+">50+ Staff</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Restaurant Description"
                multiline
                rows={3}
                value={serviceFormData.description || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
                placeholder="Describe your restaurant, ambiance, special features..."
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Specialties & Signature Dishes"
                multiline
                rows={2}
                value={serviceFormData.specialties || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, specialties: e.target.value })}
                placeholder="Famous dishes, specialties, unique offerings..."
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Upload Restaurant Images *
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                  Upload high-quality images of your restaurant, interior, and signature dishes
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  sx={{ mb: 2 }}
                >
                  Choose Images
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    hidden
                    onChange={(e) => handleImageUpload(e.target.files)}
                  />
                </Button>
                {serviceFormData.images && serviceFormData.images.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                    {serviceFormData.images.map((image, index) => (
                      <Box key={index} sx={{ position: 'relative' }}>
                        <img
                          src={typeof image === 'string' ? image : URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
                        />
                        <IconButton
                          size="small"
                          sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper' }}
                          onClick={() => removeImage(index)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        );

      case 'flight':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Airline Name"
                value={serviceFormData.name || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Aircraft Type"
                value={serviceFormData.aircraftType || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, aircraftType: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Base Price"
                type="number"
                value={serviceFormData.price || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, price: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Passenger Capacity"
                type="number"
                value={serviceFormData.capacity || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, capacity: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Upload Images
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  sx={{ mb: 2 }}
                >
                  Choose Images
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    hidden
                    onChange={(e) => handleImageUpload(e.target.files)}
                  />
                </Button>
                {serviceFormData.images && serviceFormData.images.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                    {serviceFormData.images.map((image, index) => (
                      <Box key={index} sx={{ position: 'relative' }}>
                        <img
                          src={typeof image === 'string' ? image : URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
                        />
                        <IconButton
                          size="small"
                          sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper' }}
                          onClick={() => removeImage(index)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Routes & Services"
                multiline
                rows={3}
                value={serviceFormData.routes || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, routes: e.target.value })}
              />
            </Grid>
          </Grid>
        );

      case 'event':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Event Name"
                value={serviceFormData.name || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Event Type"
                value={serviceFormData.eventType || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, eventType: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price per Person"
                type="number"
                value={serviceFormData.price || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, price: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Max Attendees"
                type="number"
                value={serviceFormData.maxAttendees || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, maxAttendees: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration (hours)"
                type="number"
                value={serviceFormData.duration || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, duration: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Venue"
                value={serviceFormData.venue || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, venue: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Upload Images
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  sx={{ mb: 2 }}
                >
                  Choose Images
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    hidden
                    onChange={(e) => handleImageUpload(e.target.files)}
                  />
                </Button>
                {serviceFormData.images && serviceFormData.images.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                    {serviceFormData.images.map((image, index) => (
                      <Box key={index} sx={{ position: 'relative' }}>
                        <img
                          src={typeof image === 'string' ? image : URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
                        />
                        <IconButton
                          size="small"
                          sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper' }}
                          onClick={() => removeImage(index)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Event Description"
                multiline
                rows={4}
                value={serviceFormData.description || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
              />
            </Grid>
          </Grid>
        );

      case 'train':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Train Service Name"
                value={serviceFormData.name || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Train Type"
                value={serviceFormData.trainType || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, trainType: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Base Fare"
                type="number"
                value={serviceFormData.price || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, price: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Seating Capacity"
                type="number"
                value={serviceFormData.capacity || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, capacity: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Route"
                value={serviceFormData.route || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, route: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Journey Duration"
                value={serviceFormData.duration || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, duration: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Upload Images
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  sx={{ mb: 2 }}
                >
                  Choose Images
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    hidden
                    onChange={(e) => handleImageUpload(e.target.files)}
                  />
                </Button>
                {serviceFormData.images && serviceFormData.images.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                    {serviceFormData.images.map((image, index) => (
                      <Box key={index} sx={{ position: 'relative' }}>
                        <img
                          src={typeof image === 'string' ? image : URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
                        />
                        <IconButton
                          size="small"
                          sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper' }}
                          onClick={() => removeImage(index)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amenities & Features"
                multiline
                rows={3}
                value={serviceFormData.amenities || ''}
                onChange={(e) => setServiceFormData({ ...serviceFormData, amenities: e.target.value })}
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  // Image handling functions
  const handleImageUpload = (files) => {
    if (files && files.length > 0) {
      const newImages = Array.from(files);
      setServiceFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...newImages]
      }));
    }
  };

  const removeImage = (index) => {
    setServiceFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Service Provider Dashboard
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="My Services" />
          <Tab label="Reservations" />
          <Tab label="Analytics" />
        </Tabs>

        {currentTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h5">My Services</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddService}
                disabled={loading}
              >
                Add New Service
              </Button>
            </Box>

            {/* Provider Status Info */}
            {providerStatus && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Provider Status
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    color="secondary"
                    onClick={repairProviderData}
                    disabled={loading}
                    sx={{ ml: 2 }}
                  >
                    {loading ? 'Repairing...' : 'Repair Data'}
                  </Button>
                </Box>
                {providerStatus.approvedTypes.length > 0 ? (
                  <>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      You are approved to provide the following services:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                      {providerStatus.approvedTypes.map(type => {
                        const option = serviceTypeOptions.find(opt => opt.value === type);
                        return (
                          <Chip
                            key={type}
                            label={`${option?.icon} ${option?.label}`}
                            variant="outlined"
                            color="primary"
                          />
                        );
                      })}
                    </Box>
                  </>
                ) : (
                  <Box>
                    <Typography variant="body2" color="error" gutterBottom>
                      No approved service types found. If you believe this is an error, click "Repair Data" above.
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      If the repair doesn't work, you may need to apply for provider status for your desired service types.
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Service Type Filter */}
            {providerStatus && providerStatus.approvedTypes.length > 1 && (
              <Box sx={{ mb: 3 }}>
                <TextField
                  select
                  value={selectedServiceType}
                  onChange={(e) => setSelectedServiceType(e.target.value)}
                  size="small"
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value="all">All Services</MenuItem>
                  {providerStatus.approvedTypes.map(type => {
                    const option = serviceTypeOptions.find(opt => opt.value === type);
                    return (
                      <MenuItem key={type} value={type}>
                        {option?.icon} {option?.label}
                      </MenuItem>
                    );
                  })}
                </TextField>
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <Typography>Loading services...</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {services.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="textSecondary">
                            No services found. Click "Add New Service" to get started.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      services.map((service) => (
                        <TableRow key={service._id}>
                          <TableCell>{service.name}</TableCell>
                          <TableCell>{service.type}</TableCell>
                          <TableCell>${service.price}</TableCell>
                          <TableCell>
                            <Chip
                              label={service.status}
                              color={service.status === 'active' ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton onClick={() => handleEditService(service)}>
                              <Edit />
                            </IconButton>
                            <IconButton onClick={() => handleDeleteService(service._id)}>
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {currentTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Reservation Requests
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Check-in / Pickup</TableCell>
                    <TableCell>Check-out / Return</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reservations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography color="textSecondary">
                          No reservations found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    reservations.map((reservation) => (
                      <TableRow key={reservation._id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {reservation.customerName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {reservation.customerEmail}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {reservation.serviceId?.type === 'vehicle' || reservation.isLegacyVehicle ? (
                              <DirectionsCar sx={{ mr: 1, color: 'primary.main' }} />
                            ) : reservation.serviceId?.type === 'tour' || reservation.isTourReservation ? (
                              <Map sx={{ mr: 1, color: 'primary.main' }} />
                            ) : (
                              <Hotel sx={{ mr: 1, color: 'primary.main' }} />
                            )}
                            <Typography variant="body2">
                              {reservation.serviceId?.name || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(reservation.checkInDate).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(reservation.checkOutDate).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {reservation.isLegacyVehicle ? (
                            <Box>
                              <Typography variant="caption" display="block">
                                Vehicle: {reservation.vehicleNumber}
                              </Typography>
                              <Typography variant="caption" display="block">
                                Driver: {reservation.needDriver ? 'Required' : 'Self Drive'}
                              </Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                ID: {reservation.transactionId}
                              </Typography>
                            </Box>
                          ) : reservation.isTourReservation ? (
                            <Box>
                              <Typography variant="caption" display="block">
                                Guests: {reservation.guests}
                              </Typography>
                              <Typography variant="caption" display="block">
                                Tour Date: {new Date(reservation.tourDate).toLocaleDateString()}
                              </Typography>
                              {reservation.specialRequests && (
                                <Typography variant="caption" display="block" color="text.secondary">
                                  Requests: {reservation.specialRequests}
                                </Typography>
                              )}
                              {reservation.confirmationNumber && (
                                <Typography variant="caption" display="block" color="text.secondary">
                                  Conf: {reservation.confirmationNumber}
                                </Typography>
                              )}
                            </Box>
                          ) : (
                            <Box>
                              <Typography variant="caption" display="block">
                                Guests: {reservation.guests}
                              </Typography>
                              {reservation.rooms && (
                                <Typography variant="caption" display="block">
                                  Rooms: {reservation.rooms}
                                </Typography>
                              )}
                              {reservation.confirmationNumber && (
                                <Typography variant="caption" display="block" color="text.secondary">
                                  Conf: {reservation.confirmationNumber}
                                </Typography>
                              )}
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            Rs. {reservation.totalAmount?.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={reservation.status}
                            color={
                              reservation.status === 'pending' ? 'warning' :
                              reservation.status === 'confirmed' ? 'success' : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {reservation.status === 'pending' && !reservation.isLegacyVehicle && (
                            <>
                              <IconButton
                                color="success"
                                onClick={() => handleApproveReservation(reservation)}
                                title="Approve"
                              >
                                <CheckCircle />
                              </IconButton>
                              <IconButton
                                color="error"
                                onClick={() => handleRejectReservation(reservation)}
                                title="Reject"
                              >
                                <Cancel />
                              </IconButton>
                            </>
                          )}
                          {reservation.isLegacyVehicle && (
                            <Chip size="small" label="Legacy" variant="outlined" />
                          )}
                          {reservation.isTourReservation && (
                            <Chip size="small" label="Tour" variant="outlined" color="primary" />
                          )}
                          <IconButton>
                            <Visibility />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {currentTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Analytics
            </Typography>
            <Alert severity="info">
              Analytics dashboard coming soon!
            </Alert>
          </Box>
        )}
      </Paper>

      {/* Service Dialog */}
      <Dialog open={openServiceDialog} onClose={() => setOpenServiceDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedService ? 'Edit Service' : 'Add New Service'}
        </DialogTitle>
        <DialogContent>
          {renderServiceForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenServiceDialog(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSaveService} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : (selectedService ? 'Update' : 'Add')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={openRejectDialog} onClose={() => setOpenRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Reject Reservation
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Reason for rejection"
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Please provide a reason for rejecting this reservation..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectDialog(false)}>Cancel</Button>
          <Button onClick={confirmRejectReservation} variant="contained" color="error">
            Reject Reservation
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ServiceProviderDashboard; 