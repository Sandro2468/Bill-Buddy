import { createBrowserRouter, redirect } from "react-router-dom";

// import page
import LayoutPage from "./pages/LayoutPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SplitBillPage from "./pages/SplitBillPage";
import ColaborateSplitBill from "./pages/ColaborateSplitBill";
import Payment from "./pages/PaymentPage";

const notLogin = () => {
  if (!localStorage.getItem("access_token")) {
    return redirect("/login");
  }
  return null;
};

const hasLogin = () => {
  if (localStorage.getItem("access_token")) {
    return redirect("/");
  }
  return null;
};

const router = createBrowserRouter([
  {
    element: <LayoutPage />,
    loader: notLogin,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/split-bill/create",
        element: <SplitBillPage />,
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
    loader: hasLogin,
  },
  {
    path: "/register",
    element: <RegisterPage />,
    loader: hasLogin,
  },
  {
    path: "/payment/:billId/:memberId",
    element: <Payment />,
    // loader: hasLogin,
  },
  {
    path: "/split-bill/colaborate/:billId",
    element: <ColaborateSplitBill />,
  },
]);

export default router;
