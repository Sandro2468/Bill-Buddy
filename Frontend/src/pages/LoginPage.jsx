import { useState } from "react";
import { BottNavbar, TopNavbar } from "../components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
// import { setDefaultAutoSelectFamily } from "net";

const baseUrl = import.meta.env.VITE_BASE_URL;

export default function LoginPage() {
  const [inputUser, setInputUser] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();

  const inputHandler = (e) => {
    const { name, value } = e.target;
    setInputUser({ ...inputUser, [name]: value });
  };

  const loginHandler = async (e) => {
    e.preventDefault();
    try {
      const response = await axios({
        method: "post",
        url: baseUrl + "/login",
        data: inputUser,
      });
      localStorage.setItem("access_token", response.data.data.access_token);
      navigate("/");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <div className="h-screen">
        <TopNavbar />
        <BottNavbar />
        <main className="h-full flex justify-center items-center">
          <div className="shadow-xl p-5 border-2 rounded-lg w-80 md:w-96">
            <form className="space-y-2 md:space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="off"
                    onChange={inputHandler}
                    required
                    className="appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="off"
                    onChange={inputHandler}
                    required
                    className="appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  onClick={loginHandler}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-satu focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Sign in
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center w-full">
                  <p className="text-center w-full ml-2 block text-sm text-gray-900">
                    Dont have account?{" "}
                    <Link to={"/register"} className="font-bold">
                      register here
                    </Link>
                  </p>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </>
  );
}

