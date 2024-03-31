import axios from "axios";
import { useState } from "react";
import {
  confirmAlert,
  errorAlert,
  loadingAlert,
  viewImage,
} from "../helpers/alerts";
import {
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineX,
  HiPlusCircle,
  HiCloudUpload,
  HiChevronDoubleDown,
  HiOutlineArrowsExpand,
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";

const baseUrl = import.meta.env.VITE_BASE_URL;

export default function SplitBillPage() {
  const navigate = useNavigate();
  const [statusAddTax, setStatusAddTax] = useState(false);
  const [taxs, setTaxs] = useState([
    { taxName: "ppn", taxAmount: 11, type: "default" },
  ]);
  const [taxInput, setTaxInput] = useState({
    taxName: "",
    taxAmount: 0,
  });
  const [statusAddItem, setStatusAddItem] = useState(false);
  const [title, setTitle] = useState("");
  const [imgFile, setImgFile] = useState(null);
  const [urlUploadFile, setUrlUploadFile] = useState(null);
  const [idSplitBill, setIdSplitBill] = useState(null);
  const [billItems, setBillItems] = useState([]); // uncomment baris ini kalau aspore sudah bisa dipakai
  const [imageUrl, setImageUrl] = useState(null);
  const [editStatus, setEditStatus] = useState({
    status: false,
    indexItem: null,
  });
  const [addInputItem, setAddInputItem] = useState({
    description: "",
    qty: 0,
    amount: 0,
  });
  const [nextStep, setNextStep] = useState(false);

  const addTaxhandler = (e) => {
    const { name, value } = e.target;
    setTaxInput({ ...taxInput, [name]: value });
  };

  const saveAddTax = () => {
    if (!taxInput.taxAmount || !taxInput.taxAmount) {
      errorAlert("Please input name and amoun tax in %");
      return null;
    }
    let tmpTax;
    if (taxs[0].type == "default") {
      tmpTax = [taxInput];
    } else {
      tmpTax = [...taxs, taxInput];
    }

    setTaxs(tmpTax);
    setTaxInput({
      taxName: "",
      taxAmount: 0,
    });
    setStatusAddTax(false);
  };

  const addItemHandler = (e) => {
    const { name, value } = e.target;
    setAddInputItem({ ...addInputItem, [name]: value });
  };

  const sumbitAddItemHandler = () => {
    if (
      !addInputItem.description ||
      !addInputItem.qty ||
      !addInputItem.amount
    ) {
      errorAlert("Please input Item name, qty and amount");
      return false;
    }
    const tmpAddInput = {
      description: addInputItem.description,
      qty: Number(addInputItem.qty),
      amount: Number(addInputItem.amount),
    };
    const tmpBillItems = [...billItems, tmpAddInput];
    setBillItems(tmpBillItems);
    setStatusAddItem(false);
    setAddInputItem({
      description: "",
      qty: 0,
      amount: 0,
    });
  };

  const [editInput, setEditInput] = useState({
    description: "",
    qty: 0,
    unitPrice: 0,
    amount: 0,
  });

  // coment baris dibawah kalau aspire sudah bisa lagi
  //   const [billItems, setBillItems] = useState([
  //     {
  //       description: "Mie Goreng Jawa",
  //       qty: 1,
  //       unitPrice: 0,
  //       amount: 42500,
  //     },
  //     {
  //       description: "Ice Tea Tawar",
  //       qty: 1,
  //       unitPrice: 0,
  //       amount: 11500,
  //     },
  //     {
  //       description: "Permen Karet",
  //       qty: 1,
  //       unitPrice: 0,
  //       amount: 2000,
  //     },
  //   ]);

  const titleHandler = (e) => {
    setTitle(e.target.value);
  };

  const editHandler = (e) => {
    const { name, value } = e.target;
    setEditInput({ ...editInput, [name]: value });
  };

  const editItem = (index, item) => {
    if (editInput.description) {
      item.description = editInput.description;
    }
    if (editInput.qty) {
      item.qty = Number(editInput.qty);
    }
    if (editInput.amount) {
      item.amount = Number(editInput.amount);
    }

    let tmpBillItems = [...billItems];
    tmpBillItems[index] = item;
    setBillItems(tmpBillItems);
  };

  const handleInputFile = (e) => {
    setImgFile(null);
    const img = e.target.files[0];
    setImgFile(img);
  };

  const handleUploadImage = async (e) => {
    e.preventDefault();
    setIdSplitBill(null);

    try {
      if (!imgFile) {
        throw { name: "File not found", message: "File Image is required" };
      }

      loadingAlert(true);
      let formData = new FormData();
      formData.append("photo", imgFile);

      //   console.log(imgFile, "<<<<<<< img File");
      const response = await axios({
        method: "post",
        url: baseUrl + "/ocr-receipt",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "multipart/form-data",
        },
        data: formData,
      });
      // console.log(response, "<<<<<<<<<<<");
      setUrlUploadFile(response.data.rawData.image);
      setBillItems(response.data.rawData.items);
      setIdSplitBill(response.data.data._id);
      setImageUrl(response.data.rawData.image);
      loadingAlert(false);
    } catch (error) {
      loadingAlert(false);
      if (error.name == "File not found") {
        errorAlert("Please select file first");
        console.log(error);
      } else {
        console.log(error);
      }
    }
  };

  const calculateTotal = () => {
    if (billItems && taxs) {
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

      return arrCalTax[0].toLocaleString("id-ID");
    }
  };

  const goToColaborateSplitBill = async () => {
    try {
      const { isConfirmed } = await confirmAlert("Colaborate bill?");
      if (isConfirmed) {
        const response = await axios({
          method: "put",
          url: baseUrl + "/update-item/" + idSplitBill,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          data: { billItems, title, taxs },
        });
        console.log(response);
        navigate("/split-bill/colaborate/" + idSplitBill);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // console.log(taxs, "<<<<< list tax");

  return (
    <>
      <div className="h-screen mb-72">
        {/* <div className="ml-4 mb-2">
          <h1 className="text-2xl">Prepare your split bill here...</h1>
        </div> */}
        {/* Upload Image File */}
        {!nextStep && (
          <div className="h-full flex items-center justify-center flex-col gap-5">
            <h2 className="font-semibold text-3xl font-mono">
              Upload your bill
            </h2>
            <div className="max-w-md">
              <form className="flex flex-col items-center">
                <label
                  className="mb-1 border-2 p-5 rounded-lg relative"
                  htmlFor="uploadBill"
                >
                  <div className="flex w-72 justify-center">
                    <img
                      src={urlUploadFile ? urlUploadFile : "/bill_icon.png"}
                      alt="icon bill / image bill"
                      className="h-64"
                    />
                  </div>
                </label>
                <input
                  hidden
                  onChange={handleInputFile}
                  type="file"
                  id="uploadBill"
                />
                <p className="italic">{imgFile && imgFile.name}</p>
                {!idSplitBill ? (
                  <button
                    onClick={handleUploadImage}
                    className="mt-1  py-1 rounded-xl font-bold flex justify-center text-6xl text-dua"
                  >
                    <HiCloudUpload />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setNextStep(true);
                    }}
                    className="mt-1 px-4 py-1 bg-black text-white rounded-xl font-bold text-3xl animate-pulse"
                  >
                    <HiChevronDoubleDown />
                  </button>
                )}
              </form>
            </div>
          </div>
        )}
        {/* End upload Image File */}
        {/* Step 2 check bill data and 3 add tax and title */}
        {nextStep && (
          <>
            <div className="mt-20">
              <div className="ml-4 mb-2 mt-4">
                <h2 className="font-semibold text-3xl font-mono flex items-center gap-2">
                  Check bill data{" "}
                  <span
                    onClick={() => {
                      viewImage(imageUrl);
                    }}
                    className="text-2xl opacity-55"
                  >
                    <HiOutlineArrowsExpand />
                  </span>
                </h2>
                <p className="font-serif italic opacity-50">
                  *make sure all bill item apear and qty is proper
                </p>
              </div>
              <div className="ml-8">
                {billItems &&
                  billItems.map((item, i) => {
                    return (
                      <div key={i}>
                        {/* tampilkan item bill */}
                        {editStatus.status && editStatus.indexItem == i ? (
                          ""
                        ) : (
                          <>
                            <div className="grid grid-cols-2">
                              <span>
                                {i + 1}. {item.description}
                              </span>
                              <div className="flex gap-2 justify-between mr-5">
                                <div
                                  onClick={() => {
                                    setEditStatus({
                                      status: true,
                                      indexItem: i,
                                    });
                                  }}
                                  className="flex items-center gap-1 opacity-50"
                                >
                                  <HiOutlinePencil /> edit
                                </div>
                                <div
                                  onClick={() => {
                                    let tmpItems = [...billItems];
                                    tmpItems.splice(i, 1);
                                    setBillItems(tmpItems);
                                    //   console.log(tmpItems);
                                  }}
                                  className="flex items-center gap-1 opacity-50"
                                >
                                  <HiOutlineTrash /> delete
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2">
                              <span className="text-center">
                                Qty: {item.qty}
                              </span>
                              <span id="totalBill">
                                Amount: Rp.{" "}
                                {item.amount.toLocaleString("id-ID")}
                              </span>
                            </div>
                          </>
                        )}
                        {/* end tampilkan item bill */}
                        {/* edit item */}
                        {editStatus.status && editStatus.indexItem == i ? (
                          <div className="">
                            <div className="grid grid-cols-2">
                              <span>Description: </span>
                              <input
                                type="text"
                                name="description"
                                id=""
                                onChange={editHandler}
                                placeholder={item.description}
                                autoComplete="off"
                                className="px-1"
                              />
                            </div>
                            <div className="grid grid-cols-2">
                              <span className="w-10">Qty :</span>
                              <input
                                onChange={editHandler}
                                name="qty"
                                type="number"
                                placeholder={item.qty}
                                autoComplete="off"
                                className="px-1"
                              />
                            </div>
                            <div className="grid grid-cols-2">
                              <span id="totalBill">Amount Rp : </span>
                              <input
                                type="number"
                                name="amount"
                                onChange={editHandler}
                                placeholder={item.amount.toLocaleString(
                                  "id-ID"
                                )}
                                autoComplete="off"
                                className="px-1"
                              />
                            </div>
                            <div
                              onClick={() => {
                                setEditStatus({
                                  status: false,
                                  indexItem: "",
                                });
                              }}
                              className="text-center my-3"
                            >
                              <span
                                onClick={() => {
                                  editItem(i, item);
                                }}
                                className="bg-black px-2 py-1 text-white rounded-lg"
                              >
                                Save Edit
                              </span>
                            </div>
                          </div>
                        ) : (
                          ""
                        )}
                        {/* end edit item */}
                      </div>
                    );
                  })}
                {billItems.length > 0 && (
                  <div className="grid grid-cols-2 mt-2 border-t-2">
                    <span className="font-bold opacity-35">Total Bill : </span>
                    <span className="font-bold">Rp. {calculateTotal()}</span>
                  </div>
                )}
                {statusAddItem && (
                  <div className="flex flex-col gap-1 mr-4">
                    <h1>Add Item</h1>
                    <input
                      type="text"
                      name="description"
                      placeholder="Enter item name"
                      autoComplete="off"
                      className="border pl-1 rounded-lg"
                      onChange={addItemHandler}
                    />
                    <input
                      type="number"
                      name="qty"
                      placeholder="Enter qty"
                      autoComplete="off"
                      className="border pl-1 rounded-lg"
                      onChange={addItemHandler}
                    />
                    <input
                      type="number"
                      name="amount"
                      placeholder="Enter amount"
                      autoComplete="off"
                      className="border pl-1 rounded-lg"
                      onChange={addItemHandler}
                    />
                    <div className="flex justify-center gap-4 text-3xl">
                      <span onClick={sumbitAddItemHandler}>
                        <HiOutlineCheck />
                      </span>
                      <span
                        onClick={() => {
                          setStatusAddItem(!statusAddItem);
                        }}
                      >
                        <HiOutlineX />
                      </span>
                    </div>
                  </div>
                )}
                {/* section tambah tax */}
                {statusAddTax && (
                  <div className="flex gap-2 mt-2">
                    <input
                      className="border w-40 rounded-lg pl-2"
                      type="text"
                      name="taxName"
                      placeholder="Tax Name"
                      autoComplete="off"
                      onChange={addTaxhandler}
                    />
                    {":"}
                    <input
                      className="border w-16 rounded-lg pl-2"
                      type="text"
                      name="taxAmount"
                      autoComplete="off"
                      onChange={addTaxhandler}
                    />
                    {"%"}
                  </div>
                )}
                <div className="flex justify-between mr-5 mt-2 items-start">
                  <div className="">
                    {!statusAddTax && idSplitBill ? (
                      <>
                        <div>
                          <button
                            onClick={() => {
                              setStatusAddTax(!statusAddTax);
                            }}
                            className="border-2 font-bold px-2 text-sm rounded-lg"
                          >
                            + add tax
                          </button>
                          {taxs[0].type ? (
                            <p className="mt-1 opacity-35 italic">
                              *default tax will be 11%
                            </p>
                          ) : (
                            <p className="mt-1 opacity-35 italic">
                              *
                              {taxs.reduce((total, num) => {
                                return (
                                  total + num.taxName + num.taxAmount + "%, "
                                );
                              }, "")}
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      ""
                    )}
                    {statusAddTax ? (
                      <div className="text-2xl flex gap-10 ml-3">
                        <button onClick={saveAddTax}>
                          <HiOutlineCheck />
                        </button>
                        <button
                          onClick={() => {
                            setStatusAddTax(!statusAddTax);
                          }}
                          className="opacity-30"
                        >
                          <HiOutlineX />
                        </button>
                      </div>
                    ) : (
                      ""
                    )}
                  </div>
                  {!statusAddItem && idSplitBill ? (
                    <button
                      onClick={() => {
                        setStatusAddItem(!statusAddItem);
                      }}
                      className="text-4xl"
                    >
                      <HiPlusCircle />
                    </button>
                  ) : (
                    ""
                  )}
                </div>
              </div>
              <div className="ml-4 h-44 mt-4">
                <div className="mb-2 mt-4">
                  <h2 className="font-semibold text-3xl font-mono">Confirm</h2>
                  <p className="font-serif italic opacity-50">
                    *make sure all data is correct, and input title
                  </p>
                </div>
                {billItems.length > 0 && idSplitBill ? (
                  <>
                    <div className="mr-10 border-2 rounded-lg">
                      <input
                        type="text"
                        name="title"
                        placeholder="Enter title bill here"
                        onChange={titleHandler}
                        required
                        className="p-1 w-full"
                      />
                    </div>
                    <div className="text-end mr-10 mt-4">
                      <span
                        onClick={goToColaborateSplitBill}
                        className="bg-black px-4 py-1 text-white rounded-lg font-bold"
                      >
                        Next
                      </span>
                    </div>
                  </>
                ) : (
                  ""
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
