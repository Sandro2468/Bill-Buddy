const { ObjectId } = require("mongodb");
const database = require("../config/mongo");
const midtransClient = require("midtrans-client");
const { default: axios } = require("axios");
const collection = database.collection("Receipts");
const collectionPayment = database.collection("Payment");
const collectionUsers = database.collection("Users");

class PaymentController {
  static async initiateMidtransTrx(req, res, next) {
    // console.log(req.body, "<<<<<<<<<<<<<<<<<<<<<<<<");
    const { billId, memberId } = req.body.data;
    try {
      const findUser = await collection.findOne({
        _id: new ObjectId(billId),
      });
      // console.log(billId, memberId,findUser, "<<<<<");
      const paymentData = findUser.members.filter((el) => {
        if (String(el.memberId) === memberId) {
          return el;
        }
      });
      // console.log(paymentData, "><><><");
      // console.log(findUser, "<<<");
      // const findMember = await collection.findOne()

      const orderId = Math.random().toString();
      const amount = 10000;
      let snap = new midtransClient.Snap({
        // Set to true if you want Production Environment (accept real transaction).
        isProduction: false,
        serverKey: "SB-Mid-server-80reExAd7AJo_FbbElP2C301",
      });

      let parameter = {
        transaction_details: {
          order_id: orderId,
          gross_amount: paymentData[0].subTotal,
        },
        credit_card: {
          secure: true,
        },
        customer_details: {
          first_name: paymentData[0].name,
          email: paymentData[0].email,
        },
      };

      const transaction = await snap.createTransaction(parameter);
      let transactionToken = transaction.token;
      //  await Order.create({
      //     orderId,
      //     amount,
      //     UserrId: req.user.id,
      //  });
      await collectionPayment.insertOne({
        orderId: orderId,
        amount: amount,
        memberId: paymentData[0].memberId,
        billId: billId,
      });
      // console.log("transactionToken:", transactionToken);
      res.json({ message: "Order created", transactionToken, orderId });
    } catch (error) {
      next(error);
    }
  }
  static async paid(req, res, next) {
    const { orderId, billId, memberId } = req.body.data;
    // console.log(req.body, "<<<<< body");
    try {
      const order = await collectionPayment.findOne({ orderId: orderId });
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      //  if (order.status === "paid") {
      //     return res.status(400).json({ message: "Order already paid" });
      //  }
      //  console.log(order, "<<<<<<");
      const serverKey = "SB-Mid-server-80reExAd7AJo_FbbElP2C301";
      const base64ServerKey = Buffer.from(serverKey + ":").toString("base64");
      const { data } = await axios.get(
        `https://api.sandbox.midtrans.com/v2/${orderId}/status`,
        {
          headers: {
            Authorization: `Basic ${base64ServerKey}`,
          },
        }
      );
      //  console.log(data, "data<<<<<<<");
      if (data.transaction_status === "capture" && data.status_code === "200") {
        // await req.user.update({ role: "Premium" });
        const findBill = await collection.findOne({
          _id: new ObjectId(billId),
        });
        console.log(findBill.UserId, "findbill <<<<");
        let members = findBill.members.map((el) => {
          if (memberId === String(el.memberId)) {
            if (el.statusPayment == "paid") {
              throw new Error("bill already paid");
            }
            el.statusPayment = "paid";
            return el;
          } else {
            return el;
          }
        });
        await collection.updateOne(
          {
            _id: new ObjectId(billId),
          },
          {
            $set: { members },
          }
        );
        const findUserId = await collectionUsers.findOne({
          _id: findBill.UserId,
        });
        // console.log(findUserId, "finduserid");
        if (!findUserId) {
          throw new Error("User not found");
        }
        let saldo = (findUserId.saldo += Number(data.gross_amount));
        await collectionUsers.updateOne(
          {
            _id: findBill.UserId,
          },
          {
            $set: { saldo },
          }
        );
        // await order.update({ status: "paid", paidDate: new Date() });
        res.json({ message: "Upgrade success" });
      } else {
        res.status(400).json({
          message: "Upgrade failed, please call our customer support",
          midtransMessage: data.status_message,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  static async maualPayment(req, res, next) {
    const { billId, memberId } = req.body;
    try {
      const findBill = await collection.findOne({ _id: new ObjectId(billId) });

      if (!findBill) {
        throw { name: "Not Found", message: "Bill not found" };
      }
      // console.log(findBill, "<<<<<<");
      const memberData = findBill.members.filter(
        (member) => member.memberId == memberId
      );

      if (!memberData) {
        throw {
          name: "Not Found",
          message: "Member not found in BillId: " + billId,
        };
      }

      const tmpMemberData = findBill.members.map((member) => {
        if (member.memberId == memberId) {
          member.statusPayment = "manual";
          return member;
        } else {
          return member;
        }
      });

      const filter = { _id: new ObjectId(String(billId)) };
      const updateDoc = { $set: { members: tmpMemberData } };

      const result = await collection.updateOne(filter, updateDoc);

      if (result.modifiedCount === 1) {
        res.status(200).json({ message: "Upadate status payment success" });
      } else {
        res.status(404).json({ error: "Item not found" });
      }
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PaymentController;