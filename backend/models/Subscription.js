import { DataTypes, Sequelize } from "sequelize";
import sequelize from "../config/database.js";

const Subscription = sequelize.define(
  "Subscription",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    shopId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    plan: {
      type: DataTypes.ENUM("Monthly", "Yearly"),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Expired", "Active", "Cancelled"),
      defaultValue: "Active",
    },
    paymentStatus: {
      type: DataTypes.ENUM(
        "Pending",
        "Paid",
        "Failed",
        "Refunded",
      ),
      defaultValue: "Paid",
    },
    paymentMethod: {
        type:DataTypes.ENUM(
            "Cash",
            "UPI",
            "Card",
            "Bank_Transfer"
        ),
       allowNull:true,
    },
    transactionId: {
        type:DataTypes.STRING,
        allowNull:true,
        unique:true
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },

    autoRenew: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
},
  {
    tableName: "subscriptions",
    timestamps: true,
  },
);
export default Subscription;
