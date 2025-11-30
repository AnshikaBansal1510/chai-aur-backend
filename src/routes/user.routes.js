import { Router } from "express";
import { loginUser, registerUser, logoutUser } from "../controllers/user.controller.js";
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

export default router     // by exporting default - we can give other names while importing