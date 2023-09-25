const express = require("express");

const router = express.Router();
const auth = require("../pg_controllers/auth");
const { validateAuth } = require("../../middleware/Validation");

router.post("/", validateAuth, auth.create);

module.exports = router;
