const express = require("express");
const auth = require("../middleware/auth");

const router = express.Router();
const user = require("../controllers/user");

router.get("/", auth, user.readAll);
// router.get("/:id", message.read);
router.post("/", user.create);
// router.delete("/:id", message.delete);

module.exports = router;
