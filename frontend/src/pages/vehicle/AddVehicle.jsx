import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import Swal from 'sweetalert2'
import { useContext } from "react";
import { AuthContext } from "../../context/authContext";

const AddVehicle = () => {
  const navigate = useNavigate();

  const countWords = (description) => {
    return description.trim().split(/./g).length;
  };


  const [error, setError] = useState('');

  const validateVehicleNumber = () => {
    const regex = /^[A-Z]{3}-\d{4}$|^\d{2}-\d{4}$|^[A-Z]{2}-\d{4}$|^\d{1}-\d{4}$/;
    
    console.log("Validating vehicle number:", vehicleNumber);
    
    if (!vehicleNumber) {
      console.error("Vehicle number is empty");
      setError('Vehicle number cannot be empty');
      return false;
    }
    
    if (!regex.test(vehicleNumber)) {
      console.error("Invalid vehicle number format:", vehicleNumber);
      setError('Invalid vehicle number. Please enter a valid vehicle number.');
      return false;
    }
    
    console.log("Vehicle number is valid");
    setError('');
    return true;
  };

  const { user } = useContext(AuthContext);

  const [ownerName, setOwnerName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [model, setModel] = useState('');
  const [vehicleType, setVehicleType] = useState('Car');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [numberOfSeats, setNumberOfSeats] = useState('');
  const [transmissionType, setTransmissionType] = useState('Auto');
  const [fuelType, setFuelType] = useState('Petrol');
  const [rentPrice, setRentPrice] = useState('');
  const [insuranceImgs, setInsuranceImgs] = useState([]); // [img1, img2, img3]
  const [vehicleMainImg, setVehicleMainImg] = useState('');
  const [vehicleImgs, setVehicleImgs] = useState([]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  console.log(model)
  console.log(fuelType)
  async function sendData(e){
    e.preventDefault();

    if (!validateVehicleNumber()) {
      return;
    }
  
    const formData = new FormData();

    formData.append('ownerName', ownerName);
    formData.append('brand', brandName);
    formData.append('model', model);
    formData.append('vehicleType', vehicleType);
    formData.append('userId', user._id);
    formData.append('vehicleNumber', vehicleNumber);
    formData.append('capacity', numberOfSeats);
    formData.append('transmissionType', transmissionType);
    formData.append('fuelType', fuelType);
    formData.append('price', rentPrice);
    formData.append('description', description);

    for(let i = 0; i < insuranceImgs.length; i++){
      formData.append('insuranceImgs', insuranceImgs[i]);
    }

    formData.append('vehicleMainImg', vehicleMainImg);

    for(let i = 0; i < vehicleImgs.length; i++){
      formData.append('vehicleImgs', vehicleImgs[i]);
    }

    formData.append('location', location);

    console.log("Submitting vehicle data with image count:", insuranceImgs.length, vehicleImgs.length);
    console.log("Vehicle details:", { ownerName, brandName, model, vehicleType, vehicleNumber, numberOfSeats });
    
    try {
      const response = await axios.post('http://localhost:5000/api/vehicle', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log("Success response:", response);
      
      Swal.fire({
        icon: 'success',
        title: 'Vehicle Added Successfully',
        showConfirmButton: true,
        timer: 1500
      }).then(() => {
        // Navigate to vehicle list
        navigate("/vehicle");
      });
    } catch (err) {
      console.error("Error:", err);
      console.error("Error details:", err.response ? err.response.data : "No response data");
      console.error("Error status:", err.response ? err.response.status : "No status");
      
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: `Error: ${err.message}`,
        footer: err.response ? JSON.stringify(err.response.data) : "No server response"
      });
    }
  }




  return (
    <div className='p-4 text-[#383838]  justify-center lg:px-96'>
        <h1 className='text-lg lg:text-2xl font-bold py-6  text-center'>Add a Vehicle</h1>
        <form onSubmit={sendData} encType='multipart/form-data'>
            
            <label for className='lg:text-lg text-left'>Vehicle Owner's Name</label>
            <input type='text' className='border rounded-lg w-full p-2 mb-6 mt-2' placeholder='Name' onChange={(e) => setOwnerName(e.target.value) } required/>

            <label for className='lg:text-lg text-left'>Vehicle Brand Name</label>
            <input type='text' className='border rounded-lg w-full p-2 mb-6 mt-2' placeholder='Honda' onChange={(e) => setBrandName(e.target.value) } required/>

            <label for className='lg:text-lg text-left'>Vehicle Model</label>
            <input type='text' className='border rounded-lg w-full p-2 mb-6 mt-2' placeholder='Civic' onChange={(e) => setModel(e.target.value) } required/>

            <label for className='lg:text-lg text-left'>Vehicle Type</label>
            <br></br>
            <select className='p-2 border rounded-md w-full bg-white mt-2 mb-6' value={vehicleType} onChange={(e) => setVehicleType(e.target.value) } required>
            
            
            <option>Car</option>
            <option>SUV</option>
            <option>Van</option>
            <option>Motor Bike</option>
            <option>Bus</option>
          </select>

          <label for className='lg:text-lg text-left'>Vehicle Number</label>
          <input type='text' className='border rounded-lg w-full p-2 mb-6  mt-2' placeholder='CAF-6458' onChange={(e) => setVehicleNumber(e.target.value) } required/>
          {error && <div className='text-[#ff2d2d] pb-4'>{error}</div>}

          <label for className='lg:text-lg text-left mt-6'>Number of Seats</label>
          <input type='number'  className='border rounded-lg w-full p-2 mb-6' placeholder='04' onChange={(e) => setNumberOfSeats(e.target.value) } required/>

          <label for className='lg:text-lg text-left'>Transmission Type</label>
          <br></br>
          <select className='p-2 border rounded-md w-full bg-white mt-2 mb-6' value={transmissionType} onChange={(e) => setTransmissionType(e.target.value) } required>
            
            <option>Auto</option>
            <option>Manual</option>
          </select>


          <label for className='lg:text-lg text-left'>Fuel Type</label>
          <br></br>
          <select className='p-2 border rounded-md w-full bg-white mt-2 mb-6' value={fuelType} onChange={(e) => setFuelType(e.target.value) } required>
            
            
            <option>Petrol</option>
            <option>Diesel</option>
            <option>Hybrid</option>
            <option>Electric</option>
          </select>

          <label htmlFor="cover-photo" className="block text-sm font-medium leading-6 text-gray-900">
                Rent Price
              </label>
          <input type='number' className='border rounded-lg w-full p-2 mb-6 mt-2' placeholder='12500' onChange={(e) => setRentPrice(e.target.value) } required/>

          <label htmlFor="cover-photo" className="block text-sm font-medium leading-6 text-gray-900">
                Description
              </label>
          <textarea rows = '4' maxLength={299} value={description} className='border rounded-lg w-full p-2  mt-2' placeholder='Add your description here' onChange={(e) => setDescription(e.target.value) } required/>
          <div className='mb-6 text-[#41A4FF]'>{countWords(description)}/300</div>

          <label htmlFor="cover-photo" className="block text-sm font-medium leading-6 text-gray-900"> Location </label>
          <input type='text' list='city' className='border rounded-lg w-full p-2 mb-6 mt-2' placeholder='Islamabad' onChange={(e) => setLocation(e.target.value) } required/>

          <datalist id='city'>
            
            <option value='Islamabad'></option>
            <option value='Lahore'></option>
            <option value='Karachi'></option>
            <option value='Kashmir'></option>
            <option value='Gilgit'></option>
            <option value='Skardu'></option>
            <option value='Sawat'></option>
            <option value='Naran'></option>

          </datalist>

          
          <label for className='lg:text-lg text-left'>Registration Images</label>
          <input type='file' required multiple className='border rounded-lg w-full p-2 mb-6 mt-2'
          onChange={(e) => {
            const files = e.target.files;
            const images = [];
          
            for (let i = 0; i < files.length; i++) {
              images.push(files[i]);
            }
            setInsuranceImgs(images);
          }} />

          <label for className='lg:text-lg text-left'>Vehicle Cover Image</label>  
          <input type='file' required className='border rounded-lg w-full p-2 mb-6 mt-2'
          onChange={(e) => setVehicleMainImg(e.target.files[0])}
          />


          <label for className='lg:text-lg text-left'>Vehicle Images</label>
          <input type='file' required multiple className='border rounded-lg w-full p-2 mb-6 mt-2'
          onChange={(e) => {
            const files = e.target.files;
            const images = [];
          
            for (let i = 0; i < files.length; i++) {
              images.push(files[i]);
            }
            setVehicleImgs(images);
          }} /> 


     


          <div className='flex flex-col lg:flex-row items-center justify-between lg:my-6'>
          <button 
            type="submit"
            onClick={() => console.log("Add Vehicle button clicked")}
            className="bg-[#41A4FF] text-white rounded-md font-bold p-3 my-5 lg:my-0 w-full">
                Add Vehicle
          </button>
          <button className="bg-[#636363] text-white rounded-md font-bold p-3 lg:ml-6 w-full mb-12 lg:mb-0" type="reset">
                Reset
          </button>
          </div>
          
          
        </form>
    </div>
  )
}

export default AddVehicle


