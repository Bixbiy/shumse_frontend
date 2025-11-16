import toast, { Toaster } from "react-hot-toast";
import AnimationWrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import { useContext, useRef, useState } from "react";
import axios from "axios";
import { userContext } from "../App";

const ChangePassword = () => {
    const formRef = useRef();
    const {
        userAuth: { access_token },
    } = useContext(userContext);
    const [loading, setLoading] = useState(false);

    const PassRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,20}$/;

    const updateHandle = async (e) => {
        e.preventDefault();
        const form = formRef.current;
        const currentPassword = form.currentPassword.value.trim();
        const newPassword = form.newPassword.value.trim();

        if (!currentPassword || !newPassword) {
            return toast.error("Please fill in all the fields.");
        }
        if (!PassRegex.test(currentPassword) || !PassRegex.test(newPassword)) {
            return toast.error(
                "Password must be 6–20 chars, with at least one special char, one digit, one uppercase & one lowercase letter."
            );
        }
        if (currentPassword === newPassword) {
            return toast.error("New password must differ from the current one.");
        }

        setLoading(true);
        const loadingToast = toast.loading("Updating password…");

        try {
            const res = await axios.post(
                `${import.meta.env.VITE_SERVER_DOMAIN}/change-password`,
                { currentPassword, newPassword },
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        "Content-Type": "application/json",
                    },
                    // never throw on HTTP errors—let us handle them:
                    validateStatus: () => true,
                }
            );

            toast.dismiss(loadingToast);

            if (res.status >= 200 && res.status < 300) {
                toast.success(res.data.message);
                form.reset();
            } else {
                // surface backend error
                toast.error(res.data.error || `Error ${res.status}: please try again.`);
            }
        } catch (networkErr) {
            // only network / CORS / timeout errors land here
            console.error("Network error:", networkErr);
            toast.dismiss(loadingToast);
            toast.error("Network error. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimationWrapper>
            <Toaster />
            <form ref={formRef} onSubmit={updateHandle}>
                <h1 className="max-md:hidden">Update Password</h1>
                <div className="py-10 w-full md:max-w-[400px] flex flex-col gap-5">
                    <InputBox
                        name="currentPassword"
                        type="password"
                        className="profile-edit-input"
                        placeholder="Current Password"
                        icon="fi-rr-unlock"
                    />
                    <InputBox
                        name="newPassword"
                        type="password"
                        className="profile-edit-input"
                        placeholder="New Password"
                        icon="fi-rr-unlock"
                    />
                    <button
                        type="submit"
                        className={`btn-dark px-10 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={loading}
                    >
                        {loading ? "Updating…" : "Update Password"}
                    </button>
                </div>
            </form>
        </AnimationWrapper>
    );
};

export default ChangePassword;
