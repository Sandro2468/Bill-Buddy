import axios from "axios";
import { BottNavbar, TopNavbar } from "../components/Navbar";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

const baseUrl = import.meta.env.VITE_BASE_URL;

export default function Payment() {
  const params = useParams();
  const [image, setImage] = useState();
  const [price, setPrice] = useState();
  const [item, setItem] = useState([]);
  const [taxs, setTaxs] = useState([]);
  const [statusPayment, setStatusPayment] = useState("pending");
  const navigate = useNavigate();
  const [nameMember, setNameMember] = useState("");

  const getPrice = async () => {
    try {
      const response = await axios({
        method: "post",
        url: baseUrl + "/get-price",
        data: {
          billId: params.billId,
          memberId: params.memberId,
        },
      });
      console.log(response, "<<< get price");
      setPrice(response.data.data.subTotal);
      setItem(response.data.data.items);
      setStatusPayment(response.data.data.statusPayment);
      setNameMember(response.data.data.name);
    } catch (error) {
      console.log(error);
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(number);
  };

  const getImage = async () => {
    try {
      const response = await axios({
        method: "get",
        url: baseUrl + "/get-bill/" + params.billId,
      });
      setImage(response.data.bill.image);
      setTaxs(response.data.bill.taxs);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getImage();
    getPrice();
  }, []);

  const handleOnUpgrade = async () => {
    const { data } = await axios.post(
      "http://localhost:3000/payment/midtrans/initiate",
      {
        data: {
          billId: params.billId,
          memberId: params.memberId,
        },
      }
    );
    console.log(data);
    window.snap.pay(data.transactionToken, {
      onSuccess: async function (result) {
        alert("payment success!");
        console.log(result);
        await axios.patch("http://localhost:3000/users/me/paid", {
          data: {
            orderId: data.orderId,
            billId: params.billId,
            memberId: params.memberId,
          },
        });
      },
    });
    navigate("/");
  };

  // fungsi untuk close page by button
  const closeTab = () => {
    window.opener = null;
    window.open("", "_self");
    window.close();
  };

  return (
    <>
      {statusPayment == "pending" ? (
        <div style={{ overflowY: "auto" }}>
          <TopNavbar />
          <div
            style={{
              backgroundColor: "#fff",
              minHeight: "calc(100vh - 60px)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              color: "#222",
              padding: "20px",
              marginBottom: "60px",
            }}
            className="mt-16"
          >
            <h2 className="text-3xl font-bold" style={{ marginBottom: "20px" }}>
              Informasi Pembayaran
            </h2>

            {image && (
              <img
                src={image}
                alt="Bill"
                style={{
                  maxWidth: "200px",
                  height: "auto",
                  marginBottom: "20px",
                  borderRadius: "5px",
                }}
              />
            )}
            <div
              style={{
                border: "1px solid #ccc",
                borderRadius: "5px",
                padding: "20px",
                backgroundColor: "#f0f0f0",
                maxWidth: "400px",
                textAlign: "center",
              }}
            >
              <h3 style={{ marginBottom: "10px" }}>Rincian Barang:</h3>
              {item &&
                item.map((item, index) => (
                  <div key={index} style={{ marginBottom: "10px" }}>
                    <p style={{ fontSize: "16px", marginBottom: "5px" }}>
                      {item.description}
                    </p>
                    <p style={{ fontSize: "14px", color: "#666" }}>
                      {item.qty} x {formatRupiah(item.amount)}
                    </p>
                  </div>
                ))}
              <div className="text-sm opacity-70 italic">
                <div>+</div>
                {taxs &&
                  taxs.map((el, ik) => {
                    return (
                      <span key={ik}>
                        {el.taxName}
                        {el.taxAmount}%{" "}
                      </span>
                    );
                  })}
              </div>
            </div>
            <div
              style={{
                border: "1px solid #ccc",
                borderRadius: "5px",
                padding: "20px",
                backgroundColor: "#f0f0f0",
                maxWidth: "400px",
                textAlign: "center",
                marginTop: "20px",
              }}
            >
              <p style={{ fontSize: "16px", marginBottom: "10px" }}>
                Total Tagihan: {formatRupiah(price)}{" "}
                <span style={{ fontWeight: "bold" }}></span>
              </p>
              <p style={{ fontSize: "16px", marginBottom: "10px" }}>
                Metode Pembayaran:{" "}
                <span style={{ fontWeight: "bold" }}>Midtrans</span>
              </p>
              <p style={{ fontSize: "14px" }}>
                Silakan tekan tombol PAY untuk melanjutkan pembayaran
                menggunakan metode Midtrans.
              </p>
            </div>
            <button
              onClick={handleOnUpgrade}
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                fontSize: "16px",
                fontWeight: "bold",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                transition: "background-color 0.3s ease",
              }}
            >
              PAY
            </button>
          </div>
          <BottNavbar style={{ position: "fixed", bottom: 0, width: "100%" }} />
        </div>
      ) : (
        <div className="flex justify-center h-screen">
          <TopNavbar />
          <div className="flex justify-center flex-col sm:w-1/2 md:w-1/2 shadow-2xl h-screen">
            <div className="mt-16 flex justify-center">
              <img
                className="rounded-3xl -mt-5 w-full mobile:w-3/4 md:w-1/2"
                src="/success-bg.jpg"
                alt=""
              />
            </div>
            <div className="flex flex-col items-center mt-2">
              <div className="text-xl font flex">
                Payment successful!{" "}
                <img className="h-8" src="/icons8-success.gif" alt="" />
              </div>
              <span className="font-bold">
                {" "}
                <span className="opacity-50">Hallo</span> {nameMember}{" "}
              </span>
              <span className="text-xl font-semibold">
                ~ {formatRupiah(price)} ~
              </span>
              <p>We have receive your split bill payment</p>
            </div>
            <div className="flex justify-center mt-5">
              <button
                onClick={closeTab}
                className="bg-slate-500 px-4 text-xl py-2 text-white font-bold rounded-xl"
              >
                Close Page
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}