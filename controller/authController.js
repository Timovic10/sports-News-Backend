import jwt from "jsonwebtoken";
import Admin from "../models/admin.js";
import { catchAsync } from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { promisify } from "util";

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (admin, statusCode, res) => {
  const token = signToken(admin._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only secure on prod
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // 🛠️ fix here
  };

  res.cookie("jwt", token, cookieOptions);

  admin.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: { admin },
  });
};

export const signup = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return next(new AppError("Username and password are required", 400));
  }

  const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`;

  const newAdmin = await Admin.create({
    username,
    password,
    avatar,
  });

  // Optionally: Don't send token if it's just account creation
  res.status(201).json({
    status: "success",
    message: "Admin created successfully",
    data: {
      id: newAdmin._id,
      userName: newAdmin.username,
      role: newAdmin.avatar,
    },
  });
});

export const login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  // 1. Check if username and password exist
  if (!username || !password) {
    return next(new AppError("Please provide username and password!", 400));
  }

  // 2. Find admin and select password
  const admin = await Admin.findOne({ username }).select("+password");

  if (!admin || !(await admin.correctPassword(password, admin.password))) {
    return next(new AppError("Incorrect username or password", 401));
  }

  // 3. If ok, sign token
  createSendToken(admin, 200, res);

  // 4. Hide password before sending back
  admin.password = undefined;
});

export const protect = catchAsync(async (req, res, next) => {
  let token = req.cookies.jwt;

  if (!token && req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const freshAdmin = await Admin.findById(decoded.id);
  if (!freshAdmin) {
    return next(new AppError("Admin no longer exists.", 401));
  }

  req.admin = freshAdmin;
  next();
});

export const getAllAdmin = catchAsync(async (req, res, next) => {
  const users = await Admin.find(); // get all admin users
  const total = await Admin.countDocuments(); // total count of admin users

  res.status(200).json({
    status: "success",
    results: users.length,
    totalItems: total,
    data: { users },
  });
});

export const getMe = catchAsync(async (req, res, next) => {
  const admin = await Admin.findById(req.admin.id);
  if (!admin) {
    return next(new AppError("Admin not found", 401));
  }
  res.json({ admin });
});

export const deleteAdmin = catchAsync(async (req, res, next) => {
  const admin = await Admin.findByIdAndDelete(req.params.id);

  if (!admin) {
    return next(new AppError("No admin found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const logout = (req, res) => {
  res.cookie("jwt", "", {
    expires: new Date(Date.now() + 10 * 1000), // expires in 10s
    httpOnly: true,
    sameSite: "None",
    secure: process.env.NODE_ENV === "production",
  });

  res.status(200).json({ status: "success", message: "Logged out" });
};
