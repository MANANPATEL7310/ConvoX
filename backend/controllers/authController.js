import { User } from "../models/User.js";
import { Meeting } from "../models/Meeting.js";
import { createSecretToken } from "../utils/SecretToken.js";
import bcrypt from "bcrypt";

export const Signup = async (req, res) => {
    try {
        const { name, username, password } = req.body;
        
        // Input validation
        if (!name || !username || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }
        
        if (username.length < 3) {
            return res.status(400).json({ message: "Username must be at least 3 characters long" });
        }
        
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }
        
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const user = await User.create({
            name,
            username,
            password: hashedPassword,
        });

        const token = createSecretToken(user._id);
        res.cookie("token", token, {
            withCredentials: true,
            httpOnly: true, // Security: prevent XSS attacks
            secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
            sameSite: 'strict', // Prevent CSRF attacks
            maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
        });

        res.status(201).json({ message: "User signed up successfully", success: true, user: { id: user._id, name: user.name, username: user.username } });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const Login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Input validation
        if (!username || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "Incorrect password or username" });
        }
        
        const auth = await bcrypt.compare(password, user.password);
        if (!auth) {
            return res.status(401).json({ message: "Incorrect password or username" });
        }
        
        const token = createSecretToken(user._id);
        res.cookie("token", token, {
            withCredentials: true,
            httpOnly: true, // Security: prevent XSS attacks
            secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
            sameSite: 'strict', // Prevent CSRF attacks
            maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
        });
        
        res.status(200).json({ message: "User logged in successfully", success: true, user: { id: user._id, name: user.name, username: user.username } });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const Logout = (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.status(200).json({ message: "Logged out successfully" });
};

export const addToHistory = async (req, res) => {
    try {
        const { meetingCode } = req.body;
        
        // Input validation
        if (!meetingCode || meetingCode.trim() === '') {
            return res.status(400).json({ message: "Meeting code is required" });
        }
        
        // Check if meeting already exists for this user to avoid duplicates
        const existingMeeting = await Meeting.findOne({ 
            user_id: req.user.username, 
            meetingCode: meetingCode.trim() 
        });
        
        if (existingMeeting) {
            // Update the date instead of creating duplicate
            existingMeeting.date = new Date();
            await existingMeeting.save();
            return res.status(200).json({ message: "Meeting history updated" });
        }
        
        const newMeeting = new Meeting({
            user_id: req.user.username,
            meetingCode: meetingCode.trim()
        });
        
        await newMeeting.save();
        res.status(201).json({ message: "Added to history" });
    } catch (e) {
        console.error("Error adding to history:", e);
        res.status(500).json({ message: "Something went wrong while adding to history" });
    }
}


export const getUserHistory = async (req, res) => {
    try {
        // Use authenticated user from middleware instead of query parameter
        const history = await Meeting.find({ user_id: req.user.username }).sort({ date: -1 });
        res.json(history)
    } catch (e) {
        console.error("Error fetching user history:", e);
        res.status(500).json({ message: "Something went wrong while fetching history" })
    }
}
