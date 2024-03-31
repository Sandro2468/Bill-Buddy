import axios from "axios";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  HiPlusCircle,
  HiOutlineXCircle,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineClipboardList,
  HiOutlineArrowsExpand,
  HiOutlineTrash,
  HiOutlinePlusSm,
  HiOutlineMinusSm,
} from "react-icons/hi";
import {
  confirmAlert,
  errorAlert,
  notifAlert,
  viewImage,
} from "../helpers/alerts";

const baseUrl = import.meta.env.VITE_BASE_URL;
const clientUrl = import.meta.env.VITE_CLIENT_URL;

// socket.io
import socket from "../socket";
import { BottNavbar, TopNavbar } from "../components/Navbar";

export default function ColaborateSplitBill() {
  const [imageUrl, setImageUrl] = useState(null);
  const [taxs, setTaxs] = useState([]);
  const [targetTotalAmountBill, setTargetTotalAmountBill] = useState(0);
  const [billData, setBillData] = useState([]);
  const [members, setMembers] = useState([]);
  const [title, setTitle] = useState("");
  const [createdDate, setCreatedDate] = useState("");
  const [statusAddMember, setStatusAddMember] = useState(false);
  const params = useParams();
  const location = useLocation();
  const [currentUrl, setCurrentUrl] = useState("");
  const navigate = useNavigate();
  const [addMemberInput, setAddMemberInput] = useState({
    name: "",
    email: "",
    items: [],
  });

  // state untuk tambah item yang dipesan member
  const [addBillInputMember, setAddBillInputMember] = useState({
    descriptionAndAmount: [],
    qty: 0,
    amount: 0,
  });

  const [statusAddItemMember, setStatusAddItemMember] = useState({
    status: false,
    index: "",
  });

  const addBillInputMemberHandler = (e) => {
    const { name, value } = e.target;
    setAddBillInputMember({ ...addBillInputMember, [name]: value });
  };

  const submitAddInputMemberHandler = (indexMember) => {
    if (
      !addBillInputMember.descriptionAndAmount ||
      !addBillInputMember.qty ||
      addBillInputMember.qty <= 0
    ) {
      errorAlert("Please select item and enter qty");
      return false;
    }

    let tmpAddItemMember = {
      description: addBillInputMember.descriptionAndAmount.split(",")[0],
      qty: addBillInputMember.qty,
      amount:
        addBillInputMember.qty *
        addBillInputMember.descriptionAndAmount.split(",")[1],
    };

    let tmpMembers = [...members];

    tmpMembers[indexMember].items = [
      ...tmpMembers[indexMember].items,
      tmpAddItemMember,
    ];

    setMembers(tmpMembers);
    // kirim data members terbaru ke room yang sesuai billId
    socket.emit("send:members", params.billId, tmpMembers);
    setStatusAddItemMember({
      status: false,
      index: "",
    });
    setAddBillInputMember({
      descriptionAndAmount: [],
      qty: 0,
      amount: 0,
    });
  };

  const getDataBillId = async () => {
    try {
      const response = await axios({
        method: "get",
        url: baseUrl + "/get-bill/" + params.billId,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      console.log(response, "<<<<<<<< response getBillById");
      setBillData(response.data.bill.items);
      setTitle(response.data.bill.title);
      setCreatedDate(response.data.bill.createdAt);
      setTargetTotalAmountBill(response.data.bill.totalAmountBillWTax);
      setTaxs(response.data.bill.taxs);
      setImageUrl(response.data.bill.image);
    } catch (error) {
      console.log(error);
    }
  };

  const addMemberHandler = (e) => {
    const { name, value } = e.target;
    setAddMemberInput({ ...addMemberInput, [name]: value });
  };

  const addMember = () => {
    if (!addMemberInput.name || !addMemberInput.email) {
      errorAlert("Please input member name and member email");
      return false;
    }
    const tmpMember = members.concat(addMemberInput);
    setMembers(tmpMember);
    setStatusAddMember(!statusAddMember);
    // kirim data members terbaru ke room yang sesuai billId
    socket.emit("send:members", params.billId, tmpMember);
  };

  const finishSplitBillHandler = async () => {
    try {
      const { isConfirmed } = await confirmAlert("Finish split bill?");
      if (isConfirmed) {
        const response = await axios({
          method: "put",
          url: baseUrl + "/update-members/" + params.billId,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          data: { members, taxs },
        });
        // send email to member
        await axios({
          method: "post",
          url: baseUrl + "/nodemailer",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          data: { id: params.billId },
        });

        if (response.data.message == "Upadate members success") {
          navigate("/");
        }
        socket.disconnect();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const myFunction = () => {
    var copyText = document.getElementById("myInput");
    copyText.select();
    copyText.setSelectionRange(0, 99999); // For mobile devices
    navigator.clipboard.writeText(copyText.value);
    notifAlert("Copied colaborate link to clipboard");
  };

  const getTotal = () => {
    if (members.length > 0) {
      let arrCalTax = [];

      // hitung total
      let total = 0;
      members.map((el) => {
        let totalItem = 0;
        el.items.map((ela) => {
          totalItem += ela.amount;
        });
        total += totalItem;
      });
      arrCalTax.push(total);

      taxs.map((tax) => {
        if (arrCalTax.length == 1) {
          const tmp = arrCalTax[0] + (arrCalTax[0] * tax.taxAmount) / 100;

          arrCalTax[0] = tmp;
        }
      });
      return arrCalTax[0];
    }
    return 0;
  };

  // const calculateTotal = () => {
  //   if (billItems && taxs) {
  //     let arrCalTax = [];

  //     const total = billItems.reduce((total, num) => {
  //       return total + num.amount;
  //     }, 0);
  //     arrCalTax.push(Number(total));
  //     taxs.map((tax) => {
  //       if (arrCalTax.length == 1) {
  //         const tmp = arrCalTax[0] + (arrCalTax[0] * tax.taxAmount) / 100;

  //         arrCalTax[0] = tmp;
  //       }
  //     });

  //     return arrCalTax[0].toLocaleString("id-ID");
  //   }
  // };

  const deleteMember = (index) => {
    const tmpMember = [...members];
    tmpMember.splice(index, 1);
    setMembers(tmpMember);
    socket.emit("send:members", params.billId, tmpMember);
  };

  const updateItem = (cmd, memberIdx, itemIdx) => {
    let tmpMember = [...members];
    if (cmd == "plus") {
      let tmpUnitAmount =
        Number(tmpMember[memberIdx].items[itemIdx].amount) /
        Number(tmpMember[memberIdx].items[itemIdx].qty);
      tmpMember[memberIdx].items[itemIdx].qty =
        Number(tmpMember[memberIdx].items[itemIdx].qty) + 1;
      tmpMember[memberIdx].items[itemIdx].amount =
        tmpUnitAmount * tmpMember[memberIdx].items[itemIdx].qty;
      socket.emit("send:members", params.billId, tmpMember);
      setMembers(tmpMember);
    } else if (cmd == "minus") {
      let tmpUnitAmount =
        Number(tmpMember[memberIdx].items[itemIdx].amount) /
        Number(tmpMember[memberIdx].items[itemIdx].qty);
      tmpMember[memberIdx].items[itemIdx].qty =
        Number(tmpMember[memberIdx].items[itemIdx].qty) - 1;
      tmpMember[memberIdx].items[itemIdx].amount =
        tmpUnitAmount * tmpMember[memberIdx].items[itemIdx].qty;
      if (tmpMember[memberIdx].items[itemIdx].qty <= 0) {
        tmpMember[memberIdx].items.splice(itemIdx, 1);
      }
      socket.emit("send:members", params.billId, tmpMember);
      setMembers(tmpMember);
    }
  };

  useEffect(() => {
    getDataBillId();

    socket.auth = {
      billId: params.billId,
    };

    socket.connect();
    if (localStorage.getItem("access_token")) {
      socket.emit(
        "join:room",
        params.billId,
        localStorage.getItem("access_token")
      );
    } else {
      socket.emit("join:room", params.billId, null);
    }

    socket.on("receive:membersData", (membersData) => {
      if (membersData.members) {
        setMembers(membersData.members);
      }

      // console.log(membersData, "<<<<< data dari socketIO");
    });

    setCurrentUrl(`${clientUrl}${location.pathname}`);
    return () => {
      socket.off("join:room");
    };
  }, []);

  return (
    <>
      <TopNavbar />
      <BottNavbar />
      <div className="h-screen mt-16 mb-96">
        <div className="ml-3 mb-2 mt-4 mr-3">
          <h2 className="font-semibold text-3xl font-mono">Colaborate bill</h2>
          <p className="font-serif text-sm italic opacity-50">
            *split your bill here with your members, copy the link on the bottom
            and share to edit together
          </p>
        </div>
        <div className="mx-2 p-2 rounded-lg shadow-lg flex flex-col text-lg bg-empat text-white">
          <div className="font-bold">
            {'"'}
            {title}
            {'"'}
          </div>
          <div className="text-end italic text-base">
            <div>
              <span className="py-1 font-bold rounded-lg animate-pulse opacity-90">
                Rp{" "}
                {targetTotalAmountBill &&
                  targetTotalAmountBill.toLocaleString("id-ID")}{" "}
                (target)
              </span>
            </div>
            <div>
              {createdDate &&
                new Date(createdDate).toLocaleString("id-ID", {
                  dateStyle: "full",
                })}
            </div>
          </div>
        </div>
        {/* card split bill */}
        <div className="mx-2 p-2 rounded-lg shadow-lg mt-2">
          {members &&
            members.map((member, i) => {
              return (
                <div key={i} className="border-b-2">
                  <div className="flex justify-between">
                    <span className="font-bold flex gap-1 items-center">
                      {member.name.length > 15 ? (
                        <>{member.name.slice(0, 15)} ~ </>
                      ) : (
                        member.name
                      )}{" "}
                      <span
                        onClick={() => {
                          deleteMember(i);
                        }}
                        className="opacity-55"
                      >
                        <HiOutlineTrash />
                      </span>
                    </span>
                    <span className="font-bold">
                      Rp{" "}
                      {member.items
                        .reduce((total, cur) => {
                          return total + cur.amount;
                        }, 0)
                        .toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div>
                    <ul className="ml-2">
                      {member.items.map((item, ia) => {
                        return (
                          <>
                            <li key={ia} className="grid grid-cols-3">
                              <span className="text-start">
                                <span>{ia + 1}. </span>
                                {item.description}
                              </span>
                              <span className="flex justify-center items-start">
                                <div className="flex items-center gap-2">
                                  <span
                                    onClick={() => {
                                      updateItem("minus", i, ia);
                                    }}
                                    className="font-bold text-xl opacity-55"
                                  >
                                    <HiOutlineMinusSm />
                                  </span>
                                  <span>{item.qty}</span>{" "}
                                  <span
                                    onClick={() => {
                                      updateItem("plus", i, ia);
                                    }}
                                    className="font-bold text-xl"
                                  >
                                    <HiOutlinePlusSm />
                                  </span>
                                </div>
                              </span>
                              <span className="text-end opacity-50">
                                Rp.{" "}
                                {item.amount &&
                                  item.amount.toLocaleString("id-ID")}
                              </span>
                            </li>
                          </>
                        );
                      })}
                    </ul>
                  </div>
                  {/* card tambah user item */}
                  <div className="flex flex-col mb-2">
                    {statusAddItemMember.status &&
                    statusAddItemMember.index == i ? (
                      <>
                        <select
                          name="descriptionAndAmount"
                          id=""
                          className="py-1"
                          onChange={addBillInputMemberHandler}
                        >
                          <option value="" disabled selected>
                            -- Select Item --
                          </option>
                          {billData &&
                            billData.map((bill, ib) => {
                              return (
                                <option
                                  key={ib}
                                  value={[bill.description, bill.unitPrice]}
                                >
                                  {bill.description}
                                </option>
                              );
                            })}
                        </select>
                        <div className="pl-1">
                          <label htmlFor="qytItemMember">Qty: </label>
                          <input
                            type="number"
                            name="qty"
                            id="qytItemMember"
                            className="border pl-2 rounded-md w-14"
                            onChange={addBillInputMemberHandler}
                            autoComplete="off"
                          />
                          <span> Ea</span>
                        </div>
                        <div className="flex justify-center mt-2">
                          <button
                            onClick={() => {
                              submitAddInputMemberHandler(i);
                            }}
                            className="px-2 text-4xl rounded-md"
                          >
                            <HiOutlineCheck />
                          </button>
                          <button
                            onClick={() => {
                              setStatusAddItemMember({
                                status: !statusAddItemMember.status,
                                index: "",
                              });
                            }}
                            className="px-2 text-4xl rounded-md"
                          >
                            <HiOutlineX />
                          </button>
                        </div>
                      </>
                    ) : (
                      ""
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <div className="opacity-55">
                        {member.email.length > 25 ? (
                          <>{member.email.slice(0, 25)} . . . </>
                        ) : (
                          member.email
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setStatusAddItemMember({
                            status: !statusAddItemMember.status,
                            index: i,
                          });
                        }}
                        className="border-2 opacity-65 px-2 py-1 text-sm rounded-md"
                      >
                        add item
                      </button>
                    </div>
                  </div>
                  {/* end card tambah user item */}
                </div>
              );
            })}
          {/* total split bill */}

          {/* card grand total */}
          <div className="grid grid-cols-2 mt-2 ">
            <span className="font-bold">Grand Total : </span>
            <span className="text-end font-bold">
              {/* {(members.reduce((total, { items }) => {
                const sumOfSubarray = items.reduce(
                  (acc, { amount }) => acc + amount,
                  0
                );
                return total + sumOfSubarray;
              }, 0) *
                taxs.reduce((total, num) => {
                  return total + Number(num.taxAmount);
                }, 0)) /
                100 +
                members.reduce((total, { items }) => {
                  const sumOfSubarray = items.reduce(
                    (acc, { amount }) => acc + amount,
                    0
                  );
                  return total + sumOfSubarray;
                }, 0) ==
              targetTotalAmountBill ? (
                <span className="bg-green-400 px-2 rounded-lg">
                  ~ Rp{" "}
                  {Number(
                    (members.reduce((total, { items }) => {
                      const sumOfSubarray = items.reduce(
                        (acc, { amount }) => acc + amount,
                        0
                      );
                      return total + sumOfSubarray;
                    }, 0) *
                      taxs.reduce((total, num) => {
                        return total + Number(num.taxAmount);
                      }, 0)) /
                      100 +
                      members.reduce((total, { items }) => {
                        const sumOfSubarray = items.reduce(
                          (acc, { amount }) => acc + amount,
                          0
                        );
                        return total + sumOfSubarray;
                      }, 0)
                  ).toLocaleString("id-ID")}
                </span>
              ) : (
                <span className="bg-red-400 px-2 rounded-lg">
                  ~ Rp{" "}
                  {Number(
                    (members.reduce((total, { items }) => {
                      const sumOfSubarray = items.reduce(
                        (acc, { amount }) => acc + amount,
                        0
                      );
                      return total + sumOfSubarray;
                    }, 0) *
                      taxs.reduce((total, num) => {
                        return total + Number(num.taxAmount);
                      }, 0)) /
                      100 +
                      members.reduce((total, { items }) => {
                        const sumOfSubarray = items.reduce(
                          (acc, { amount }) => acc + amount,
                          0
                        );
                        return total + sumOfSubarray;
                      }, 0)
                  ).toLocaleString("id-ID")}
                </span>
              )} */}
              {/* Rp. {getTotal()} */}

              {getTotal() == targetTotalAmountBill ? (
                <span className="bg-green-500 px-2 py-1 rounded-xl">
                  Rp. {getTotal().toLocaleString("id-ID")}
                </span>
              ) : (
                <span className="bg-red-500 px-2 py-1 rounded-xl">
                  Rp. {getTotal().toLocaleString("id-ID")}
                </span>
              )}
            </span>
          </div>
          {/* end card grand total */}

          {/* card tambah member */}
          {statusAddMember && (
            <div className="mt-3 border-t-2">
              <div className="grid grid-cols-2">
                <label htmlFor="name">Member Name: </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  placeholder="Enter name"
                  className="pl-1"
                  autoComplete="off"
                  onChange={addMemberHandler}
                />
              </div>
              <div className="grid grid-cols-2">
                <label htmlFor="email">Member Email: </label>
                <input
                  type="text"
                  name="email"
                  id="email"
                  placeholder="Enter email"
                  className="pl-1"
                  autoComplete="off"
                  onChange={addMemberHandler}
                />
              </div>
              <div className="flex justify-center mt-2">
                <button
                  onClick={addMember}
                  className=" border-2 opacity-85 px-2 rounded-lg py-1"
                >
                  add member
                </button>
              </div>
            </div>
          )}
          {/* end card tambah member */}

          {/* tombol add member */}
          <div className="flex justify-end text-4xl">
            <button
              onClick={() => {
                setStatusAddMember(!statusAddMember);
              }}
            >
              {statusAddMember ? <HiOutlineXCircle /> : <HiPlusCircle />}
            </button>
          </div>
          {/* end tombol add member */}
        </div>
        {/* end card split bill */}

        {/* tombol finis split bill */}
        {localStorage.getItem("access_token") && (
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <div className=" flex ml-2">
                <input hidden type="text" value={currentUrl} id="myInput" />
                <button className="text-4xl" onClick={myFunction}>
                  <HiOutlineClipboardList />
                </button>
              </div>
              <span
                onClick={() => {
                  viewImage(imageUrl);
                }}
                className="text-3xl opacity-55"
              >
                <HiOutlineArrowsExpand />
              </span>
            </div>
            <div className="flex justify-end">
              {getTotal() == targetTotalAmountBill ? (
                <button
                  onClick={finishSplitBillHandler}
                  className="bg-black text-white rounded-lg px-2 py-1 mr-2"
                >
                  Finish Split Bill
                </button>
              ) : (
                ""
              )}
            </div>
          </div>
        )}
        {/* end tombol finis split bill */}
        <div className="mx-3 mt-2">
          <p className="font-serif text-sm italic opacity-50">
            *make sure the target and grand total are same to finish the split
            bill
          </p>
        </div>
      </div>
    </>
  );
}
