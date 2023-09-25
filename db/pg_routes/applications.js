const express = require("express");

const router = express.Router();
const { validateApplication } = require("../../middleware/Validation");
const application = require("../pg_controllers/applications");

// const application = require("../../controllers/application");
const auth = require("../../middleware/auth");

router.get("/", auth, application.getAllApplications);
router.get("/:id", application.getApplicationById);
router.post("/", validateApplication, application.create);
router.put("/:id", validateApplication, application.update);
router.patch("/:id", application.patch);
router.delete("/:id", application.delete);
module.exports = router;
