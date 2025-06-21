import React, { useState, useEffect } from 'react';
import { useContext } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Box,
  Alert,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { Hotel, DirectionsCar, Tour, Restaurant, Flight, Event, Train } from '@mui/icons-material';
import ValidatedInput, { ValidatedTextarea, ValidatedSelect, FormErrorSummary } from '../components/form/ValidatedInput';
import { validateForm, validateField, ValidationTypes, focusOnField } from '../utils/formValidation';
import { AuthContext } from "../context/authContext";

const serviceProviderTypes = [
  { value: 'hotel', label: 'Hotel Provider', icon: <Hotel />, description: 'Manage hotels and accommodations' },
  { value: 'vehicle', label: 'Vehicle Provider', icon: <DirectionsCar />, description: 'Manage rental vehicles and transportation' },
  { value: 'tour', label: 'Tour Operator', icon: <Tour />, description: 'Organize and manage tour packages' },
  { value: 'restaurant', label: 'Restaurant Provider', icon: <Restaurant />, description: 'Manage dining establishments' },
  { value: 'flight', label: 'Flight Agent', icon: <Flight />, description: 'Manage flight bookings and services' },
  { value: 'event', label: 'Event Manager', icon: <Event />, description: 'Organize and manage events and activities' },
  { value: 'train', label: 'Train Agent', icon: <Train />, description: 'Manage train bookings and services' }
];

const stateOptions = [
  'Balochistan', 'Khyber Pakhtunkhwa', 'Punjab', 'Sindh', 'Azad Kashmir', 
  'Gilgit-Baltistan', 'Islamabad Capital Territory'
];

const steps = ['Select Service Type', 'Personal Details', 'Business Details', 'Documentation', 'Submit Request'];

// Enhanced validation schema with specific rules for each step
const getValidationSchema = (step) => {
  switch (step) {
    case 1: // Personal Details
      return {
        firstName: [{ type: ValidationTypes.REQUIRED }],
        lastName: [{ type: ValidationTypes.REQUIRED }],
        email: [
          { type: ValidationTypes.REQUIRED },
          { type: ValidationTypes.EMAIL }
        ],
        phone: [
          { type: ValidationTypes.REQUIRED },
          { type: ValidationTypes.PHONE }
        ]
      };
    
    case 2: // Business Details  
      return {
        businessName: [{ type: ValidationTypes.REQUIRED }],
        businessAddress: [{ type: ValidationTypes.REQUIRED }],
        businessCity: [{ type: ValidationTypes.REQUIRED }],
        businessState: [{ type: ValidationTypes.REQUIRED }],
        businessZip: [
          { type: ValidationTypes.REQUIRED },
          { type: ValidationTypes.ZIP_CODE }
        ],
        businessPhone: [
          { type: ValidationTypes.REQUIRED },
          { type: ValidationTypes.PHONE }
        ],
        businessEmail: [
          { type: ValidationTypes.REQUIRED },
          { type: ValidationTypes.EMAIL }
        ],
        businessWebsite: [{ type: ValidationTypes.URL }]
      };
    
    case 3: // Documentation
      return {
        registrationNumber: [
          { type: ValidationTypes.REQUIRED },
          { type: ValidationTypes.BUSINESS_REGISTRATION }
        ],
        licenseNumber: [
          { type: ValidationTypes.REQUIRED },
          { type: ValidationTypes.LICENSE_NUMBER }
        ],
        taxId: [
          { type: ValidationTypes.REQUIRED },
          { type: ValidationTypes.TAX_ID }
        ],
        experience: [
          { type: ValidationTypes.REQUIRED },
          { type: ValidationTypes.POSITIVE_NUMBER }
        ],
        serviceDetails: [
          { type: ValidationTypes.REQUIRED }
        ]
      };
    
    default:
      return {};
  }
};

const ServiceProviderRequest = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState({
    // Personal Details
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Business Details
    businessName: '',
    businessAddress: '',
    businessCity: '',
    businessState: '',
    businessZip: '',
    businessPhone: '',
    businessEmail: '',
    businessWebsite: '',
    
    // Documentation
    registrationNumber: '',
    licenseNumber: '',
    taxId: '',
    
    // Service Specific
    serviceDetails: '',
    experience: '',
    additionalInfo: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});

  const handleInputChange = (field) => (value) => {
    setFormData({
      ...formData,
      [field]: value
    });
    
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleFieldBlur = (field) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    
    // Validate individual field on blur
    const validationSchema = getValidationSchema(activeStep);
    if (validationSchema[field]) {
      const { isValid, error } = validateField(formData[field], validationSchema[field]);
      if (!isValid) {
        setFormErrors(prev => ({ ...prev, [field]: error }));
      }
    }
  };

  const validateCurrentStep = () => {
    const validationSchema = getValidationSchema(activeStep);
    const validation = validateForm(formData, validationSchema);
    
    setFormErrors(validation.errors);
    setTouchedFields(Object.keys(validationSchema).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {}));
    
    if (!validation.isValid && validation.firstErrorField) {
      focusOnField(validation.firstErrorField);
    }
    
    return validation.isValid;
  };

  const handleNext = () => {
    if (activeStep === 0 && !selectedType) {
      setError('Please select a service type to continue');
      return;
    }
    
    if (activeStep > 0) {
      const isValid = validateCurrentStep();
      if (!isValid) {
        setError('Please fix the validation errors below before continuing');
        return;
      }
    }
    
    setError(null);
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    // Check if user is logged in
    if (!user) {
      setError('You must be logged in to submit a service provider request. Please log in first.');
      return;
    }

    // Get token from localStorage
    const token = localStorage.getItem('token');
    console.log('Authentication check:', { user, token });
    
    if (!token) {
      setError('Authentication token not found. Please log out and log in again to fix this issue.');
      return;
    }

    // Validate all steps
    let hasErrors = false;
    const allErrors = {};
    
    for (let step = 1; step <= 3; step++) {
      const validationSchema = getValidationSchema(step);
      const validation = validateForm(formData, validationSchema);
      
      if (!validation.isValid) {
        hasErrors = true;
        Object.assign(allErrors, validation.errors);
      }
    }
    
    if (hasErrors) {
      setFormErrors(allErrors);
      setError('Please fix all validation errors before submitting');
      
      // Go back to first step with errors
      for (let step = 1; step <= 3; step++) {
        const validationSchema = getValidationSchema(step);
        const hasStepErrors = Object.keys(validationSchema).some(field => allErrors[field]);
        if (hasStepErrors) {
          setActiveStep(step);
          break;
        }
      }
      return;
    }

    try {
      setFormLoading(true);
      setError(null);

      const requestData = {
        ...formData,
        providerType: selectedType,
        status: 'pending'
      };

      console.log('Submitting request data:', requestData);

      // API call to submit service provider request
      const response = await fetch('/api/service-provider-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      console.log('Response status:', response.status);
      
      // Check if response is ok and is JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Request failed: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error('Non-JSON response:', errorText);
        throw new Error(`Server returned non-JSON response: ${errorText.substring(0, 200)}...`);
      }

      const result = await response.json();
      console.log('Server response:', result);

      if (result.success) {
        setSuccess(true);
        setActiveStep(4); // Move to success step
      } else {
        // Handle backend validation errors
        if (result.fieldErrors || result.errors) {
          setFormErrors(result.fieldErrors || result.errors);
          
          // Find first step with errors and navigate to it
          for (let step = 1; step <= 3; step++) {
            const validationSchema = getValidationSchema(step);
            const hasStepErrors = Object.keys(validationSchema).some(field => 
              (result.fieldErrors || result.errors)[field]
            );
            if (hasStepErrors) {
              setActiveStep(step);
              break;
            }
          }
        }
        throw new Error(result.message || 'Failed to submit request');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const getFieldError = (fieldName) => {
    return touchedFields[fieldName] ? formErrors[fieldName] : null;
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                What type of service do you want to provide?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select the type of service you want to offer to travelers. This will help us configure your dashboard appropriately.
              </Typography>
            </Grid>
            {serviceProviderTypes.map((type) => (
              <Grid item xs={12} sm={6} md={4} key={type.value}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: selectedType === type.value ? 2 : 1,
                    borderColor: selectedType === type.value ? 'primary.main' : 'grey.300',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-2px)',
                      boxShadow: 3
                    }
                  }}
                  onClick={() => setSelectedType(type.value)}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box sx={{ fontSize: 48, color: 'primary.main', mb: 1 }}>
                      {type.icon}
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {type.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {type.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                We need your personal details to create your service provider account.
              </Typography>
              <FormErrorSummary errors={formErrors} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ValidatedInput
                name="firstName"
                label="First Name"
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                onBlur={() => handleFieldBlur('firstName')}
                error={getFieldError('firstName')}
                required
                placeholder="Enter your first name"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ValidatedInput
                name="lastName"
                label="Last Name"
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                onBlur={() => handleFieldBlur('lastName')}
                error={getFieldError('lastName')}
                required
                placeholder="Enter your last name"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ValidatedInput
                name="email"
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={handleInputChange('email')}
                onBlur={() => handleFieldBlur('email')}
                error={getFieldError('email')}
                required
                placeholder="Enter your email address"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ValidatedInput
                name="phone"
                type="tel"
                label="Phone Number"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                onBlur={() => handleFieldBlur('phone')}
                error={getFieldError('phone')}
                required
                placeholder="Enter your phone number"
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Business Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Provide details about your business. This information will be displayed to customers.
              </Typography>
              <FormErrorSummary errors={formErrors} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ValidatedInput
                name="businessName"
                label="Business Name"
                value={formData.businessName}
                onChange={handleInputChange('businessName')}
                onBlur={() => handleFieldBlur('businessName')}
                error={getFieldError('businessName')}
                required
                placeholder="Enter your business name"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ValidatedInput
                name="businessPhone"
                type="tel"
                label="Business Phone"
                value={formData.businessPhone}
                onChange={handleInputChange('businessPhone')}
                onBlur={() => handleFieldBlur('businessPhone')}
                error={getFieldError('businessPhone')}
                required
                placeholder="Enter your business phone"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ValidatedInput
                name="businessEmail"
                type="email"
                label="Business Email"
                value={formData.businessEmail}
                onChange={handleInputChange('businessEmail')}
                onBlur={() => handleFieldBlur('businessEmail')}
                error={getFieldError('businessEmail')}
                required
                placeholder="Enter your business email"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ValidatedInput
                name="businessWebsite"
                type="url"
                label="Business Website"
                value={formData.businessWebsite}
                onChange={handleInputChange('businessWebsite')}
                onBlur={() => handleFieldBlur('businessWebsite')}
                error={getFieldError('businessWebsite')}
                placeholder="https://www.yourwebsite.com"
              />
            </Grid>
            <Grid item xs={12}>
              <ValidatedInput
                name="businessAddress"
                label="Business Address"
                value={formData.businessAddress}
                onChange={handleInputChange('businessAddress')}
                onBlur={() => handleFieldBlur('businessAddress')}
                error={getFieldError('businessAddress')}
                required
                placeholder="Enter your complete business address"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <ValidatedInput
                name="businessCity"
                label="City"
                value={formData.businessCity}
                onChange={handleInputChange('businessCity')}
                onBlur={() => handleFieldBlur('businessCity')}
                error={getFieldError('businessCity')}
                required
                placeholder="Enter city"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <ValidatedSelect
                name="businessState"
                label="State"
                value={formData.businessState}
                onChange={handleInputChange('businessState')}
                onBlur={() => handleFieldBlur('businessState')}
                error={getFieldError('businessState')}
                options={stateOptions}
                required
                placeholder="Select state"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <ValidatedInput
                name="businessZip"
                label="ZIP Code"
                value={formData.businessZip}
                onChange={handleInputChange('businessZip')}
                onBlur={() => handleFieldBlur('businessZip')}
                error={getFieldError('businessZip')}
                required
                placeholder="Enter ZIP code"
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Documentation & Licenses
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Provide your business documentation and licensing information for verification.
              </Typography>
              <FormErrorSummary errors={formErrors} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ValidatedInput
                name="registrationNumber"
                label="Business Registration Number"
                value={formData.registrationNumber}
                onChange={handleInputChange('registrationNumber')}
                onBlur={() => handleFieldBlur('registrationNumber')}
                error={getFieldError('registrationNumber')}
                required
                placeholder="Enter registration number"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ValidatedInput
                name="licenseNumber"
                label="License Number"
                value={formData.licenseNumber}
                onChange={handleInputChange('licenseNumber')}
                onBlur={() => handleFieldBlur('licenseNumber')}
                error={getFieldError('licenseNumber')}
                required
                placeholder="Enter license number"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ValidatedInput
                name="taxId"
                label="Tax ID"
                value={formData.taxId}
                onChange={handleInputChange('taxId')}
                onBlur={() => handleFieldBlur('taxId')}
                error={getFieldError('taxId')}
                required
                placeholder="Enter tax ID number"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ValidatedInput
                name="experience"
                type="number"
                label="Years of Experience"
                value={formData.experience}
                onChange={handleInputChange('experience')}
                onBlur={() => handleFieldBlur('experience')}
                error={getFieldError('experience')}
                required
                placeholder="Enter years of experience"
                min="0"
              />
            </Grid>
            <Grid item xs={12}>
              <ValidatedTextarea
                name="serviceDetails"
                label="Service Details"
                value={formData.serviceDetails}
                onChange={handleInputChange('serviceDetails')}
                onBlur={() => handleFieldBlur('serviceDetails')}
                error={getFieldError('serviceDetails')}
                required
                rows={4}
                placeholder="Describe your services in detail..."
              />
            </Grid>
            <Grid item xs={12}>
              <ValidatedTextarea
                name="additionalInfo"
                label="Additional Information"
                value={formData.additionalInfo}
                onChange={handleInputChange('additionalInfo')}
                rows={3}
                placeholder="Any additional information you'd like to share..."
              />
            </Grid>
          </Grid>
        );

      case 4:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Review Your Application
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Please review your information before submitting your application.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Service Type:</strong> {serviceProviderTypes.find(t => t.value === selectedType)?.label}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Personal Details:</strong> {formData.firstName} {formData.lastName}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Email:</strong> {formData.email}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Phone:</strong> {formData.phone}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Business Name:</strong> {formData.businessName}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Business Email:</strong> {formData.businessEmail}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Business Address:</strong> {formData.businessAddress}, {formData.businessCity}, {formData.businessState} {formData.businessZip}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Registration Number:</strong> {formData.registrationNumber}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>License Number:</strong> {formData.licenseNumber}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Experience:</strong> {formData.experience} years
                </Typography>
              </Paper>
            </Grid>
            {success && (
              <Grid item xs={12}>
                <Alert severity="success">
                  Your application has been submitted successfully! We will review it and get back to you within 3-5 business days.
                  You will receive a confirmation email shortly at {formData.email}.
                </Alert>
              </Grid>
            )}
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" align="center" gutterBottom>
        Become a Service Provider
      </Typography>
      <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        Join our network of trusted service providers and start growing your business with Travely
      </Typography>

      <Paper sx={{ p: 4, mb: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {renderStepContent()}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0 || success}
            variant="outlined"
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
            disabled={formLoading || success}
            size="large"
          >
            {formLoading ? 'Submitting...' : activeStep === steps.length - 1 ? 'Submit Application' : 'Next'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ServiceProviderRequest; 