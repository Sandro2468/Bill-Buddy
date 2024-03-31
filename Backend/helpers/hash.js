const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);

const hashPwd = (password) => {
  return bcrypt.hashSync(password, salt);
};

const hashVerify = (password, hash) => {
  return bcrypt.compareSync(password, hash); // true
};

module.exports = { hashPwd, hashVerify };
