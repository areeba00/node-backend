const express = require("express");

const router = express.Router();
const application = require("../../controllers/application");

router.get("/", application.readAll);
router.get("/:id", application.read);
router.post("/", application.create);
router.put("/:id", application.update);
router.patch("/:id", application.patch);
router.delete("/:id", application.delete);

module.exports = router;
