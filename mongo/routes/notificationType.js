const express = require("express");

const router = express.Router();
const notificationType = require("../controllers/notificationType");

router.get("/", notificationType.readAll);
router.get("/:id", notificationType.read);
router.post("/", notificationType.create);
router.put("/:id", notificationType.update);
router.delete("/:id", notificationType.delete);

module.exports = router;
