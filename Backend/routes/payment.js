const express = require("express");
const PaymentController = require("../controllers/paymentController");
const router = express.Router();

router.post(
  "/payment/midtrans/initiate",
  PaymentController.initiateMidtransTrx
);
router.patch("/users/me/paid", PaymentController.paid);
router.post("/payment/manual", PaymentController.maualPayment);

module.exports = router;
