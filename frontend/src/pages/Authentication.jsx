import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Authentication = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(false);
  const [inputValue, setInputValue] = useState({
    password: "",
    username: "",
    name: "" 
  });
  
  // Destructure
  const { password, username, name } = inputValue;

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setInputValue({
      ...inputValue,
      [name]: value,
    });
  };

  const handleError = (err) =>
    toast.error(err, {
      position: "bottom-left",
    });
  const handleSuccess = (msg) =>
    toast.success(msg, {
      position: "bottom-left",
    });

  const { login, register } = useAuth(); // Destructure from context

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Adjust logic for name field if signing up
    if (!isLogin && !name) {
       // Assuming name is required for signup based on User model
    }

    try {
      if (isLogin) {
          await login(username, password);
          handleSuccess("Login Successful");
      } else {
          await register(name, username, password);
          handleSuccess("Registration Successful");
      }
      setTimeout(() => {
          navigate("/home");
      }, 1000);
    } catch (error) {
      console.log(error);
      handleError(error.response?.data?.message || "Something went wrong/Check Credentials");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Brand Area */}
        <div className="text-center mb-8">
          <div className="inline-block">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {isLogin ? "Welcome back" : "Get started"}
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">
              {isLogin
                ? "Login to continue to your account"
                : "Create your account in seconds"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Body */}
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={name}
                    onChange={handleOnChange}
                    required={!isLogin}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    placeholder="John Doe"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={username}
                    onChange={handleOnChange}
                    required={!isLogin}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    placeholder="Choose a username"
                  />
                </div>
                </>
              )}

               {isLogin && <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={username}
                    onChange={handleOnChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    placeholder="Enter your username"
                  />
                </div>
                }

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={handleOnChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                  placeholder="Enter your password"
                />
              </div>

              {isLogin && (
                <div className="flex items-center justify-end">
                  <a
                    href="#"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot password?
                  </a>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
              >
                {isLogin ? "Login" : "Create account"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="mx-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
                Or continue with
              </span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Google Button - Placeholder logic */}
            <button
              onClick={() => toast.info("Google Auth not implemented in this demo")}
              className="w-full border-2 border-gray-200 py-3 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
            >
             <span className="text-gray-700 font-medium group-hover:text-gray-900">
                Sign in with Google
              </span>
            </button>
          </div>

          {/* Footer */}
          <div className="py-4 px-6 sm:px-8 bg-gray-50 border-t border-gray-100">
            <p className="text-sm text-center text-gray-600">
              {isLogin ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="text-blue-600 font-semibold hover:text-blue-700 hover:underline"
                    onClick={() => setIsLogin(false)}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="text-blue-600 font-semibold hover:text-blue-700 hover:underline"
                    onClick={() => setIsLogin(true)}
                  >
                    Log in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
        
        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link 
            to="/"
            className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200"
          >
            ← Back to Home
          </Link>
        </div>
        
        <ToastContainer />
      </div>
    </div>
  );
};

export default Authentication;
