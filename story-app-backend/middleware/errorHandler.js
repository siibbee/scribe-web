const errorHandler = (err, req, res, next) => {
  console.error("Global Error Handler Yakaladı:", err);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  res.status(statusCode).json({
    message: err.message || "Sunucu tarafında beklenmeyen bir hata oluştu.",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export default errorHandler;
