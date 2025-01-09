import { useEffect, useState } from "react";
import "./login.css";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { RoundedUser } from "~utils/Icons";

const Form = ({ onSubmit, setState, state, loading }) => {
    const disableButton = !state.userName || state.password.length < 4 || loading;
    return (
        <form onSubmit={onSubmit} className="">
            <div>
                <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
                <div className="relative">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-1 pointer-events-none">
                        <RoundedUser />
                    </div>
                    <input disabled={loading} onChange={e => setState(prev => ({ ...prev, userName: e.target.value }))} type="email" pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$" id="default-search" className="input" placeholder="Enter your email" required />
                </div>
            </div>
            <div>
                <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
                <div className="relative">
                    <input onChange={e => setState(prev => ({ ...prev, password: e.target.value }))} type={state?.showPassword ? "text" : "password"} id="default-search" className="input prefix rounded-md" placeholder="Password" required />
                    <div className="text-white absolute end-2.5 bottom-2.5 focus:ring-4 focus:outline-none  font-medium rounded-lg text-sm">
                        {state?.showPassword ? <IoEyeOutline onClick={() => setState(prev => ({ ...prev, showPassword: false }))} color="black" size={20} /> : <IoEyeOffOutline onClick={() => setState(prev => ({ ...prev, showPassword: true }))} color="black" size={20} />}
                    </div>
                </div>
            </div>
            <div className="flex justify-between pt-3 px-2" >
                <div className="checkbox flex gap-1" >
                    <input disabled={loading}  id="remember-me" type="checkbox" />
                    <label htmlFor="remember-me" >Remember Me</label>
                </div>
                <div className="forgot-pass text-blue-500" >
                    <a target="_blank" href="https://adilo.bigcommand.com/forgot-password" >Forgot password?</a>
                </div>
            </div>
            <div className={`pt-4`} >
                <button disabled={disableButton} type="submit" className={`tab w-full text-base font-semibold active text-white bg-[#0DABD8] text-black"}`}>
                    {loading ? <div className="loader" ></div> : <p>{"Log In"}</p>}
                </button>
            </div>
            <div className={`pt-4 flex align-center justify-center gap-1 pb-4`} >
                {<> Don't have an account <a className="text-blue-500 m-0 cursor-pointer" target="_blank" href="https://adilo.com/join" >Sign up</a> </>}
            </div>
        </form>
    )
}

const LoginForm = ({setUserDetails }) => {
    const [state, setState] = useState({
        userName: '',
        forgetEmail: '',
        password: '',
        showPassword: false,
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const authenticateEmail = async (email) => {
        try {
            const response = await fetch(`${process.env.PLASMO_PUBLIC_ADILO_API}/check-email`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email })
            })
            const data = await response.json()
            return data
        } catch (error) {
            throw new Error(error)
        }
    }

    const fetchUser = async user => {
        try {
            const response = await fetch(`${process.env.PLASMO_PUBLIC_ADILO_API}/user`, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.access_token}`
                }
            })
            const data = await response.json()
            console.log("data user", data)
            return data
        }catch(error){
            throw new Error(error.message || "User is invalid")
        }
    }

    const handleLoginSubmit = async (e) => {
        e.preventDefault()
        console.log("State", state)
        setLoading(true)
        try {
            const data = await authenticateEmail(state.userName)
            if (data.result === 'success') {
                try {
                    const response = await fetch(`${process.env.PLASMO_PUBLIC_ADILO_API}/login`, {
                        method: 'POST',
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ email: state.userName, password: state.password })
                    })
                    const data = await response.json()
                    if (data.user_id) {
                        const userData = await fetchUser(data)
                        const userDetails = {
                            access_token: data.access_token,
                            current_plan: data.current_plan,
                            user_id: data.user_id,
                            first_name: userData.first_name,
                            last_name: userData.last_name,
                            plan_name: userData.plan_name,
                            name: userData.name,
                            email: userData.email,
                            billing_status: userData.billing_status,
                            avtar: userData.photo_url
                        }
                        setUserDetails(userDetails)
                        // await chrome.storage.local.set({  "isLoggedIn": true })
                        setLoading(false)
                    } else {
                        setLoading(false)
                        setError(data?.message || "Invalid username Or password")
                    }
                } catch (error) {
                    setLoading(false)
                    throw new Error(error)
                }
            } else {
                setLoading(false)
                throw new Error(data?.result || "Invalid username Or password")
            }
        } catch (error) {
            setLoading(false)
            console.log("Error", error)
        }
        // await chrome.storage.local.set({ "isLoggedIn": true })
    }

    return (
        <div className="mt-3 px-8 pt-2 pb-0" >
            <div className="tabs mb-3">
                <button className={`tab active text-base text-white bg-[#0DABD8]`}>
                    Log In
                </button>
                <a target="_blank" className={`tab text-black text-base`} href="https://adilo.com/join"  >
                    Sign Up
                </a>
            </div>
            <p className="welcome" >Welcome!</p>
            {!!error && <p className="error capitalize text-center text-red-500 text-base pl-1">{error}</p>}
            {/* Tab Contents */}
            <div className="tabs-container">
                <div
                    className={`tab-content active`}
                >
                    <Form loading={loading} onSubmit={handleLoginSubmit} state={state} setState={setState} />
                </div>
                <div
                    className={`tab-content`}
                >
                </div>
            </div>
        </div>
    );
};

export default LoginForm;