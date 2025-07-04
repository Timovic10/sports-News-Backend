import AppError from "../utils/appError.js";

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // Programming or other unknown errors: don't leak error details
  } else {
    console.error("💥 UNEXPECTED ERROR", err);
    res.status(500).json({
      staus: "error",
      message: "Something went very wrong!",
    });
  }
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400, "fail");
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.keyValue ? JSON.stringify(err.keyValue) : "Duplicate field";
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400, "fail");
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400, "fail");
};

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired please login again.", 401);

export const globalErrorHandler = (err, req, res, next) => {
  console.error("🔍 Error stack trace:\n", err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  const env = process.env.NODE_ENV || "development";

  if (env === "development") {
    sendErrorDev(err, res);
  } else {
    let error = err; // ✅ FIXED: Use original error object

    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError(error);
    if (error.name === "TokenExpiredError")
      error = handleJWTExpiredError(error);

    sendErrorProd(error, res);
  }
};
