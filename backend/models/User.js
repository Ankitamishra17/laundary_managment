import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Tenant / Shop ID
    // NULL is allowed only for super_admin
    shopId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // Email
    // IMPORTANT:
    // Do NOT use unique: true here.
    // Email uniqueness is handled per shop
    // through the composite index below.
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
      set(value) {
        this.setDataValue("email", value.trim().toLowerCase());
      },
    },

    // Phone
    // Do NOT use unique: true here.
    // Same phone can exist in different shops.
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // Shop admin must change temporary password
    mustChangePassword: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    role: {
      type: DataTypes.ENUM("super_admin", "admin", "employee", "customer"),
      allowNull: false,
      defaultValue: "customer",
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    // Profile image URL
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // Soft-delete gate — "deleted" users are blocked from login and API
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    // Password reset OTP (stored in plain — verified server-side only)
    resetOtp: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // OTP expiry timestamp
    resetOtpExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },

  {
    tableName: "users",
    timestamps: true,

    indexes: [
      // ==========================================
      // EMAIL UNIQUE PER SHOP
      // ==========================================
      {
        unique: true,
        fields: ["shopId", "email"],
        name: "unique_shop_user_email",
      },

      // ==========================================
      // PHONE UNIQUE PER SHOP
      // ==========================================
      {
        unique: true,
        fields: ["shopId", "phone"],
        name: "unique_shop_user_phone",
      },
    ],
  },
);

export default User;
