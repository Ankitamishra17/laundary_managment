const bcrypt = require("bcryptjs");

module.exports = (sequelize, DataTypes) => {
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
        unique: true,
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
    },
    {
      tableName: "employees",
      timestamps: true,
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

  Employee.associate = (models) => {
    Employee.belongsTo(models.Shop, { foreignKey: "shop_id" });
    Employee.hasMany(models.Order, { foreignKey: "employee_id" });
    Employee.hasMany(models.Salary, { foreignKey: "employee_id" });
  };

  return Employee;
};
