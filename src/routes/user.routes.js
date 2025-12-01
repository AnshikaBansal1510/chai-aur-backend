import { Router } from "express";
import { 
  loginUser,
  registerUser, 
  logoutUser, 
  refreshAccessToken, 
  changeCurrentPassword, 
  getCurrentUser, 
  updateAccountDetails, 
  updateUserAvatar, 
  updateUserCoverImage, 
  getUserChannelProfile, 
  getWatchHistory 
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/register").post(
  upload.fields([                   // middleware upload used just before registerUser method is executed
    {                               // array not used bcoz woh ek hi field mein multiple files leta hai
      name: "avatar",               // single used to upload single file
      maxCount: 1
    },
    {
      name: "coverImage",
      maxCount: 1
    }
  ]),
  registerUser
)

router.route("/login").post(loginUser)

// secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)

export default router     // by exporting default - we can give other names while importing