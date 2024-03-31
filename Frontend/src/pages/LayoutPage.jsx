import { Outlet } from "react-router-dom";
import { BottNavbar, TopNavbar } from "../components/Navbar";

export default function LayoutPage() {
  return (
    <>
      <TopNavbar />
      <Outlet />
      <BottNavbar />
    </>
  );
}
