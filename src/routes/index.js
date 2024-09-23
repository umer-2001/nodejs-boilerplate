import express, { Router } from "express";
import auth from "./auth.routes";

const router = express.Router();

router.use("/auth", auth);

module.exports = router;
