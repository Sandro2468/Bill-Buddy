const express = require("express");
const ReceiptController = require("../controllers/receiptController");
const router = express.Router();

const multer = require("multer");
const { authentication } = require("../middlewares/authentication");

const upload = multer({
  storage: multer.memoryStorage(),
});

router.post(
  "/ocr-receipt",
  authentication,
  upload.single("photo"),
  ReceiptController.ocrReceipt
);
router.post("/nodemailer", ReceiptController.nodemailer);
router.put("/update-item/:id", ReceiptController.updateItemById);
router.get("/get-bill/:id", ReceiptController.getBillById);
router.post("/get-price", ReceiptController.getTotalPrice);

router.post(
  "/ocr-receipt",
  upload.single("photo"),
  ReceiptController.ocrReceipt
);
router.put("/update-item/:id", ReceiptController.updateItemById); //id yang diterima disini itu id bill nya
router.get("/get-bill/:id", ReceiptController.getBillById);
router.put("/update-members/:id", ReceiptController.updateMembersById);
router.get("/bills", authentication, ReceiptController.getBillsUser);
router.post("/nodemailer/resend", ReceiptController.resendNodemailer);

module.exports = router;