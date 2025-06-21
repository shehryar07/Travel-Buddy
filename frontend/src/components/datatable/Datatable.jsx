import { DataGrid } from "@mui/x-data-grid";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import axios from "axios";
import "./datatable.scss";
import Swal from "sweetalert2";
import CircularProgress from "@mui/material/CircularProgress";

const Datatable = ({ columns, data, setData, loading: externalLoading, onEdit, refreshData }) => {
  const location = useLocation();
  const path = location.pathname.split("/")[1];

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();

  const handleDelete = async (id) => {
    const confirmResult = await Swal.fire({
      title: "Are you sure you want to delete this?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "No, cancel",
      reverseButtons: true,
    });

    if (confirmResult.isConfirmed) {
      try {
        setIsLoading(true);
        console.log("Attempting to delete item with ID:", id);
        
        let deleteUrl;
        if (path === "users") {
          deleteUrl = `http://localhost:5000/api/users/delete/${id}`;
          await axios.delete(deleteUrl);
        } else if (path === "hotels") {
          deleteUrl = `http://localhost:5000/api/hotels/${id}`;
          await axios.delete(deleteUrl);
        } else if (path === "tours") {
          deleteUrl = `http://localhost:5000/api/tours/${id}`;
          await axios.delete(deleteUrl);
        } else if (path === "vehicle") {
          deleteUrl = `http://localhost:5000/api/vehicle/${id}`;
          await axios.delete(deleteUrl);
        } else if (path === "train") {
          deleteUrl = `http://localhost:5000/api/train/${id}`;
          await axios.delete(deleteUrl);
        } else if (path === "Restaurants" || path === "admin/restaurants") {
          deleteUrl = `http://localhost:5000/api/restaurant/${id}`;
          console.log("Restaurant delete URL:", deleteUrl);
          await axios.delete(deleteUrl);
        } else {
          deleteUrl = `http://localhost:5000/api/${path}/${id}`;
          await axios.delete(deleteUrl);
        }
        
        console.log("Delete URL:", deleteUrl);
        
        setIsLoading(false);
        
        // Update the local state to reflect the deletion
        if (setData) {
          setData(data.filter((item) => item._id !== id));
        }
        
        // Set flag in localStorage to trigger refresh when returning to this page
        localStorage.setItem(`need${path.charAt(0).toUpperCase() + path.slice(1)}Refresh`, 'true');
        
        // Use the refreshData function if it exists
        if (typeof refreshData === 'function') {
          await refreshData();
        }
        
        Swal.fire("Deleted!", "The item has been deleted.", "success");
      } catch (error) {
        console.error("Error deleting item:", error);
        console.error("Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          stack: error.stack
        });
        
        setIsLoading(false);
        
        Swal.fire({
          icon: "error",
          title: "Error Deleting Item",
          text: `Error: ${error.message}`,
          footer: error.response?.data ? `Server response: ${JSON.stringify(error.response.data)}` : "No server response"
        });
      }
    }
  };

  const handleView = async (id) => {
    try {
      setIsLoading(true);
      console.log("Attempting to view item with ID:", id);
      
      if (path === "users") {
        console.log("View URL:", `/users/${id}`);
        const userdata = await axios.get(`http://localhost:5000/api/users/all/${id}`);
        console.log("User data received:", userdata.data);
        navigate("/userpage", { state: userdata.data });
      }
      if (path === "hotels") {
        console.log("Hotel view URL:", `http://localhost:5000/api/hotels/find/${id}`);
        const hoteldata = await axios.get(`http://localhost:5000/api/hotels/find/${id}`);
        console.log("Hotel data received:", hoteldata.data);
        navigate("/hoteladmin", { state: hoteldata.data });
      }
      if (path === "vehicle") {
        console.log("Vehicle view URL:", `http://localhost:5000/api/vehicle/${id}`);
        const vehicledata = await axios.get(`http://localhost:5000/api/vehicle/${id}`);
        navigate("/vehicle/view/", { state: vehicledata.data });
      }
      //path tour
      if (path === "tours") {
        console.log("Tour view URL:", `http://localhost:5000/api/tours/${id}`);
        const tourData = await axios.get(`http://localhost:5000/api/tours/${id}`);
        navigate("/tour/view", { state: tourData.data });
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error viewing item:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: "Error Viewing Details",
        text: `Error: ${error.message}`,
        footer: error.response?.data ? `Server response: ${JSON.stringify(error.response.data)}` : "No server response"
      });
    }
  };
  
  // Function to handle edit button click
  const handleEdit = (row) => {
    if (onEdit) {
      onEdit(row);
    } else {
      // If no custom edit handler is provided, use default navigation
      if (path === "users") {
        navigate("/update", { state: row });
      } else if (path === "hotels") {
        navigate(`/hotels/update/${row._id}`);
      } else if (path === "tours") {
        navigate("/tour/update", { 
          state: { 
            data: { 
              oneTour: row 
            } 
          } 
        });
      } else if (path === "vehicle") {
        navigate(`/vehicle/edit/${row._id}`);
      } else if (path === "train") {
        navigate(`/train/update/${row._id}`);
      } else if (path === "Restaurants" || path === "admin/restaurants") {
        console.log("Editing restaurant with data:", row);
        navigate("/addrestaurants", { state: { edit: true, data: row } });
      }
    }
  };

  const actionColumn = [
    {
      field: "action",
      headerName: "Action",
      width: 300,
      renderCell: (params) => {
        return (
          <div className="cellAction">
            <div
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded cursor-pointer mr-1"
              onClick={() => handleView(params.row._id)}
            >
              View
            </div>

            <div
              className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-4 rounded cursor-pointer mr-1"
              onClick={() => handleEdit(params.row)}
            >
              Edit
            </div>

            <div
              onClick={() => handleDelete(params.row._id)}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-4 rounded cursor-pointer"
            >
              Delete
            </div>
          </div>
        );
      },
    },
  ];

  // Use useMemo to filter the list only when the search query changes
  const filteredList = useMemo(() => {
    // Ensure data is an array before filtering
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log("Data is empty or invalid:", data);
      return [];
    }
    
    if (!searchQuery) {
      return data;
    }

    const searchRegex = new RegExp(searchQuery.trim(), "i");
    return data.filter((item) => {
      if (!item) return false;
      
      // Combine all searchable fields into a single string to search in
      const searchableString = `${item.name || ''} ${item.type || ''} ${item.email || ''} ${item.mobile || ''} ${item.country || ''} ${item.ownerName || ''} ${item.vehicleType || ''}`;

      return searchRegex.test(searchableString);
    });
  }, [data, searchQuery]);

  return (
    <>
      <div className="flex flex-col col-span-2 lg:px-32 px-8 pt-3 pb-8 gap-5">
        <div className="flex md:justify-end">
          <input
            className="border-4 rounded py-2 px-4 lg:mt-0 mt-3 w-full"
            placeholder="Search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="datatable">
          <DataGrid
            className="datagrid"
            rows={filteredList || []}
            columns={location.pathname === "/admin/restaurants" ? columns : columns.concat(actionColumn)}
            loading={isLoading || externalLoading}
            loadingOverlay={
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: "100%",
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <CircularProgress />
              </div>
            }
            pageSize={9}
            rowsPerPageOptions={[9]}
            checkboxSelection
            getRowId={(row) => row._id || Math.random().toString()}
          />
        </div>
      </div>
    </>
  );
};
export default Datatable;
