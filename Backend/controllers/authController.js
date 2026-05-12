const User = require("../models/User");
const { generateToken } = require("../middleware/authMiddleware");

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