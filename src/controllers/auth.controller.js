import User from "../models/User/user.model";
import sendMail from "../utils/sendMail";
import SuccessHandler from "../utils/SuccessHandler";
import ErrorHandler from "../utils/ErrorHandler";
import validator from "validator";
import { createUserValidation } from "../validations/user";
import { ValidationError } from "joi";
import dotenv from "dotenv";
dotenv.config({ path: "../config/config.env" });

const options = {
  httpOnly: true,
  secure: true,
};

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

//register
const register = async (req, res) => {
  // #swagger.tags = ['auth']
  try {
    const { name, email, password, role } = req.body;
    await createUserValidation.validateAsync({
      body: req.body,
    });
    const user = await User.findOne({ email });
    if (user) {
      return ErrorHandler("User already exists", 400, req, res);
    }
    const newUser = await User.create({
      name,
      email,
      password,
      role,
    });
    newUser.save();
    return SuccessHandler("User created successfully", 200, res);
  } catch (error) {
    if (error instanceof ValidationError) {
      return ErrorHandler(error.message, 400, req, res);
    }
    return ErrorHandler(error.message, 500, req, res);
  }
};

//request email verification token
const requestEmailToken = async (req, res) => {
  // #swagger.tags = ['auth']

  try {
    const { email } = req.body;
    if (!validator.isEmail(email)) {
      return ErrorHandler("Invalid email format", 400, req, res);
    }
    const user = await User.findOne({ email });
    if (!user) {
      return ErrorHandler("User does not exist", 400, req, res);
    }
    const emailVerificationToken = Math.floor(100000 + Math.random() * 900000);
    const emailVerificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationTokenExpires = emailVerificationTokenExpires;
    await user.save();
    const message = `Your email verification token is ${emailVerificationToken} and it expires in 10 minutes`;
    const subject = `Email verification token`;
    await sendMail(email, subject, message);
    return SuccessHandler(
      `Email verification token sent to ${email}`,
      200,
      res
    );
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

//verify email token
const verifyEmail = async (req, res) => {
  // #swagger.tags = ['auth']

  try {
    const { email, emailVerificationToken } = req.body;
    if (!validator.isEmail(email)) {
      return ErrorHandler("Invalid email format", 400, req, res);
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User does not exist",
      });
    }
    if (
      user.emailVerificationToken !== emailVerificationToken ||
      user.emailVerificationTokenExpires < Date.now()
    ) {
      return ErrorHandler("Invalid token", 400, req, res);
    }
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpires = null;
    jwtToken = user.getJWTToken();
    await user.save();
    return SuccessHandler("Email verified successfully", 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

//login
const login = async (req, res) => {
  // #swagger.tags = ['auth']

  try {
    const { email, password: inputPassword } = req.body;
    if (!validator.isEmail(email)) {
      return ErrorHandler("Invalid email format", 400, req, res);
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return ErrorHandler("User does not exist", 400, req, res);
    }
    const isMatch = await user.comparePassword(inputPassword);
    if (!isMatch) {
      return ErrorHandler("Invalid credentials", 400, req, res);
    }
    if (!user.emailVerified) {
      return ErrorHandler("Email not verified", 400, req, res);
    }
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    const { refreshToken, password, ...updatedUser } = user.toObject();

    res.cookie("refreshToken", newRefreshToken, options);
    res.cookie("accessToken", accessToken, options);

    return SuccessHandler(
      {
        message: "Logged in successfully",
        accessToken,
        refreshToken: newRefreshToken,
        updatedUser,
      },
      200,
      res
    );
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

//logout
const logout = async (req, res) => {
  // #swagger.tags = ['auth']

  try {
    // req.user = null;

    await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      {
        new: true,
      }
    );
    res.clearCookie("accessToken", options);
    res.clearCookie("refreshToken", options);
    return SuccessHandler("Logged out successfully", 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

//forgot password
const forgotPassword = async (req, res) => {
  // #swagger.tags = ['auth']

  try {
    const { email } = req.body;
    if (!validator.isEmail(email)) {
      return ErrorHandler("Invalid email format", 400, req, res);
    }
    const user = await User.findOne({ email });
    if (!user) {
      return ErrorHandler("User does not exist", 400, req, res);
    }
    const passwordResetToken = Math.floor(100000 + Math.random() * 900000);
    const passwordResetTokenExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.passwordResetToken = passwordResetToken;
    user.passwordResetTokenExpires = passwordResetTokenExpires;
    await user.save();
    const message = `Your password reset token is ${passwordResetToken} and it expires in 10 minutes`;
    const subject = `Password reset token`;
    await sendMail(email, subject, message);
    return SuccessHandler(`Password reset token sent to ${email}`, 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

//reset password
const resetPassword = async (req, res) => {
  // #swagger.tags = ['auth']

  try {
    const { email, passwordResetToken, password } = req.body;
    if (!validator.isEmail(email)) {
      return ErrorHandler("Invalid email format", 400, req, res);
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return ErrorHandler("User does not exist", 400, req, res);
    }
    if (
      user.passwordResetToken !== passwordResetToken ||
      user.passwordResetTokenExpires < Date.now()
    ) {
      return ErrorHandler("Invalid token", 400, req, res);
    }
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetTokenExpires = null;
    await user.save();
    return SuccessHandler("Password reset successfully", 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

//update password
const updatePassword = async (req, res) => {
  // #swagger.tags = ['auth']

  try {
    const { currentPassword, newPassword } = req.body;
    if (
      !newPassword.match(
        /(?=[A-Za-z0-9@#$%^&+!=]+$)^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$%^&+!=])(?=.{8,}).*$/
      )
    ) {
      return ErrorHandler(
        "Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number and 1 special character",
        400,
        req,
        res
      );
    }
    const user = await User.findById(req.user.id).select("+password");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return ErrorHandler("Invalid credentials", 400, req, res);
    }
    const samePasswords = await user.comparePassword(newPassword);
    if (samePasswords) {
      return ErrorHandler(
        "New password cannot be same as old password",
        400,
        req,
        res
      );
    }
    user.password = newPassword;
    await user.save();
    return SuccessHandler("Password updated successfully", 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

const socialAuth = async (req, res) => {
  // #swagger.tags = ['auth']
  try {
    const { email, name, role, provider } = req.body;

    const exUser = await User.findOne({ email });
    if (
      exUser &&
      (exUser.provider === "google" || exUser.provider === "apple")
    ) {
      const token = await exUser.getJWTToken();
      return SuccessHandler({ token, user: exUser }, 200, res);
    } else if (
      exUser &&
      exUser.provider !== "google" &&
      exUser.provider !== "apple"
    ) {
      return ErrorHandler(
        "User exists with different provider. Use the one you used before",
        400,
        req,
        res
      );
    } else {
      const user = await User.create({
        email,
        name,
        role,
        provider,
      });
      const token = await user.getJWTToken();
      return SuccessHandler({ token, user }, 200, res);
    }
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

const refreshAccessToken = async (req, res) => {
  // #swagger.tags = ['auth']

  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      return ErrorHandler("unauthorized request", 401, req, res);
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      return ErrorHandler("Invalid refresh token", 401, req, res);
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      return ErrorHandler("Refresh token is expired or used", 401, req, res);
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    res.cookie("accessToken", accessToken, options);
    res.cookie("refreshToken", accessToken, newRefreshToken);

    return SuccessHandler(
      {
        messsage: "Access token refreshed",
        refreshToken: newRefreshToken,
        accessToken: accessToken,
      },
      200,
      res
    );
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

export {
  register,
  requestEmailToken,
  verifyEmail,
  login,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
  socialAuth,
  refreshAccessToken,
};
