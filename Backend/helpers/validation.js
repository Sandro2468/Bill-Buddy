function validateEmail(email) {
  var re = /\S+@\S+\.\S+/;
  return re.test(email);
}

function requireInput(email, password) {
  if (!email) throw { name: "Validation error", message: "Email is required" };
  if (!password)
    throw { name: "Validation error", message: "Password is required" };

  return true;
}
module.exports = { validateEmail, requireInput };
