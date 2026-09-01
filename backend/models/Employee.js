import { DataTypes } from "sequelize";
import bcrypt from "bcrypt";
import sequelize from "../config/database.js";

const Employee = sequelize.define(
  "Employee",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    designation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    monthlySalary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0,
    },
    avatar: {
      type: DataTypes.STRING, // stores uploaded photo path, e.g. "/uploads/avatar-123.jpg"
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM("employee"),
      defaultValue: "employee",
    },
    shop_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_phone_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // OTP codes are stored hashed (bcrypt) so a leaked DB dump stays safe
    email_otp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email_otp_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    phone_otp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone_otp_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "employees",
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ["shop_id", "email"],
        name: "unique_employee_email_per_shop",
      },
    ],

    hooks: {
      beforeCreate: async (employee) => {
        if (employee.password) {
          employee.password = await bcrypt.hash(employee.password, 10);
        }
      },

      beforeUpdate: async (employee) => {
        if (employee.changed("password")) {
          employee.password = await bcrypt.hash(employee.password, 10);
        }
      },
    },
  },
);

Employee.prototype.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

export default Employee;
