const express = require("express");
const router = express.Router();

const { sendVerification, verifyEmail } = require("../controllers/verification.controller");

router.post("/send-verification", sendVerification);
router.get("/verify-email", verifyEmail);

module.exports = router;