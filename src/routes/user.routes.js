import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"

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

export default router     // by exporting default - we can give other names while importing