import { Link } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import { useState, useEffect } from "react";

const HotelCard = () => {
  const { data: existingHotels, loading: hotelsLoading, error: hotelsError } = useFetch(`/hotels`);
  const [newServices, setNewServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [imgError, setImgError] = useState({});
  
  // Fetch new hotel services from provider dashboard
  useEffect(() => {
    const fetchNewHotelServices = async () => {
      try {
        setServicesLoading(true);
        const response = await fetch('http://localhost:5000/api/services/hotel');
        const result = await response.json();
        
        if (result.success) {
          setNewServices(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching new hotel services:', error);
      } finally {
        setServicesLoading(false);
      }
    };

    fetchNewHotelServices();
  }, []);

  // Combine existing hotels and new services
  const allHotels = [
    ...(existingHotels || []),
    ...newServices.map(service => ({
      _id: service._id,
      name: service.name,
      city: service.location || 'Location not specified',
      cheapestPrice: service.price,
      HotelImgs: service.images || [],
      description: service.description,
      roomType: service.roomType,
      availableRooms: service.availableRooms,
      isNewService: true, // Flag to distinguish new services
      providerId: service.providerId
    }))
  ];

  const loading = hotelsLoading || servicesLoading;
  const error = hotelsError;
  
  // Handle image loading errors
  const handleImageError = (itemId) => {
    setImgError(prev => ({
      ...prev,
      [itemId]: true
    }));
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-16 xl:px-20 py-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {loading ? (
          <div className="col-span-full flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {allHotels && allHotels.length > 0 ? (
              allHotels.map((item) => (
                <div
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                  key={item._id || item.id}
                >
                  {/* Show badge for new services */}
                  {item.isNewService && (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        New
                      </span>
                    </div>
                  )}
                  
                  {/* Image handling for both old and new services */}
                  {!imgError[item._id || item.id] && 
                   ((item.HotelImgs && item.HotelImgs.length > 0) || (item.images && item.images.length > 0)) ? (
                    <img
                      src={
                        item.isNewService 
                          ? (item.images?.[0] || "https://via.placeholder.com/400x250?text=Hotel+Image")
                          : `http://localhost:5000/api/hotels/images/${item.HotelImgs[0]}`
                      }
                      alt={item.name}
                      className="w-full object-cover h-64"
                      onError={() => handleImageError(item._id || item.id)}
                    />
                  ) : (
                    <img
                      src="https://via.placeholder.com/400x250?text=Hotel+Image"
                      alt="Placeholder"
                      className="w-full object-cover h-64"
                    />
                  )}
                  
                  <div className="p-4">
                    <h2 className="font-bold text-gray-700 text-lg mb-2">
                      {item.name}
                    </h2>
                    <p className="font-light text-gray-500 mb-2">{item.city}</p>
                    {item.roomType && (
                      <p className="font-light text-gray-600 text-sm mb-1">
                        Room Type: {item.roomType}
                      </p>
                    )}
                    {item.availableRooms && (
                      <p className="font-light text-gray-600 text-sm mb-2">
                        Available Rooms: {item.availableRooms}
                      </p>
                    )}
                    <p className="font-medium text-gray-900 mb-2">
                      Starting from Rs.{item.cheapestPrice}
                    </p>
                    <div className="flex items-center">
                      <Link to={
                        item.isNewService 
                          ? `/services/hotel/${item._id}`
                          : `/hoteloverview/${item._id || item.id}`
                      }>
                        <button className="bg-blue-700 text-white font-bold px-3 py-1 rounded mr-2" type="button">
                          View
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-gray-500">No hotels found. Please check back later.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HotelCard;
