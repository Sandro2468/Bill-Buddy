const { ObjectId } = require("bson");
const database = require("../config/mongo");
const { verifyToken } = require("../helpers/jwt");

// table Users
const collection = database.collection("Users");

const authentication = async (req, res, next) => {
  try {
    // bagian ini akan skip pengecekan authentication untuk endpoint get-bill
    if (req._parsedUrl.pathname.includes("get-bill")) {
      next();
    } else {
      const { authorization } = req.headers;

      if (!authorization) {
        throw { name: "Invalid token" };
      }
      // console.log(authorization, "<<<<<<");
      const [type, token] = authorization.split(" ");
      if (type != "Bearer") {
        throw { name: "Invalid token" };
      }

      const decryptToken = verifyToken(token);

      if (!decryptToken) {
        throw { name: "Invalid token" };
      }

      const user = await collection.findOne({
        _id: new ObjectId(String(decryptToken._id)),
      });

      if (!user) {
        throw { name: "Invalid token" };
      }

      req.user = user;

      next();
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { authentication };
