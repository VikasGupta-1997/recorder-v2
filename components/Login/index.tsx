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
                    <input value={state.userName} disabled={loading} onChange={e => setState(prev => ({ ...prev, userName: e.target.value }))} type="email" id="default-search" className="input" placeholder="Enter your email" required />
                </div>
            </div>
            <div>
                <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
                <div className="relative">
                    <input value={state.password} onChange={e => setState(prev => ({ ...prev, password: e.target.value }))} type={state?.showPassword ? "text" : "password"} id="default-search" className="input prefix rounded-md" placeholder="Password" required />
                    <div className="text-white absolute end-2.5 bottom-2.5 focus:ring-4 focus:outline-none  font-medium rounded-lg text-sm">
                        {state?.showPassword ? <IoEyeOutline onClick={() => setState(prev => ({ ...prev, showPassword: false }))} color="black" size={20} /> : <IoEyeOffOutline onClick={() => setState(prev => ({ ...prev, showPassword: true }))} color="black" size={20} />}
                    </div>
                </div>
            </div>
            <div className="flex justify-between pt-3 px-2" >
                <div className="checkbox flex gap-1" >
                    <input disabled={loading} id="remember-me" type="checkbox" />
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

const LoginForm = () => {
    const [state, setState] = useState({
        userName: 'softwaredev@zestgeek.com',
        forgetEmail: '',
        password: 'Adilo@0987',
        showPassword: false,
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        chrome.runtime.onMessage.addListener(
            async function (message) {
                console.log("Login", message)
                switch (message.type) {
                    case 'login_loading': {
                        setLoading(message.state)
                    }
                        break;
                    case 'login_error': {
                        setError(message.error)
                    }
                        break;
                }
            }
        )
    }, [])

    const handleLoginSubmit = async (e) => {
        e.preventDefault()
        chrome.runtime.sendMessage({ type: "START_LOGIN", state })
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