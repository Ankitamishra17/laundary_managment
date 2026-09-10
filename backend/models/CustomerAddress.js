import sequelize from "../config/database.js";
import { DataTypes } from "sequelize";

const CustomerAddress = sequelize.define("CustomerAddress", {
  label: {
    type: DataTypes.ENUM("Home", "Office", "other"),
    defaultValue: "Home",
  },

  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone:{
    type:DataTypes.STRING,
    allowNull:false,
  },
  addressLine1:{
    type:DataTypes.STRING,
    allowNull:false,
  },

addressLine2: DataTypes.STRING,

landmark:DataTypes.STRING,

city:{
    type:DataTypes.STRING,
    allowNull:false,
},

state:{
    type:DataTypes.STRING,
    allowNull:false,
},

postalCode:{
    type:DataTypes.STRING,
    allowNull:false,

},

country:{
    type:DataTypes.STRING,
    defaultValue:"India,"
},

isDefault:{
    type:DataTypes.BOOLEAN,
    defaultValue:false,
}

}
);

export default CustomerAddress;