/* eslint-disable no-undef */
const jwt = require("jsonwebtoken");
const config = require("config");
const { generateAuthToken } = require("../../middleware/authUtils");

describe("generateAuthToken", () => {
  it("should generate a valid JWT token", () => {
    const userId = "user123";
    const expiresIn = "1d";
    const privateKey = config.get("jwtprivatekey");

    // Mock the jwt.sign function
    jwt.sign = jest.fn().mockReturnValue("mocked-token");

    // Call the generateAuthToken function
    const token = generateAuthToken(userId);

    // Expectations
    expect(jwt.sign).toHaveBeenCalledWith({ _id: userId }, privateKey, {
      expiresIn,
    });
    expect(token).toBe("mocked-token");
  });
});
