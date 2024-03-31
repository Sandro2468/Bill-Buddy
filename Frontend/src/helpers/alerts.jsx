import Swal from "sweetalert2";

export const loadingAlert = (status) => {
  if (status) {
    Swal.fire({
      title: "Uploading your bill",
      html: "Please wait...",
      showConfirmButton: false,
    });
  }
};

export const confirmAlert = async (message) => {
  const result = await Swal.fire({
    title: message,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes",
  });
  return result;
};

export const errorAlert = (message) => {
  Swal.fire({
    icon: "error",
    title: "Oops...",
    text: message,
  });
};

export const notifAlert = (message) => {
  Swal.fire({
    position: "top-end",
    icon: "success",
    title: message,
    showConfirmButton: false,
    timer: 1500,
  });
};

export const viewImage = (linkImg) => {
  Swal.fire({
    imageUrl: linkImg,
    imageWidth: 400,
    imageHeight: 700,
    imageAlt: "Image Bill",
  });
};
