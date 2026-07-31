import Shop from "./Shop.js";
import User from "./User.js";

Shop.hasMany(User, {
  foreignKey: "shopId",
  as: "users",
});

User.belongsTo(Shop, {
  foreignKey: "shopId",
  as: "shop",
});

export { Shop, User };
