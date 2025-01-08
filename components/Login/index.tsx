import { useEffect, useState } from "react";
import "./login.css";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { RoundedUser } from "~utils/Icons";

const clientId = '93MyrkvkXURMu8Otd0xda9cKIersXV8X'
const connection = 'Username-Password-Authentication'
const domain = 'dev-avzj5r1tnyppqkol.us.auth0.com'
const audience = 'https://extention-kpmhhbfkoncghnknlokeklgdlekmnigo.com/api'
const clientSecret = '2JEYU7DaxMqxZRdHFMMGgtPgs5ZMQsast3Iq2Bhc71qXmOHC042BMKrL6MyV5jzz'

const Form = ({ onSubmit, setState, state, type, setActiveTab, loading }) => {
    const isLoginForm = type === 'login'
    const validatePassword = (password) => {
        const minLength = password.length >= 8;
        const lowerCase = /[a-z]/.test(password);
        const upperCase = /[A-Z]/.test(password);
        const number = /\d/.test(password);
        const specialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
        // Ensure at least one lowercase letter is present
        return minLength && lowerCase && upperCase && number && specialChar;
    };

    const disableButton = isLoginForm ? !state.userName || !state.password || !state.isValidPassword || loading :  !state.userName || !state.password || !state?.confirmPassword || !state.isValidPassword || !state.isPasswordMatched || loading
    return (
        <form id={type} onSubmit={onSubmit} className="">
            <div>
                <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
                <div className="relative">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-1 pointer-events-none">
                        <RoundedUser />
                    </div>
                    <input onChange={e => setState(prev => ({ ...prev, userName: e.target.value }))} type="email" pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$"  id="default-search" className="input" placeholder="Enter your email" required />
                </div>
            </div>
            <div>
                <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
                <div className="relative">
                    <input onChange={e => setState(prev => ({ ...prev, password: e.target.value, isValidPassword: validatePassword(e.target.value) }))} type={state?.showPassword ? "text" : "password"} id="default-search" className="input prefix rounded-md" placeholder="Password" required />
                    <div className="text-white absolute end-2.5 bottom-2.5 focus:ring-4 focus:outline-none  font-medium rounded-lg text-sm">
                        {state?.showPassword ? <IoEyeOutline onClick={() => setState(prev => ({ ...prev, showPassword: false }))} color="black" size={20} /> : <IoEyeOffOutline onClick={() => setState(prev => ({ ...prev, showPassword: true }))} color="black" size={20} />}
                    </div>
                </div>
                {!state.isValidPassword && (
                            <p className="error text-red-500 text-[12px] pl-1">password must have at least 8 characters, including 1 Uppercase, 1 lowercase, 1 special character and 1 number</p>
                )}
            </div>
            {!isLoginForm && (
                <div>
                    <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
                    <div className="relative">
                        <input onChange={e => setState(prev => ({ ...prev, confirmPassword: e.target.value }))} type={state?.showConfirmPassword ? "text" : "password"} id="default-search-Confirm" className="input prefix rounded-md" placeholder="Confirm Password" required />
                        <div className="text-white absolute end-2.5 bottom-2.5 focus:ring-4 focus:outline-none  font-medium rounded-lg text-sm">
                            {state?.showConfirmPassword ? <IoEyeOutline onClick={() => setState(prev => ({ ...prev, showConfirmPassword: false }))} color="black" size={20} /> : <IoEyeOffOutline onClick={() => setState(prev => ({ ...prev, showConfirmPassword: true }))} color="black" size={20} />}
                        </div>
                    </div>
                    {!state.isPasswordMatched && (
                            <p className="error text-red-500 text-[12px] pl-1">confirm password do not match</p>
                    )}
                </div>
            )}
            {isLoginForm && <div className="flex justify-between pt-3 px-2" >
                <div className="checkbox flex gap-1" >
                    <input id="remember-me" type="checkbox" />
                    <label htmlFor="remember-me" >Remember Me</label>
                </div>
                <div className="forgot-pass text-blue-500" >
                    <a target="_blank" href="#" >Forgot password?</a>
                </div>
            </div>}
            <div className={`pt-4`} >
                <button disabled={disableButton} type="submit" className={`tab w-full text-base font-semibold active text-white bg-[#0DABD8] text-black"}`}>
                   {loading ? <div className="loader" ></div> : <p>{isLoginForm ? "Log In" : "Register"}</p>} 
                </button>
                {/* <button onClick={logoutAuth0} type="button" className={`tab w-full text-base font-semibold active text-white bg-[#0DABD8] text-black"}`}>
                Log Out
            </button> */}
            </div>
            <div className={`pt-${isLoginForm ? 4 : 2} flex align-center justify-center gap-1 pb-4`} >
                {isLoginForm ?
                    <> Don't have an account <p onClick={() => setActiveTab('register')} className="text-blue-500 m-0 cursor-pointer" >Sign up</p> </>
                    : <> Already have an account <p onClick={() => setActiveTab('login')} className="text-blue-500 m-0 cursor-pointer" >Sign in</p> </>}
            </div>
        </form>
    )
}

const LoginForm = ({ setIsLoggedIn, activeTab, setActiveTab }) => {
    const [state, setState] = useState({
        userName: '',
        forgetEmail: '',
        password: '',
        showPassword: false,
        isValidPassword:  true
    })

    const [registerState, setRegisterState] = useState({
        userName: '',
        password: '',
        confirmPassword: '',
        showConfirmPassword: false,
        userImage: null,
        isPasswordMatched: true,
        isValidPassword:  true
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [info, setInfo] = useState('')

    useEffect(() => {
        if(!!registerState.password && !!registerState.confirmPassword) {
            setRegisterState(prev => ({...prev, isPasswordMatched: registerState.password === registerState.confirmPassword  }))
        }
    }, [registerState.password, registerState.confirmPassword])

    const fetchAuthConfig = async () => {
        // const response = await fetch(chrome.runtime.getURL("auth_config.json"));
        return {
            "domain": "dev-avzj5r1tnyppqkol.us.auth0.com",
            "clientId": "93MyrkvkXURMu8Otd0xda9cKIersXV8X",
            "audience": "https://extention-kpmhhbfkoncghnknlokeklgdlekmnigo.com/api"
        }
    };

    const getRandomBytes = () => {
        const rndArray = new Uint8Array(44);
        window.crypto.getRandomValues(rndArray);
        return rndArray;
    };

    const buf2Base64 = (buffer: ArrayBuffer) => {
        return btoa(String.fromCharCode(...new Uint8Array(buffer)))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "");
    };

    const getParameterByName = (name: string, url: string) => {
        name = name.replace(/[\[\]]/g, "\\$&");
        const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return "";
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    };

    const windowSha256 = async (buffer: string) => {
        const bytes = new TextEncoder().encode(buffer);
        return await window.crypto.subtle.digest("SHA-256", bytes);
    };

    const getUserInfo = async (token) => {
        try {
            const response = await fetch(`https://${domain}/userinfo`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({access_token: token}),
            });
            const userData = await response.json()
            console.log("userDatauserData", userData)
            setIsLoggedIn(true)
            await chrome.storage.local.set({"userInfo": userData})
        } catch(error){
            console.log("error", error)
        }
    }

    const authenticateUser = async (email: string, password: string) => {
        const body = {
            grant_type: "password",
            username: email,
            password: password,
            client_id: clientId,
            client_secret: clientSecret,
            scope: "openid profile email",// Add other scopes as needed
            audience: audience,
            connection: connection,
        };
        setLoading(true)
        try {
            // Send the request to Auth0's /oauth/token endpoint
            const response = await fetch(`https://${domain}/oauth/token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            // Parse the response
            const result = await response.json();
            if (response.ok) {
                // Authentication successful, access token is returned
                console.log("Access Token:", result.access_token);
                await chrome.storage.local.set({ "accesss_token": result.access_token, "id_token": result.id_token })
                await getUserInfo(result.access_token)
                setLoading(false)
                // Use the access token for further API requests
            } else {
                setLoading(false)
                console.error("Authentication failed:", result);
                setError(result.error_description)
            }
        } catch (error) {
            setLoading(false)
            setError(error.message)
            console.error("Error during authentication:", error);
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault()
        console.log("State", state)
        console.log("redirectUrl1212", chrome.identity.getRedirectURL())
        // const redirectUrl = chrome.identity.getRedirectURL();
        // // const redirectUrl = "https://kpmhhbfkoncghnknlokeklgdlekmnigo.chromiumapp.org/";
        // const config = await fetchAuthConfig();
        // console.log("configconfig", config)
        // // Generate code verifier and code challenge
        // const verifier = buf2Base64(getRandomBytes());
        // const shaHash = await windowSha256(verifier);
        // const codeChallenge = buf2Base64(shaHash);
        // // Build the authorization URL
        // const options = {
        //     client_id: config.clientId,
        //     redirect_uri: redirectUrl,
        //     response_type: "code",
        //     audience: config.audience,
        //     scope: "openid",
        //     code_challenge: codeChallenge,
        //     code_challenge_method: "S256",
        // };
        // const queryString = new URLSearchParams(options).toString();
        // const authUrl = `https://${config.domain}/authorize?${new URLSearchParams(options).toString()}`;
        // // const authUrl = `https://${config.domain}/authorize?${queryString}`;
        // console.log(options,"authUrlauthUrl", authUrl)
        // // Launch WebAuthFlow
        // const resultUrl = await new Promise<string | null>((resolve, reject) => {
        //     chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (url) => {
        //     if (chrome.runtime.lastError) {
        //         console.log("Erroor", chrome.runtime.lastError.message)
        //         reject(chrome.runtime.lastError.message);
        //     } else {
        //         resolve(url);
        //     }
        //     });
        // });
        // console.log("resultUrlresultUrl OPOPOP" ,resultUrl)
        // if (resultUrl) {
        //     const code = getParameterByName("code", resultUrl);
        //     if (!code) {
        //         console.error("Authorization code not found");
        //         return;
        //     }
        //      // Exchange the code for a token
        //     const body = {
        //         redirect_uri: redirectUrl,
        //         grant_type: "authorization_code",
        //         client_id: config.clientId,
        //         code_verifier: verifier,
        //         code,
        //     };
        //     console.log("bodybody", body)
        //     const response = await fetch(`https://${config.domain}/oauth/token`, {
        //         method: "POST",
        //         headers: { "Content-Type": "application/json" },
        //         body: JSON.stringify(body),
        //       });
        //     const result = await response.json();
        //     console.log("resultresult", result)
        //     if (result.access_token) {
        //         // setAccessToken(result.access_token);
        //         console.log("Access Token:", result.access_token);
        //     } else {
        //         console.error("Failed to get access token");
        //     }
        // }

        authenticateUser(state.userName, state.password);
    }

    useEffect(() => {
        setError('')
        setLoading(false)
    }, [activeTab])

    const handleRegister = async e => {
        setInfo('')
        setError('')
        e.preventDefault()
        const body = {
            client_id: clientId,
            email: registerState.userName,
            password: registerState.password,
            connection: connection,
            // picture: 'url-pointing-towards-image'
        };
        setLoading(true)
        try {
            // Send the request to Auth0's /oauth/token endpoint
            const response = await fetch(`https://${domain}/dbconnections/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            // Parse the response
            const result = await response.json();
            if(result?.email){
                if(!result?.email_verified) {
                    setInfo('Please check your email and verify it.')
                }
            } else {
                setError(result.description)
            }
            setLoading(false)
        } catch(error){
            console.log("error", error)
            setLoading(false)
            setError(error.message)
        }
    }

    async function exchangeAuthorizationCodeForTokens(authorizationCode, redirectUri) {
        chrome.runtime.sendMessage({ type: "FROM_LOGIN_SUCCESS_CALL_2" })
        const tokenEndpoint = `https://dev-avzj5r1tnyppqkol.us.auth0.com/oauth/token`;

        const body = {
            grant_type: "authorization_code",
            client_id: "93MyrkvkXURMu8Otd0xda9cKIersXV8X",
            client_secret: clientSecret, // Include only if required by Auth0
            code: authorizationCode,
            redirect_uri: redirectUri,
        };

        try {
            const response = await fetch(tokenEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            const tokenData = await response.json();

            if (!response.ok) {
                throw new Error(tokenData.error_description || "Token exchange failed");
            }

            console.log("Access Token:", tokenData.access_token);
            console.log("ID Token:", tokenData.id_token);
            chrome.runtime.sendMessage({ type: "FROM_LOGIN_SUCCESS_CALL_1" })
            // Save tokens securely (optional)
            chrome.storage.local.set({ accessToken: tokenData.access_token, idToken: tokenData.id_token }, () => {
                console.log("Tokens saved to Chrome storage");
                setIsLoggedIn(true)
            });
        } catch (error) {
            console.error("Error exchanging tokens:", error);
        }
    }

    const logout = async () => {
        await chrome.identity.clearAllCachedAuthTokens();
        // setAccessToken(null);
        console.log("Logged out");
    };

    function logoutAuth0() {
        const redirectUrl = chrome.identity.getRedirectURL();
        const logoutUrl = `https://dev-avzj5r1tnyppqkol.us.auth0.com/v2/logout?client_id=93MyrkvkXURMu8Otd0xda9cKIersXV8X&returnTo=${redirectUrl}`;

        // Clear tokens from Chrome storage
        chrome.storage.local.remove(["accessToken", "idToken", "isLoggedIn", "isLoogedIn"], () => {
            console.log("Tokens cleared");
        });

        // Open logout URL in a new tab or window
        chrome.tabs.create({ url: logoutUrl });
    }

    return (
        <div className="mt-3 px-8 pt-2 pb-0" >
            <div className="tabs mb-3">
                <button
                    className={`tab ${activeTab === "login" ? "active text-base text-white bg-[#0DABD8]" : "text-black text-base"}`}
                    onClick={() => setActiveTab("login")}
                >
                    Log In
                </button>
                <button
                    className={`tab ${activeTab === "register" ? "active text-base text-white bg-[#0DABD8]" : "text-black text-base"}`}
                    onClick={() => setActiveTab("register")}
                >
                    Sign Up
                </button>
            </div>
            <p className="welcome" >Welcome!</p>
            {!!error && <p className="error capitalize text-center text-red-500 text-base pl-1">{error}</p>}
            {!!info && <p className="capitalize text-center text-blue-500 text-base pl-1">{info}</p>}
            {/* Tab Contents */}
            <div className="tabs-container">
                <div
                    className={`tab-content ${activeTab === "login" ? "active" : ""
                        }`}
                >
                    <Form loading={loading} setActiveTab={setActiveTab} type="login" onSubmit={handleLoginSubmit} state={state} setState={setState} />
                </div>
                <div
                    className={`tab-content ${activeTab === "register" ? "active" : ""
                        }`}
                >
                    <Form  loading={loading} setActiveTab={setActiveTab} type="register" onSubmit={handleRegister} state={registerState} setState={setRegisterState} />
                </div>
            </div>
        </div>
    );
};

export default LoginForm;