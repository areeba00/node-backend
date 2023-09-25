const express = require("express");

const router = express.Router();
const event = require("../../controllers/events");

router.get("/", event.getAllEvents);
router.get("/:id", event.getEventById);
router.post("/", event.create);
router.put("/:id", event.update);
router.delete("/:id", event.delete);

module.exports = router;
