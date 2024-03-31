const database = require("../config/mongo");
const { hashPwd, hashVerify } = require("../helpers/hash");
const { signToken } = require("../helpers/jwt");
const { validateEmail, requireInput } = require("../helpers/validation");

// table Users
const collection = database.collection("Users");

class UserController {
  static async register(req, res, next) {
    let { email, password } = req.body;

    try {
      requireInput(email, password);
      const isValidEmail = validateEmail(email);
      if (!isValidEmail)
        throw { name: "Validation error", message: "Invalid email format" };

      const rawData = {
        email,
        password: hashPwd(password),
        saldo: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // simpan data user
      const result = await collection.insertOne(rawData);

      res.status(201).json({
        message: "Success create user",
        data: { _id: result.insertedId, email },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    let { email, password } = req.body;
    console.log(email, password);

    try {
      requireInput(email, password);

      // cari user
      const user = await collection.findOne({ email });
      if (!user)
        throw { name: "Validation error", message: "Invalid email/password" };

      const isValidPwd = hashVerify(password, user.password);
      if (!isValidPwd)
        throw { name: "Validation error", message: "Invalid email/password" };

      const access_token = signToken({ _id: user._id, email: user.email });

      // implement session and cookie
      // req.session.emailUser = user.email;
      // req.session.acess_token = access_token;
      // console.log(req.session, "<<<<<<")
      // res.cookie("sessionId", req.sessionID);

      res.status(200).json({
        message: "Login success",
        data: {
          _id: user._id,
          email: user.email,
          access_token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
        res.clearCookie("sessionId");
        res.redirect("/login");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;