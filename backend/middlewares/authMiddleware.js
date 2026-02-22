import { User } from "../models/User.js";
import jwt from "jsonwebtoken";

export const userVerification = (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.json({ status: false });
  
  jwt.verify(token, process.env.TOKEN_KEY, async (err, data) => {
    if (err) {
      console.log("Token verification error:", err);
      return res.json({ status: false });
    }
    
    try {
      const user = await User.findById(data.id);
      if (user) {
        return res.json({ status: true, user: { id: user._id, name: user.name, username: user.username } });
      } else {
        return res.json({ status: false });
      }
    } catch (error) {
      console.error("User verification error:", error);
      return res.json({ status: false });
    }
  });
};

export const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    jwt.verify(token, process.env.TOKEN_KEY, async (err, data) => {
        if (err) {
            console.log("Token verification error:", err);
            return res.status(401).json({ message: "Unauthorized" });
        }
        
        try {
            const user = await User.findById(data.id);
            if (user) {
                req.user = user;
                next();
            } else {
                return res.status(401).json({ message: "Unauthorized" });
            }
        } catch (error) {
            console.error("Token verification error:", error);
            return res.status(401).json({ message: "Unauthorized" });
        }
    });
}
