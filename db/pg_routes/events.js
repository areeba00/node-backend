const express = require("express");
const { validateEvent } = require("../../middleware/Validation");

const router = express.Router();

const event = require("../pg_controllers/events");

router.get("/", event.getAllEvents);
router.get("/:id", event.getEventById);
router.post("/", validateEvent, event.create);
router.put("/:id", validateEvent, event.update);
router.patch("/:id", event.patch);
router.delete("/:id", event.delete);
module.exports = router;
