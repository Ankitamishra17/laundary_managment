import Shop from "./Shop.js";
import User from "./User.js";
import Subscription from "./Subscription.js";

Shop.hasMany(User, {
  foreignKey: "shopId",
  as: "users",
});

User.belongsTo(Shop, {
  foreignKey: "shopId",
  as: "shop",
});

Shop.hasMany(Subscription, {
  foreignKey: "shopId",
  as: "subscriptions",
});

Subscription.belongsTo(Shop, {
  foreignKey: "shopId",
  as: "shop",
});

export { Shop, User,Subscription };
