const express = require("express");

const router = express.Router();
const tags = require("../pg_controllers/tags");

router.get("/", tags.getAllTags);

module.exports = router;
