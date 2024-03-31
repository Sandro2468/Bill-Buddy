const fs = require("fs");
const request = require("request");
const database = require("../config/mongo");
const cloudinary = require("../utils/cloudinary");
const nodemailer = require("nodemailer");
const { ObjectId } = require("mongodb");
const PaymentController = require("./paymentController");

const receiptOcrEndpoint = "https://ocr.asprise.com/api/v1/receipt";
const collection = database.collection("Receipts");

class ReceiptController {
  static async ocrReceipt(req, res, next) {
    let result;
    const { titleBill } = req.body;
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "Invalid file upload" });
      }

      const base64Image = req.file.buffer.toString("base64");
      const base64File = `data:${req.file.mimetype};base64,${base64Image}`;

      const imageResult = await cloudinary.uploader.upload(base64File, {
        public_id: req.file.originalname.split(".", [0]),
      });

      const options = {
        url: receiptOcrEndpoint,
        formData: {
          recognizer: "auto",
          ref_no: "ocr_nodejs_123",
          file: {
            value: req.file.buffer,
            options: {
              filename: req.file.originalname,
              contentType: req.file.mimetype,
            },
          },
        },
      };

      request.post(options, async (error, response, body) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ error: "Internal Server Error" });
        }
        // console.log(body, "<<<<<<");
        let merchant_name;
        if (body) {
          body = body.replace(
            /"amount"\s*:\s*(\d+)\.(\d+)/g,
            (match, p1, p2) => {
              return `"amount": ${p1}${p2}`;
            }
          );
          body = body.replace(
            /"unitPrice"\s*:\s*(\d+)\.(\d+)/g,
            (match, p1, p2) => {
              return `"unitPrice": ${p1}${p2}`;
            }
          );
          let dataBody = JSON.parse(body);

          // console.log(dataBody.receipts[0].items, "databody <<<")
          result = [];
          const items = dataBody.receipts[0].items;

          merchant_name = dataBody.receipts[0].merchant_name;
          if (merchant_name.toLowerCase().includes("indomaret")) {
            for (let i = 0; i < items.length; i++) {
              const dataItem = items[i];
              const { amount, description, qty, unitPrice } = dataItem;
              if (
                !description.toLowerCase().includes("harga jual") ||
                !description.toLowerCase().includes("total") ||
                !description.toLowerCase().includes("tunai")
              ) {
                const parts = description.split(" ");
                const quantity = parts[parts.length - 2];
                const unitPriceIndomaret = parts[parts.length - 1];
                const productName = parts.slice(0, -2).join(" ");
                let data2 = {
                  _id: new ObjectId(),
                  description: productName,
                  qty: quantity,
                  unitPrice: unitPriceIndomaret,
                  amount: amount,
                };
                result.push(data2);
              }
              // }else{
              //   let data2 = {
              //     _id: new ObjectId(),
              //     description: unitPrice,
              //     qty: qty,
              //     // unitPrice: unitPrice,
              //     amount: amount,
              //   };
              //   result.push(data2);
              // }
            }
          } else {
            for (let i = 0; i < items.length; i++) {
              const dataItem = items[i];
              const { amount, description, qty, unitPrice } = dataItem;
              let data2 = {
                _id: new ObjectId(),
                description: description,
                qty: qty,
                unitPrice: unitPrice,
                amount: amount,
              };
              result.push(data2);
            }
          }
        }
        const rawData = {
          merchantName: merchant_name,
          items: result,
          image: imageResult.secure_url,

          UserId: req.user._id,
          title: titleBill, // disini nilainya memang null akan di update ketika next proses ke colaborate
          nextEdit: false, // edit akan bernilai true ketika masuk ke next proses ke colaborate
          members: [],
          taxs: [], // variabel yang digunakan untuk perhitugnan pajak
          totalAmountBillWTax: 0, // total hasil bill yang bakal dijadikan acuan
          grandTotal: 0, // total semua pembayaran members yang sudah fix
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const mongo = await collection.insertOne(rawData);

        res.status(201).json({
          message: "Success",
          data: { _id: mongo.insertedId },
          rawData,
        });
        // res.json(result)
      });
    } catch (error) {
      // res.status(500).json({ error: "Internal Server Error" });
      next(error);
    }
  }
  static async updateItemById(req, res) {
    try {
      const { id: billId } = req.params;
      // const { description, qty, unitPrice, amount } = req.body;
      const { billItems, title, taxs } = req.body;
      // console.log("ID:", id);
      // console.log("Request Body:", req.body);

      // if (!ObjectId.isValid(id)) {
      //   return res.status(400).json({ error: "Invalid ID" });
      // }

      // if (!description || !qty || !unitPrice || !amount) {
      //   return res.status(400).json({ error: "Missing data fields" });
      // }

      // const updatedItem = {
      //   description: description,
      //   qty: qty,
      //   unitPrice: unitPrice,
      //   amount: amount,
      // };

      // olah data billItems buat semua data memiliki unit price
      let tmpTotalAmountBillWoTax = 0;
      let tmpBillItems = billItems.map((el) => {
        tmpTotalAmountBillWoTax += el.amount;
        if (el.qty > 1) {
          el.unitPrice = el.amount / el.qty;
          return el;
        } else {
          el.unitPrice = el.amount;
          return el;
        }
      });

      // hitung ulang totalAmountBill dengan tax nya untuk proses maching ketika colaborate
      // hitungan lama
      // let tmpTotalAmountBillWTax =
      //   (taxs.reduce((total, num) => {
      //     return total + Number(num.taxAmount);
      //   }, 0) /
      //     100) *
      //     tmpTotalAmountBillWoTax +
      //   tmpTotalAmountBillWoTax;

      // hitungan baru
      let arrCalTax = [];

      const total = billItems.reduce((total, num) => {
        return total + num.amount;
      }, 0);
      arrCalTax.push(Number(total));
      taxs.map((tax) => {
        if (arrCalTax.length == 1) {
          const tmp = arrCalTax[0] + (arrCalTax[0] * tax.taxAmount) / 100;

          arrCalTax[0] = tmp;
        }
      });

      // end hitungan baru

      const filter = { _id: new ObjectId(String(billId)) };
      const updateDoc = {
        $set: {
          items: tmpBillItems,
          nextEdit: true,
          title,
          taxs,
          totalAmountBillWTax: arrCalTax[0],
        },
      };

      const result = await collection.updateOne(filter, updateDoc);

      if (result.modifiedCount === 1) {
        res.status(200).json({ message: "Item updated successfully" });
      } else {
        res.status(404).json({ error: "Item not found" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  static async getBillById(req, res) {
    try {
      const { id } = req.params;
      const objectId = new ObjectId(id);
      const bill = await collection.findOne({ _id: objectId });
      // console.log(bill, "<<<<");

      if (bill) {
        res.status(200).json({ bill });
      } else {
        res.status(404).json({ error: "Bill not found" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  static async nodemailer(req, res, next) {
    try {
      const { id: billId } = req.body;
      // console.log(req.body, "<<<<<< body", billId);
      const findMember = await collection.findOne({
        _id: new ObjectId(req.body.id),
      });

      findMember.members.map(async (el) => {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "yustindelvin",
            pass: "edap rqsu dxjm llvx",
          },
        });

        const htmlTemplate = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Pembayaran</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  background-color: #f2f2f2;
                  margin: 0;
                  padding: 0;
                }
                .container {
                  max-width: 600px;
                  margin: 20px auto;
                  background-color: #fff;
                  border-radius: 10px;
                  padding: 20px;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                  color: #333;
                  text-align: center;
                }
                p {
                  color: #666;
                  line-height: 1.5;
                }
                .button {
                  display: inline-block;
                  padding: 10px 20px;
                  background-color: #007bff;
                  color: #fff; /* Ubah warna teks menjadi putih */
                  text-decoration: none;
                  border-radius: 5px;
                  margin-top: 20px;
                  transition: background-color 0.3s ease;
                }
                .button:hover {
                  background-color: #0056b3;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Halo ${el.name},</h1>
                <p>Terima kasih telah menggunakan layanan kami. Anda memiliki pembayaran yang harus diselesaikan.</p>
                <p>Silakan klik tautan di bawah ini untuk melihat detail pembayaran:</p>
                <a href="${process.env.URL_CLIENT}/payment/${billId}/${el.memberId}" class="button" style="color: white;">Lihat Detail Pembayaran</a>
                <p>Jika Anda memiliki pertanyaan atau membutuhkan bantuan lebih lanjut, jangan ragu untuk menghubungi kami.</p>
                <p>Terima kasih.</p>
              </div>
            </body>
            </html>
                
      `;

        await transporter.sendMail({
          from: "SplitPay",
          to: el.email,
          subject: "Hello",
          html: htmlTemplate,
        });
      });
      res.json({
        message: "success",
      });
    } catch (error) {
      next(error);
      console.log(error);
    }
  }

  static async resendNodemailer(req, res, next) {
    try {
      const { billId, memberId } = req.body;
      // console.log(req.body, "<<<<< resend nodemailer");
      const findMember = await collection.findOne({
        _id: new ObjectId(billId),
      });

      if (!findMember) {
        throw { name: "Not Found", message: "Bill not found" };
      }

      const memberData = findMember.members.filter(
        (member) => member.memberId == memberId
      );
      // console.log(memberData, "<<<<<<<< pengecekan member data");
      if (memberData.length == 0) {
        throw {
          name: "Not Found",
          message: "Member payment not fount on this billID: " + billId,
        };
      }

      // console.log(memberData, "<<<<<<<<");
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "yustindelvin",
          pass: "edap rqsu dxjm llvx",
        },
      });

      const htmlTemplate = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Pembayaran</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  background-color: #f2f2f2;
                  margin: 0;
                  padding: 0;
                }
                .container {
                  max-width: 600px;
                  margin: 20px auto;
                  background-color: #fff;
                  border-radius: 10px;
                  padding: 20px;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                  color: #333;
                  text-align: center;
                }
                p {
                  color: #666;
                  line-height: 1.5;
                }
                .button {
                  display: inline-block;
                  padding: 10px 20px;
                  background-color: #007bff;
                  color: #fff; /* Ubah warna teks menjadi putih */
                  text-decoration: none;
                  border-radius: 5px;
                  margin-top: 20px;
                  transition: background-color 0.3s ease;
                }
                .button:hover {
                  background-color: #0056b3;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Halo ${memberData[0].name},</h1>
                <p>Terima kasih telah menggunakan layanan kami. Anda memiliki pembayaran yang harus diselesaikan.</p>
                <p>Silakan klik tautan di bawah ini untuk melihat detail pembayaran:</p>
                <a href="${process.env.URL_CLIENT}/payment/${billId}/${memberData[0].memberId}" class="button" style="color: white;">Lihat Detail Pembayaran</a>
                <p>Jika Anda memiliki pertanyaan atau membutuhkan bantuan lebih lanjut, jangan ragu untuk menghubungi kami.</p>
                <p>Terima kasih.</p>
              </div>
            </body>
            </html>

      `;

      await transporter.sendMail({
        from: "SplitPay",
        to: memberData[0].email,
        subject: "Hello",
        html: htmlTemplate,
      });

      res.json({
        message: "Success resend email",
      });
    } catch (error) {
      next(error);
      console.log(error);
    }
  }

  static async updateMembersById(req, res, next) {
    try {
      // console.log(req.body, "<<<<<<<<<<");
      let { members, taxs } = req.body;
      const { id: billId } = req.params;

      if (!members)
        throw { name: "Data Required", message: "Members data required" };

      const totalTax = taxs.reduce((total, num) => {
        return total + Number(num.taxAmount);
      }, 0);

      let grandTotal = 0;
      members.map((el, index) => {
        let tmpTotal = 0;
        el.items.map((item) => {
          tmpTotal += item.amount;
        });
        members[index].subTotal = tmpTotal * (totalTax / 100) + tmpTotal;
        grandTotal += members[index].subTotal;
        members[index].memberId = new ObjectId();
        members[index].statusPayment = "pending";
      });

      // console.log(members, "<<<<<<<< memebr di server", grandTotal);
      const filter = { _id: new ObjectId(String(billId)) };
      const updateDoc = { $set: { members, grandTotal } };

      const result = await collection.updateOne(filter, updateDoc);

      if (result.modifiedCount === 1) {
        res.status(200).json({ message: "Upadate members success" });
      } else {
        res.status(404).json({ error: "Item not found" });
      }
    } catch (error) {
      next(error);
    }
  }

  static async getBillsUser(req, res, next) {
    try {
      const userId = req.user._id;
      // console.log(req.user, "<< user");
      const response = await collection
        .find({ UserId: new ObjectId(userId), nextEdit: true })
        .toArray();

      const tmpBills = response.map((bill) => {
        let tmpMembers = [];
        bill.members.map((member) => {
          if (tmpMembers.length == 0) {
            tmpMembers.push(member);
          } else if (
            member.statusPayment == "paid" ||
            member.statusPayment == "manual"
          ) {
            tmpMembers.push(member);
          } else {
            tmpMembers.unshift(member);
          }
        });
        bill.members = tmpMembers;
        return bill;
      });

      res.status(200).json({
        response: tmpBills.reverse(),
        saldo: req.user.saldo,
        email: req.user.email,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTotalPrice(req, res, next) {
    try {
      const { billId, memberId } = req.body;
      // console.log({ billId, memberId }, "get total price");
      const findBill = await collection.findOne({
        _id: new ObjectId(billId),
      });
      // console.log(findBill, "<<<<<<<< find billl");
      const member = findBill.members.filter((el) => {
        if (String(el.memberId) === memberId) {
          return el;
        }
      });
      // console.log(member, "<<<<<< members");
      res.status(200).json({
        data: member[0],
      });
    } catch (error) {
      console.log(error);
    }
  }
}
module.exports = ReceiptController;