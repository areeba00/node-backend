const express = require("express");
const { validateMessage } = require("../../middleware/Validation");

const router = express.Router();
const message = require("../pg_controllers/messages");

router.get("/", message.getAllMessages);
router.get("/:id", message.getMessageById);
router.post("/", validateMessage, message.create);
router.delete("/:id", message.delete);

module.exports = router;
