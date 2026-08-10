import express from "express";
import {
  getMyProfile,
  updateMyProfile,
  changePassword,
  updateAvatar,
} from "../controllers/profile.controller.js";
import {
  sendEmailOtp,
  verifyEmailOtp,
  sendPhoneOtp,
  verifyPhoneOtp,
} from "../controllers/otp.controller.js";
import protect from "../middleware/authMiddleware.js";
import uploadAvatar from "../middleware/uploadAvatar.js";


const router = express.Router();

router.get("/", protect, getMyProfile);
router.put("/", protect, updateMyProfile);
router.patch("/password", protect, changePassword);

// PATCH /api/profile/avatar — multipart/form-data, field name: "avatar"
// multer errors (wrong file type, too large) are mapped to clean JSON here
// instead of Express's default HTML error page.
router.patch(
  "/avatar",
  protect,
  (req, res, next) => {
    uploadAvatar.single("avatar")(req, res, (err) => {
      if (err) {
        const message =
          err.code === "LIMIT_FILE_SIZE"
            ? "Image must be 5 MB or smaller."
            : err.message || "Upload failed. Please try again.";
        return res.status(400).json({ success: false, message });
      }
      next();
    });
  },
  updateAvatar,
);

// ---- Email & phone verification (OTP) ----
router.post("/send-email-otp", protect, sendEmailOtp);
router.post("/verify-email-otp", protect, verifyEmailOtp);
router.post("/send-phone-otp", protect, sendPhoneOtp);
router.post("/verify-phone-otp", protect, verifyPhoneOtp);

export default router;
