import { DataTypes, Sequelize } from "sequelize";
import sequelize from "../config/database.js";

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  shopId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  //force to admin create new password
  mustChangePassword: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
},
  role: {
    type: DataTypes.ENUM("super_admin", "admin", "employee", "customer"),
    allowNull: false,
    defaultValue: "customer",
  },
  isActive:{
    type:DataTypes.BOOLEAN,
    defaultValue: true,
  }
},
{
    tableName:"users",
    timestamps:true
}

);

export default User
