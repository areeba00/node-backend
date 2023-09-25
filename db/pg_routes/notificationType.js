const express = require("express");
const { validateNotificationType } = require("../../middleware/Validation");

const router = express.Router();

const notificationType = require("../pg_controllers/notificationType");

router.get("/", notificationType.getAllNotifications);
router.get("/:id", notificationType.getNotificationById);
router.post("/", validateNotificationType, notificationType.create);
router.put("/:id", validateNotificationType, notificationType.update);
router.patch("/:id", notificationType.patch);
router.delete("/:id", notificationType.delete);
module.exports = router;
