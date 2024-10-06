import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const userRouter = Router()

userRouter.route("/register").post(registerUser)
// if user acces karta hai /users/regis ter then ye method call hoga 

// userRouter.route("/login").post(loginUser)

export default userRouter