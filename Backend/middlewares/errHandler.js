const errHandler = (err, req, res, next) => {
  switch (err.name) {
    case "Validation error":
      res.status(400).json({ message: err.message });
      break;
    case "Invalid token":
    case "JsonWebTokenError":
      res.status(401).json({ message: "Invalid token" });
      break;
    default:
      console.log(err, "<<<<<<");
      res.status(500).json({ message: "Internal server error" });
      break;
  }
};

module.exports = errHandler;
