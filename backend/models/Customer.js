import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Customer = sequelize.define(
  "Customer",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "customers",
    timestamps: true,
  }
);

export default Customer;