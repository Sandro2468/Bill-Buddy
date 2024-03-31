if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
// const session = require("express-session");
// const cookieParser = require("cookie-parser");

// app.use(
//   session({
//     secret: "your-secret-key",
//     resave: false,
//     saveUninitialized: false,
//   })
// );

// app.use(cookieParser());

const cors = require("cors");
app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(require("./routes/index"));

app.use(require("./middlewares/errHandler"));

module.exports = app;
