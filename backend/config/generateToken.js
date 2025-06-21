const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, "travelyVerification", {
    expiresIn: "1d",
  });
};

module.exports = generateToken;