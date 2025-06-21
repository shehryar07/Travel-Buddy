const jwt = require("jsonwebtoken");
const User = require("../models/userModel.js");
const asyncHandler = require("express-async-handler");

const verifyToken = (req, res, next) => {
  const token = req.cookies.access_token;
  if (!token) {
    return res.status(401).json({ message: "Access Denied" });
  }
  jwt.verify(token, process.env.JWT_SECRET || 'mekarahasak', (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid Token" });
    }
    req.user = user;
    next();
  });
};

const verifyUser = (req, res, next) => {
  const token = req.cookies.access_token;
  if (!token) {
    return res.status(401).json({ message: "Access Denied" });
  }
  jwt.verify(token, process.env.JWT_SECRET || 'mekarahasak', (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid Token" });
    }
    req.user = user;
    if (req.user.id === req.params.id || req.user.isAdmin) {
      next();
    } else {
      res.status(403).json({ message: "You are not allowed to do that" });
    }
  });
};

const verifyAdmin = (req, res, next) => {
  const token = req.cookies.access_token;
  if (!token) {
    return res.status(401).json({ message: "Access Denied" });
  }
  jwt.verify(token, process.env.JWT_SECRET || 'mekarahasak', (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid Token" });
    }
    req.user = user;
    if (req.user.isAdmin) {
      next();
    } else {
      res.status(403).json({ message: "You are not allowed to do that" });
    }
  });
};

const protect = asyncHandler(async (req, res, next) => {
  let token;
  
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
    
  ) {
    console.log("Authorization header is present and has the correct format");
    try {

      token = req.headers.authorization.split(" ")[1];

      console.log(token);

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mekarahasak');

      console.log(decoded)

      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      console.log("Error verifying token:", error);
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  } else {
    console.log("Authorization header is missing or has an incorrect format");
    res.status(401);
    throw new Error("Not authorized, invalid token format");
  }
});

const protectAdmin = asyncHandler(async (req, res, next) => {
  let token;
  
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mekarahasak');
      
      req.user = await User.findById(decoded.id).select("-password");
      
      // Check if user is admin
      if (!req.user.isAdmin) {
        res.status(403);
        throw new Error("Access denied. Admin privileges required.");
      }
      
      next();
    } catch (error) {
      console.log("Error verifying admin token:", error);
      res.status(401);
      throw new Error("Not authorized, admin token failed");
    }
  } else {
    res.status(401);
    throw new Error("Not authorized, admin token required");
  }
});

module.exports = {
  verifyToken,
  verifyUser,
  verifyAdmin,
  protect,
  protectAdmin
};
