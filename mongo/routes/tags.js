const express = require("express");

const router = express.Router();
const tags = require("../controllers/tags");

router.get("/", tags.readAll);

module.exports = router;
