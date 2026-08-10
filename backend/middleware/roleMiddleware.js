const allowRoles = (...roles) => {
  return (req, res, next) => {
    // Check if the logged-in user's role is allowed
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access Denied. You are not authorized to access this resource.",
      });
    }

    next();
  };
};

export default allowRoles;