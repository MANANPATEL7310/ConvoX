import { User } from "../models/User.js";
import { Meeting } from "../models/Meeting.js";
import { ScheduledMeeting } from "../models/ScheduledMeeting.js";
import { Feedback } from "../models/Feedback.js";
import { createSecretToken } from "../utils/SecretToken.js";
import bcrypt from "bcrypt";

export const Signup = async (req, res) => {
    try {
        const { name, username, email, password } = req.body;
        
        // Input validation
        if (!name || !username || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                return res.status(400).json({ message: "Invalid email address" });
            }
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

        if (email) {
            const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
            if (existingEmail) {
                return res.status(409).json({ message: "Email already in use" });
            }
        }
        
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const userPayload = {
            name,
            username,
            password: hashedPassword,
        };
        if (email) {
            userPayload.email = email.trim().toLowerCase();
        }

        const user = await User.create(userPayload);

        const token = createSecretToken(user._id);
        res.cookie("token", token, {
            withCredentials: true,
            httpOnly: true, // Security: prevent XSS attacks
            secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
            sameSite: 'strict', // Prevent CSRF attacks
            maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
        });

        res.status(201).json({ message: "User signed up successfully", success: true, user: { id: user._id, name: user.name, username: user.username, email: user.email } });
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
        
        res.status(200).json({ message: "User logged in successfully", success: true, user: { id: user._id, name: user.name, username: user.username, email: user.email } });
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

export const updatePresence = async (req, res) => {
    try {
        req.user.lastActiveAt = new Date();
        await req.user.save();
        res.json({ success: true });
    } catch (e) {
        console.error("Presence update error:", e);
        res.status(500).json({ message: "Failed to update presence" });
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

export const getProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const userUsername = req.user.username;

        // Calculate lifetime statistics across 3 different collections
        const attendedCount = await Meeting.countDocuments({ user_id: userUsername });
        const hostedCount = await ScheduledMeeting.countDocuments({ hostUserId: userId });
        const feedbackCount = await Feedback.countDocuments({ userId: userId });

        res.status(200).json({
            success: true,
            user: {
                id: req.user._id,
                name: req.user.name,
                username: userUsername,
                email: req.user.email,
                avatar: req.user.avatar,
                createdAt: req.user.createdAt,
                hasPassword: !!req.user.password
            },
            stats: {
                attended: attendedCount,
                hosted: hostedCount,
                feedbackGiven: feedbackCount
            }
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name, username, avatar } = req.body;

        if (!name || !username) {
            return res.status(400).json({ success: false, message: "Name and username are required." });
        }

        // Only check unique username if they actually changed it
        if (username !== req.user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(409).json({ success: false, message: "Username is already taken." });
            }
        }

        req.user.name = name;
        req.user.username = username;
        if (avatar !== undefined) {
            req.user.avatar = avatar;
        }

        await req.user.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            user: {
                id: req.user._id,
                name: req.user.name,
                username: req.user.username,
                email: req.user.email,
                avatar: req.user.avatar,
                createdAt: req.user.createdAt,
                hasPassword: !!req.user.password
            }
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // Prevent Google OAuth users from setting a password this way
        if (!req.user.password) {
            return res.status(400).json({ success: false, message: "Cannot change password for Google-linked accounts." });
        }

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Both current and new passwords are required." });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: "New password must be at least 6 characters long." });
        }

        const auth = await bcrypt.compare(currentPassword, req.user.password);
        if (!auth) {
            return res.status(401).json({ success: false, message: "Incorrect current password." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        req.user.password = hashedPassword;
        await req.user.save();

        res.status(200).json({ success: true, message: "Password updated successfully." });
    } catch (error) {
        console.error("Error updating password:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
