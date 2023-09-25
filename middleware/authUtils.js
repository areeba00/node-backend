const jwt = require("jsonwebtoken");
const config = require("config");

function generateAuthToken(userId) {
  const token = jwt.sign({ _id: userId }, config.get("jwtprivatekey"), {
    expiresIn: "1d",
  });
  return token;
}

module.exports = {
  generateAuthToken,
};
