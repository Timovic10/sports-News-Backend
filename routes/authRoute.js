import {
  signup,
  login,
  getAllAdmin,
  protect,
  getMe,
  deleteAdmin,
  logout,
} from "../controller/authController.js";
import express from "express";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", protect, getMe);
router.delete("/:id", protect, deleteAdmin);
router.get("/logout", logout);
router.get("/", protect, getAllAdmin);

export default router;
