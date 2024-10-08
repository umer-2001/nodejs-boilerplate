import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User/user.model";

dotenv.config({ path: ".././src/config/config.env" });

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization;
    if (!token) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded._id).select(
      "-password -refreshToken"
    );
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { isAuthenticated };
