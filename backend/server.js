const cookieParser = require("cookie-parser");
const express = require("express");
const dotenv = require("dotenv").config();
const path = require("path");
const app = express();
const bodyParser = require("body-parser");
const colors = require("colors");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const chatRoutes = require("./routes/chatRoutes");

const cors = require("cors");
//db connection
const connectDB = require("./config/db");
connectDB();
app.use(express.json({ limit: "50mb", extended: true }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Configure CORS to accept requests from frontend
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

//to use json

//middlewares

app.use(bodyParser.json({ limit: "50mb" }));

//to accept body data
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

//calling the routes
//isuru
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

// Community Routes
const communityRoutes = require("./routes/communityRoutes");
app.use("/api/community", communityRoutes);
app.use('/api/community/images', express.static(path.join(__dirname, 'images/community')));

// Notification Routes
const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

// Service Provider and Admin Routes
const serviceProviderRoutes = require("./routes/serviceProviderRoutes");
const providerServiceRoutes = require("./routes/providerServiceRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const adminRoutes = require("./routes/adminRoutes");

app.use("/api/service-provider-requests", serviceProviderRoutes);
app.use("/api/provider/services", providerServiceRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/admin", adminRoutes);

//ishara
const tourRouter = require("./routes/tourRouter");
app.use("/api/tours", tourRouter);

//yasiru
const vehicleRouter = require("./routes/vehicles");
const reservationRouter = require("./routes/vehicleReservations");

app.use("/api/vehicle", vehicleRouter);
app.use("/api/vehicle/images", express.static(path.join(__dirname, "images")));
app.use("/api/vehiclereservation", reservationRouter);

//chamith
const hotels = require('./routes/hotels');
const rooms = require('./routes/rooms');
const hotelreservation = require('./routes/hotelReservationRoute');

app.use('/api/hotels', hotels);
app.use('/api/rooms', rooms);
app.use('/api/hotelreservation',hotelreservation)
app.use('/api/hotels/images', express.static(path.join(__dirname, 'images')));

//navindi
const restaurantRoute = require("./routes/restaurantRoute.js");
const restaurantTypeRoute = require("./routes/restaurantTypeRoute");
const restaurantDistrictRoute = require("./routes/restaurantDistrictRoute");
const restaurantReservationTimeRoute = require("./routes/restaurantReservationTimeRoute");
const restaurantRateRoute = require("./routes/restaurantRateRoute");
const restaurantReservationRoute = require("./routes/restaurantReservationRoute");

app.use("/api/restaurant", restaurantRoute);
app.use("/api/restaurantType", restaurantTypeRoute);
app.use("/api/restaurantDistrict", restaurantDistrictRoute);
app.use("/api/restaurantReservationTime", restaurantReservationTimeRoute);
app.use("/api/restaurantRate", restaurantRateRoute);
app.use("/api/restaurantReservation", restaurantReservationRoute);

// sehan
const trainRouter = require("./routes/train");
app.use("/api/train", trainRouter);
app.use("/api/train/images", express.static(path.join(__dirname, "images/train")));

const seatBookingRouter = require("./routes/SeatBookings");
app.use("/api/seatBookings", seatBookingRouter);

const flightBookingRouter = require("./routes/SeatBookingFlight");
app.use("/api/flight", flightBookingRouter);


// dinidu
const refundRouter = require("./routes/RefundRoute")
app.use("/api/refund",refundRouter)

const EmployeeRouter = require("./routes/EmployeeRoute")
app.use("/api/employee",EmployeeRouter)

const SalaryRouter = require("./routes/SalaryRoute")
app.use("/api/salary",SalaryRouter)

const RecordRouter = require("./routes/FinanceHealth")
app.use("/api/record",RecordRouter)


//hansika
const ActivityRoute = require("./routes/activityRoute");
const ReservationRoute = require("./routes/reservationRoute.js");

app.use("/api/activities", ActivityRoute);
app.use("/api/activity-reservations", ReservationRoute);

// Migration and unified transport routes
const migrationRoutes = require("./routes/migrationRoutes");
app.use("/api/migration", migrationRoutes);

app.get("/", (req, res) => {
  res.send("API is Running Succesfully");
});

/*app.get('/api/chat',(req,res) => {
    res.send(chats);
});*/

app.use("/api/message", messageRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);

/*app.get('/api/chat/:id',(req,res) =>{
    //console.log(req.params.id);
    const singleChat =chats.find((c) =>c._id ===req.params.id);
    res.send(singleChat);
});*/

//define the port number
const port = process.env.PORT || 5000;

//start the server
const server = app.listen(port, () =>
  console.log(`Server running on port ${port} 🔥`)
);

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    orgin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");
});
