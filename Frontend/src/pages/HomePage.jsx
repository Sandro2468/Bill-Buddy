import axios from "axios";
import { useEffect } from "react";
import { useState } from "react";
import {
  HiOutlineMail,
  HiOutlineCheck,
  HiOutlineArrowsExpand,
} from "react-icons/hi";
import { confirmAlert, notifAlert, viewImage } from "../helpers/alerts";

const baseUrl = import.meta.env.VITE_BASE_URL;

export default function HomePage() {
  const [billsData, setBillsData] = useState();
  const [saldo, setSaldo] = useState(null);
  const [email, setEmail] = useState(null);
  const [statusViewDetail, setStatusViewDetail] = useState({
    status: false,
    index: "",
  });

  const getBillData = async () => {
    try {
      const response = await axios({
        method: "get",
        url: baseUrl + "/bills",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      // console.log(response);
      setBillsData(response.data.response);
      setSaldo(response.data.saldo);
      setEmail(response.data.email);
    } catch (error) {
      console.log(error);
    }
  };

  const greeting = () => {
    const curHour = new Date().getHours();
    if (curHour > 18) {
      return {
        time: "Good night!",
        message: "Wishing you sweet dreams and a restful sleep.",
      };
    } else if (curHour > 15) {
      return {
        time: "Good evening!",
        message: "I hope your day has been amazing so far.",
      };
    } else if (curHour > 11) {
      return {
        time: "Good afternoon!",
        message: "Hope you're having a productive day.",
      };
    } else {
      return {
        time: "Good morning!",
        message: "Have a wonderful day ahead.",
      };
    }
  };

  const resendMailPayment = async (billId, memberId, email) => {
    try {
      const confirm = await confirmAlert("Resend bill to: " + email);

      if (confirm.isConfirmed) {
        const response = await axios({
          method: "post",
          url: baseUrl + "/nodemailer/resend",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          data: { billId, memberId },
        });

        if (response.data.message == "Success resend email") {
          notifAlert("Success resend email");
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const payBySelf = async (billId, memberId, name, total) => {
    try {
      const confirm = await confirmAlert(
        `Manual paid ${name}'s bill with total Rp. ${Number(
          total
        ).toLocaleString("id-ID")}?`
      );

      if (confirm.isConfirmed) {
        const response = await axios({
          method: "post",
          url: baseUrl + "/payment/manual",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          data: { billId, memberId },
        });

        if (response.data.message == "Upadate status payment success") {
          notifAlert("Upadate status payment success");
        }
        getBillData();
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getBillData();
  }, []);

  return (
    <>
      <div className="h-screen mt-16 mb-32">
        <div className="mx-2 p-2 rounded-lg shadow-lg  font-bold text-lg">
          <div className="mb-2">
            <span className="text-2xl">{greeting().time} </span>
            <p className="font-normal font-serif italic opacity-50">
              {greeting().message}
            </p>
          </div>
          <span>My Balance : </span>
          <div className="bg-dua text-white h-36 rounded-lg p-2 mt-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-base opacity-50">
                Total Balance
              </span>
              <span className="text-sm opacity-75">
                {email && email.split("@")[0]}
              </span>
            </div>
            <span className="text-3xl">
              Rp {saldo && saldo.toLocaleString("id-ID")}
            </span>
            <div className="flex justify-evenly mt-5">
              <button className="bg-tiga w-36 py-1 rounded-xl font-medium">
                Deposite
              </button>
              <button className="border-2 rounded-xl font-normal opacity-70 w-36 py-1">
                Withdraw
              </button>
            </div>
          </div>
        </div>
        {/* card split bill */}
        {billsData &&
          billsData.map((bill, i) => {
            return (
              <div key={i} className="mx-2 p-2 rounded-lg shadow-lg mt-2">
                <div
                  onClick={() => {
                    setStatusViewDetail({
                      status: !statusViewDetail.status,
                      index: i,
                    });
                  }}
                  className="grid grid-cols-2 mb-2 text-white bg-empat p-2 rounded-lg"
                >
                  <span className="font-bold">{bill.title}</span>
                  <div className="flex flex-col items-end-end">
                    <div className="flex justify-end items-center gap-2">
                      <span className="text-end italic">
                        {new Date(bill.createdAt).toLocaleString("id-ID", {
                          dateStyle: "medium",
                        })}
                      </span>
                      <span
                        onClick={() => {
                          viewImage(bill.image);
                        }}
                        className=" opacity-90"
                      >
                        <HiOutlineArrowsExpand />
                      </span>
                    </div>
                    <span className="text-end opacity-50 italic font-mono">
                      {bill.members.reduce((total, cur) => {
                        if (
                          cur.statusPayment == "paid" ||
                          cur.statusPayment == "manual"
                        ) {
                          return total + 1;
                        } else {
                          return total + 0;
                        }
                      }, 0)}
                      /{bill.members.length} paid
                    </span>
                  </div>
                </div>
                {statusViewDetail.status && statusViewDetail.index == i ? (
                  <>
                    {/* data bill per members */}
                    {bill.members &&
                      bill.members.map((member, ind) => {
                        return (
                          <div key={ind} className="border-t-2">
                            <div className="flex justify-between">
                              <span className="font-bold flex items-center gap-1">
                                {member.name}
                                <span className="font-normal italic opacity-50 font-serif text-sm">
                                  ({member.statusPayment})
                                </span>
                                {member.statusPayment == "pending" ? (
                                  <>
                                    <span
                                      onClick={() => {
                                        resendMailPayment(
                                          bill._id,
                                          member.memberId,
                                          member.email
                                        );
                                      }}
                                      className="text-lg opacity-50"
                                    >
                                      <HiOutlineMail />
                                    </span>{" "}
                                    <span className="opacity-50">|</span>
                                    <span
                                      onClick={() => {
                                        payBySelf(
                                          bill._id,
                                          member.memberId,
                                          member.name,
                                          member.subTotal
                                        );
                                      }}
                                      className="text-lg opacity-50"
                                    >
                                      <HiOutlineCheck />
                                    </span>
                                  </>
                                ) : (
                                  ""
                                )}
                              </span>
                              <span className="font-bold">
                                Rp{" "}
                                {member.subTotal &&
                                  member.subTotal.toLocaleString("id-ID")}
                              </span>
                            </div>
                            <div>
                              <ul className="ml-2">
                                {member.items &&
                                  member.items.map((item, indexItem) => {
                                    return (
                                      <li
                                        key={indexItem}
                                        className="grid grid-cols-3"
                                      >
                                        <span className="text-start">
                                          <span>1. </span>
                                          {item.description}
                                        </span>
                                        <span className="text-center">
                                          {item.qty}
                                        </span>
                                        <span className="text-end opacity-50">
                                          Rp{" "}
                                          {item.amount &&
                                            item.amount.toLocaleString("id-ID")}
                                        </span>
                                      </li>
                                    );
                                  })}
                              </ul>
                            </div>
                          </div>
                        );
                      })}
                    {/* total split bill */}
                    <div className="grid grid-cols-2 mt-2 border-t-2">
                      <span className="font-bold">Total : </span>
                      <span className="text-end font-bold">
                        ~ Rp{" "}
                        {bill.totalAmountBillWTax &&
                          bill.totalAmountBillWTax.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </>
                ) : (
                  ""
                )}
              </div>
            );
          })}
        {/* end card split bill */}
      </div>
    </>
  );
}
