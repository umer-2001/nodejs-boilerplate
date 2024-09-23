import express, { Router } from "express";
import * as auth from "../controllers/auth.controller";
import { isAuthenticated } from "../middleware/auth.middleware";

const router = express.Router();
//get
router.route("/logout").get(auth.logout);
//post
router.route("/register").post(auth.register);
router.route("/login").post(auth.login);
router.route("/requestEmailToken").post(auth.requestEmailToken);
router.route("/verifyEmail").post(auth.verifyEmail);
router.route("/forgotPassword").post(auth.forgotPassword);

router.route("/resetPassword").put(auth.resetPassword);
router.route("/updatePassword").put(isAuthenticated, auth.updatePassword);

module.exports = router;
