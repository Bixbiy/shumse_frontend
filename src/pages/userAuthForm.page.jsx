import React, { useContext, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import googleIcon from "../imgs/google.png";
import AnimationWrapper from "../common/page-animation";
import { Toaster, toast } from "react-hot-toast";
import { storeInSession } from "../common/session";
import { UserContext } from "../App";
import { authWithGoogle } from "../common/firebase";
import Navbar from "../components/Navbar";
import api, { setAuthToken } from "../common/api";

const UserAuthForm = ({ type }) => {
    const { userAuth, setUserAuth } = useContext(UserContext);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullname, setFullname] = useState("");
    const access_token = userAuth?.access_token || null;
    const navigate = useNavigate();

    // REFACTOR: This function now uses the 'api' client, which handles
    // the '/api/v1' prefix and auth headers automatically.
    const userAuthThroughServer = async (serverRoute, formData) => {
        setLoading(true);

        try {
            // FIX: Use the 'api' client. No full URL, headers, or 'withCredentials' needed.
            const { data } = await api.post(serverRoute, formData);

            // CRITICAL FIX: Set the auth token in memory for the API interceptor
            setAuthToken(data.user.access_token);

            storeInSession("user", JSON.stringify(data.user));
            setUserAuth(data.user);
            toast.success(data.message || "Success!");
            navigate("/"); // Redirect to home page
        } catch (error) {
            const errorMessage =
                error.response?.data?.error ||
                error.message ||
                "Something went wrong. Please try again.";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Google Authentication Handler
    const handleGoogleAuth = async (e) => {
        e.preventDefault();
        try {
            const user = await authWithGoogle();
            if (user) {
                const googleUser = {
                    fullname: user.displayName,
                    email: user.email,
                    googleId: user.uid,
                    profile_img: user.photoURL,
                };
                // This will now correctly call '/api/v1/google-auth'
                await userAuthThroughServer("/google-auth", googleUser);
            }
        } catch (err) {
            toast.error("Google sign-in failed. Please try again.");
            console.error(err);
        }
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        let serverRoute = type === "sign-in" ? "/signin" : "/signup";

        // Regular expressions for validation
        const emailRegex = /^[\w-.]+@[\w-]+\.[a-z]{2,}$/i;
        const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

        // Validate form fields
        if (type === "sign-up" && (!fullname || fullname.length < 3 || fullname.length > 20)) {
            return toast.error("Full name must be between 3 and 20 characters long.");
        }
        if (!email || !emailRegex.test(email)) {
            return toast.error("Invalid email format.");
        }
        if (!password || !passwordRegex.test(password)) {
            return toast.error(
                "Password must be at least 8 characters long with one number, one lowercase, and one uppercase letter."
            );
        }

        const formData = { email, password };
        if (type === "sign-up") formData.fullname = fullname;

        // This will now correctly call '/api/v1/signin' or '/api/v1/signup'
        userAuthThroughServer(serverRoute, formData);
    };

    // Redirect if user is already authenticated
    if (access_token) {
        return <Navigate to="/" />;
    }

    return (
        <AnimationWrapper keyValue={type}>
            <Navbar />
            <section className="h-cover flex items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-600 dark:from-gray-800 dark:to-gray-900 py-10 px-4 sm:px-6 lg:px-8">
                <Toaster />
                <form
                    id="formElement"
                    // UI UPGRADE: Added blur, more padding, and rounded corners
                    className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl"
                    onSubmit={handleSubmit}
                >
                    <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-8">
                        {type === "sign-in" ? "Welcome back!" : "Join Us Today!"}
                    </h1>

                    {type !== "sign-in" && (
                        <div className="mb-4">
                            <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Full Name
                            </label>
                            <input
                                id="fullname"
                                name="fullname"
                                type="text"
                                placeholder="Full Name"
                                value={fullname}
                                onChange={(e) => setFullname(e.target.value)}
                                required
                                // UI UPGRADE: Softer corners, dark mode
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-indigo-600 dark:focus:border-indigo-600"
                            />
                        </div>
                    )}

                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email Address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            // UI UPGRADE: Softer corners, dark mode
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-indigo-600 dark:focus:border-indigo-600"
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                // UI UPGRADE: Softer corners, dark mode
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-indigo-600 dark:focus:border-indigo-600"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                            >
                                {showPassword ? (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 text-gray-500 dark:text-gray-400"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                        <path
                                            fillRule="evenodd"
                                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 text-gray-500 dark:text-gray-400"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                                            clipRule="evenodd"
                                        />
                                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent btn-dark rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </div>
                        ) : (
                            type === "sign-in" ? "Sign In" : "Sign Up"
                        )}
                    </button>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleAuth}
                        className="w-full flex justify-center items-center gap-3 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                        <img src={googleIcon} className="w-5 h-5" alt="Google" />
                        Continue with Google
                    </button>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {type === "sign-in" ? (
                                <>
                                    Don't have an account?{" "}
                                    <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                                        Join us today
                                    </Link>
                                </>
                            ) : (
                                <>
                                    Already a member?{" "}
                                    <Link to="/signin" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                                        Sign in here
                                    </Link>
                                </>
                            )}
                        </p>
                    </div>
                </form>
            </section>
        </AnimationWrapper>
    );
};

export default UserAuthForm;