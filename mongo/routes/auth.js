const express = require("express");

const router = express.Router();
const auth = require("../controllers/auth");

router.post("/", auth.create);

module.exports = router;
