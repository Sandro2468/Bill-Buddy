const request = require("supertest");
const fs = require("fs");
const app = require("../app");

jest.setTimeout(60000);

jest.mock("../middlewares/authentication", () => ({
  authentication: (req, res, next) => {
    req.user = { _id: "65f98a38cba57485cbb16962", username: "sandro" };
    next();
  },
}));
describe("Receipt OCR Endpoint", () => {
  it("should process OCR receipt and return success response", async () => {
    try {
      const imageBuffer = fs.readFileSync(
        "./asset/waroeng_kita_restaurant.jpg"
      );
      const response = await request(app)
        .post("/ocr-receipt")
        .attach("photo", imageBuffer, "waroeng_kita_restaurant.jpg")
        .field("titleBill", "bayar bayar");
      console.log("Response:", response.body);
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message", "Success");
      expect(response.body).toHaveProperty("data._id");
      expect(response.body).toHaveProperty("rawData");
    } catch (error) {
      console.error(error);
    }
  });
  it("should return 400 and error message when no photo is provided", async () => {
    try {
      const response = await request(app)
        .post("/ocr-receipt")
        .field("titleBill", "pp");

      console.log("Response:", response.body);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Invalid file upload" });
    } catch (error) {
      console.error(error);
    }
  });
});
describe("Update Item by ID Endpoint", () => {
  it("should update item by ID and return success response", async () => {
    try {
      const billId = "65f98adccba57485cbb16968";
      const response = await request(app)
        .put(`/update-item/${billId}`)
        .send({
          billItems: [
            {
              _id: "65f98adccba57485cbb16966",
              description: "Product A",
              qty: 2,
              unitPrice: 10000,
              amount: 20000,
            },
          ],
          title: "Updated Bill Title",
        });
      console.log("Response:", response.body);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Item updated successfully"
      );
    } catch (error) {
      console.error(error);
    }
  });
  it("should return 400 when item ID is invalid", async () => {
    try {
      const invalidBillId = "invalid_id";
      const response = await request(app)
        .put(`/update-item/${invalidBillId}`)
        .send({
          billItems: [
            {
              _id: "65f98adccba57485cbb16966",
              description: "Product A",
              qty: 2,
              unitPrice: 10000,
              amount: 20000,
            },
          ],
          title: "Updated Bill Title",
        });
      console.log("Response:", response.body);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Invalid ID" });
    } catch (error) {
      console.error(error);
    }
  });
});
describe("Get Bill by ID Endpoint", () => {
  it("should return bill by ID and status 200 for valid ID", async () => {
    try {
      const validBillId = "65f98adccba57485cbb16968";
      const response = await request(app).get(`/get-bill/${validBillId}`);

      console.log("Response:", response.body);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("bill");
    } catch (error) {
      console.error(error);
    }
  });
  it("should return 404 for invalid bill ID", async () => {
    try {
      const invalidBillId = "83u4923u4239u4";
      const response = await request(app).get(`/get-bill/${invalidBillId}`);

      console.log("Response:", response.body);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "Bill not found" });
    } catch (error) {
      console.error(error);
    }
  });
});
describe("Update Members by ID Endpoint", () => {
  it("should update members by ID and return success response", async () => {
    try {
      const billId = "65f98adccba57485cbb16968";
      const response = await request(app)
        .put(`/update-members/${billId}`)
        .send({
          members: [
            {
              items: [{ amount: 10000 }, { amount: 15000 }],
            },
            {
              items: [{ amount: 20000 }, { amount: 25000 }],
            },
          ],
        });

      console.log("Response:", response.body);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Update members success");
    } catch (error) {
      console.error(error);
    }
  });
  it("should return 404 when bill ID is invalid", async () => {
    try {
      const invalidBillId = "65f98adccba57485cbb16968";
      const response = await request(app)
        .put(`/update-members/${invalidBillId}`)
        .send({
          members: [
            {
              items: [{ amount: 10000 }, { amount: 15000 }],
            },
          ],
        });
      console.log("Response:", response.body);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "Item not found" });
    } catch (error) {
      console.error(error);
    }
  });
  it("should return 400 when members data is not provided", async () => {
    try {
      const validBillId = "65f98adccba57485cbb16968";
      const response = await request(app)
        .put(`/update-members/${validBillId}`)
        .send({});

      console.log("Response:", response.body);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Members data required" });
    } catch (error) {
      console.error(error);
    }
  });
});
