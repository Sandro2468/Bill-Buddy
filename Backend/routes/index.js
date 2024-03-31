const express = require("express");
const router = express.Router();
const { authentication } = require("../middlewares/authentication");

router.use(require("./user"));
router.use(require("./payment"));
router.use(require("./receipt"));
router.use(authentication);
router.get("/", (req, res) => {
  res.status(200).json({ message: "Hello world" });
});

module.exports = router;