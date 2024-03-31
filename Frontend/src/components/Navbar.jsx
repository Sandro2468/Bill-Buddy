import {
  // HiOutlineReceiptTax,
  HiOutlineLogin,
  HiOutlineUserAdd,
  HiOutlineHome,
  HiOutlineLogout,
  HiPlus,
} from "react-icons/hi";
import { Link, useLocation, useNavigate } from "react-router-dom";

export function TopNavbar() {
  return (
    <>
      <nav
        style={{ backgroundImage: "url(/blank-white.jpg)" }}
        className="flex justify-between px-5 md:px-36 py-2 border-b shadow-lg fixed bg-inherit top-0 w-full z-20"
      >
        <a className="text-3xl font-bold flex items-center font-mono hover:cursor-pointer">
          {/* <HiOutlineReceiptTax /> */}
          <img src="/bill-buddy-png.png" alt="logo" className="h-10 mr-2" />
          Bill
          <span
            className="text-3xl italic font-medium bg-dua text-white px-2 py-1 rounded-lg"
            style={{ alignSelf: "flex-end" }}
          >
            Buddy
          </span>
        </a>

        <div className="hidden sm:flex gap-4 items-center">
          <button className="flex items-center gap-1 text-xl hover:underline underline-offset-8">
            <HiOutlineLogin />
            Login
          </button>
          <div>|</div>
          <button className="flex items-center gap-1 text-xl hover:underline underline-offset-8">
            <HiOutlineUserAdd /> Register
          </button>
        </div>
      </nav>
    </>
  );
}

export function BottNavbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const logoutHandler = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <>
      <nav
        style={{ backgroundImage: "url(/blank-white.jpg)" }}
        className="flex w-full justify-center fixed bottom-0 border-t-2 bg-inherit z-20"
      >
        {location.pathname == "/login" || location.pathname == "/register" ? (
          <div className="flex sm:hidden gap-4 items-center py-2">
            {location.pathname == "/login" ? (
              <Link
                to={"/login"}
                className="flex items-center gap-1 text-xl  py-1 px-3 rounded-xl underline underline-offset-8 font-bold"
              >
                <HiOutlineLogin />
                Login
              </Link>
            ) : (
              <Link
                to={"/login"}
                className="flex items-center gap-1 text-xl  py-1 px-3 rounded-xl"
              >
                <HiOutlineLogin />
                Login
              </Link>
            )}

            <div>|</div>
            {location.pathname == "/register" ? (
              <Link
                to={"/register"}
                className="flex items-center gap-1 text-xl py-1 px-3 rounded-xl underline underline-offset-8 font-bold"
              >
                <HiOutlineUserAdd /> Register
              </Link>
            ) : (
              <Link
                to={"/register"}
                className="flex items-center gap-1 text-xl py-1 px-3 rounded-xl"
              >
                <HiOutlineUserAdd /> Register
              </Link>
            )}
          </div>
        ) : (
          <div className="flex sm:hidden justify-evenly border w-full items-center py-2">
            <Link
              to={"/"}
              className="flex flex-col items-center gap-1 text-xl   rounded-xl "
            >
              <button className="text-3xl">
                <HiOutlineHome />
              </button>
              <span className="text-sm opacity-55">Home</span>
            </Link>
            <Link
              to={"/split-bill/create"}
              className="flex flex-col items-center gap-1 text-xl rounded-xl "
            >
              <button className="text-3xl">
                <HiPlus />
              </button>
              <span className="text-sm opacity-55">Split</span>
            </Link>
            <Link
              to={"/login"}
              onClick={logoutHandler}
              className="flex flex-col items-center gap-1 text-xl  rounded-xl "
            >
              <button className="text-3xl">
                <HiOutlineLogout />
              </button>{" "}
              <span className="text-sm opacity-55">Logout</span>
            </Link>
          </div>
        )}
      </nav>
    </>
  );
}
