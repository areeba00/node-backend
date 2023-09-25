const express = require("express");

const router = express.Router();
const message = require("../../controllers/message");

router.get("/", message.readAll);
router.get("/:id", message.read);
router.post("/", message.create);
router.delete("/:id", message.delete);

module.exports = router;
