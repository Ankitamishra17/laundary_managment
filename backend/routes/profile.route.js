const  express = require("express");
const router = express.Router();

const {
    getMyProfile,
    updateMyProfile,
    changePassword,
    updateAvatar,
} = require("../controllers/profile.controller");

const auth = require("../middleware/auth");
const upload = require("../middleware/upload");


router.get("/", auth, getMyProfile);
router.put("/",auth,updateMyProfile);
router.patch("/password",auth.changePassword);
router.patch("/avatar",auth,upload.single("avatar"),updateAvatar);

module.exports = router;