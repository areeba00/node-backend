const express = require("express");

const router = express.Router();
const user = require("../pg_controllers/users");
const { validateUser } = require("../../middleware/Validation");

router.get("/", user.getAllUsers);
router.post("/", validateUser, user.create);

module.exports = router;
