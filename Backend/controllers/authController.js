const User = require("../models/User");
const { generateToken } = require("../middleware/authMiddleware");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const PasswordResetToken = require("../models/PasswordResetToken");
const User = require("../models/User"); // adjust path if different

// @desc    Register new student
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { fullName, username, email, password, studentId, department } =
      req.body;

    // Check for required fields
    if (!fullName || !username || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide all required fields" });
    }

    // Check if user exists
    const userExists = await User.findOne({
      $or: [{ email }, { username: username.toLowerCase() }],
    });

    if (userExists) {
      const field =
        userExists.email === email ? "Email" : "Username";
      return res
        .status(400)
        .json({ success: false, message: `${field} is already registered` });
    }

    // Create user
    const user = await User.create({
      fullName,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      studentId: studentId || undefined,
      department: department || "",
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        studentId: user.studentId,
        department: user.department,
        avatar: user.avatar,
        header: user.header,
        isOnline: user.isOnline,
        verified: user.verified,
        verificationApplication: user.verificationApplication,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Server error during registration" });
  }
};

// @desc    Login student
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password" });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!user || !(await user.matchPassword(password))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    // Update online status
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        studentId: user.studentId,
        department: user.department,
        avatar: user.avatar,
        header: user.header,
        bio: user.bio,
        skills: user.skills,
        communities: user.communities,
        isOnline: true,
        verified: user.verified,
        verificationApplication: user.verificationApplication,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error during login" });
  }
};

// @desc    Logout student
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
      lastSeen: new Date(),
    });

    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error during logout" });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "communities",
      "name slug avatar category"
    );
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { register, login, logout, getMe };

// ─── Email transporter (Gmail) ────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,   // your Gmail address
    pass: process.env.EMAIL_PASS,   // your Gmail App Password (not your login password)
  },
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    // Always respond with success to prevent email enumeration attacks
    if (!user) {
      return res.json({ message: "If that email exists, a reset link has been sent." });
    }

    // Delete any existing token for this user
    await PasswordResetToken.deleteOne({ userId: user._id });

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    // Save hashed token to DB, expires in 1 hour
    await PasswordResetToken.create({
      userId: user._id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    // Build reset URL pointing to your frontend
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

    // Send email
    await transporter.sendMail({
      from: `"Campusfriend" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Reset your Campusfriend password",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
          <h2 style="color: #1e3a5f;">Reset your password</h2>
          <p>Hi ${user.fullName || "there"},</p>
          <p>We received a request to reset your Campusfriend password. Click the button below — this link expires in <strong>1 hour</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#1e3a5f;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
            Reset Password
          </a>
          <p style="color:#888;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("forgotPassword error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ─── POST /api/auth/reset-password/:token ────────────────────────────────────
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // Hash the incoming token to compare with DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const record = await PasswordResetToken.findOne({
      token: hashedToken,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return res.status(400).json({ message: "Reset link is invalid or has expired." });
    }

    // Update user's password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.findByIdAndUpdate(record.userId, { password: hashedPassword });

    // Delete the used token
    await PasswordResetToken.deleteOne({ _id: record._id });

    res.json({ message: "Password reset successful. You can now sign in." });
  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

module.exports = { forgotPassword, resetPassword };
