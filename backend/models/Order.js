module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    "Order",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      shop_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      employee_id: {
        type: DataTypes.INTEGER, // kis employee ko assign kiya order
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "picked_up",
          "processing",
          "ready_for_delivery",
          "out_for_delivery",
          "delivered",
          "cancelled"
        ),
        defaultValue: "pending",
      },
      pickup_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      pickup_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      delivery_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      delivery_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      total_amount: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0,
      },
      payment_status: {
        type: DataTypes.ENUM("paid", "unpaid", "partial"),
        defaultValue: "unpaid",
      },
    },
    {
      tableName: "orders",
      timestamps: true,
    }
  );

  Order.associate = (models) => {
    Order.belongsTo(models.Customer, { foreignKey: "customer_id" });
    Order.belongsTo(models.Shop, { foreignKey: "shop_id" });
    Order.belongsTo(models.Employee, { foreignKey: "employee_id" });
    Order.hasMany(models.Service, { foreignKey: "order_id" }); // agar order me multiple services hai
  };

  return Order;
};