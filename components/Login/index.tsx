import { useState } from "react";
import "./login.css";
import { FaUserCircle } from "react-icons/fa";
import { IoEyeOffOutline } from "react-icons/io5";

const LoginForm = () => {
    const [activeTab, setActiveTab] = useState("login");

    return (
        <div className="mt-4 p-8 pt-2" >
            <div className="tabs mb-4">
                <button
                    className={`tab ${activeTab === "login" ? "active text-white bg-[#0DABD8]" : "text-black"}`}
                    onClick={() => setActiveTab("login")}
                >
                    Log In
                </button>
                <button
                    className={`tab ${activeTab === "register" ? "active text-white bg-[#0DABD8]" : "text-black"}`}
                    onClick={() => setActiveTab("register")}
                >
                    Sign Up
                </button>
            </div>
            <p className="welcome" >Welcome!</p>
            {/* Tab Contents */}
            <div className="tabs-container">
                <div
                    className={`tab-content ${activeTab === "login" ? "active" : ""
                        }`}
                >
                    <form className="">
                        <div>
                            <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 start-0 flex items-center ps-2 pointer-events-none">
                                    <FaUserCircle size={28} />
                                </div>
                                <input type="text" id="default-search" className="input" placeholder="Search Mockups, Logos..." required />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
                            <div className="relative">
                                <input type="text" id="default-search" className="input prefix" placeholder="Password" required />
                                <div className="text-white absolute end-2.5 bottom-2.5 focus:ring-4 focus:outline-none  font-medium rounded-lg text-sm">
                                    <IoEyeOffOutline color="black" size={20} />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div
                    className={`tab-content ${activeTab === "register" ? "active" : ""
                        }`}
                >
                    Tab 2 content.
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
