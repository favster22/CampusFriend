const mongoose = require("mongoose");

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Community name is required"],
      trim: true,
      maxlength: [100, "Community name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    category: {
      type: String,
      enum: ["academic", "department", "hobby", "study-group", "general"],
      default: "general",
    },
    avatar: {
      type: String,
      default: "",
    },
    banner: {
      type: String,
      default: "",
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: {
          type: String,
          enum: ["admin", "moderator", "member"],
          default: "member",
        },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    isPrivate: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    pinnedMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for member count
communitySchema.virtual("memberCount").get(function () {
  return this.members.length;
});

// Auto-generate slug from name
communitySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }
  next();
});

module.exports = mongoose.model("Community", communitySchema);