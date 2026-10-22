import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Yetkisiz erişim: Token bulunamadı veya geçersiz format." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id: ... } will be attached to the request
    next();
  } catch (error) {
    console.error("TOKEN VERIFICATION ERROR:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        code: "TOKEN_EXPIRED",
        message: "Yetkisiz erişim: Token süresi dolmuş."
      });
    }
    return res.status(401).json({ message: "Yetkisiz erişim: Token geçersiz." });
  }
};

export default authMiddleware;
