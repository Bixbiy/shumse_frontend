// src/pages/EditProfile.jsx

import { useContext, useEffect, useRef, useState } from "react";
import { userContext } from "../App";
import axios from "axios";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import InputBox from "../components/input.component";
import { Toaster, toast } from "react-hot-toast";
import { UploadImage } from "../common/aws";
import { storeInSession } from "../common/session";
import { io } from "socket.io-client";

const EditProfile = () => {
    const {
        userAuth,
        userAuth: { access_token, id: userId },
        setUserAuth,
    } = useContext(userContext);

    // ─── State ────────────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [personalInfo, setPersonalInfo] = useState({
        fullname: "",
        email: "",
        username: "",
        bio: "",
        profile_img: "",
    });
    const [socialLinks, setSocialLinks] = useState({
        twitter: "",
        instagram: "",
        facebook: "",
        github: "",
        linkedin: "",
        website: "",
    });
    const [characterLeft, setCharacterLeft] = useState(150);
    const [validFields, setValidFields] = useState({
        fullname: false,
        username: false,
        bio: true,
    });
    const [formValid, setFormValid] = useState(false);
    const [changedImg, setChangedImg] = useState(null);

    const imgRef = useRef();
    const socketRef = useRef();

    // ─── Socket.IO: Connect & Listen ─────────────────────────────────────────── 
    useEffect(() => {
        if (!access_token) return;

        // 1) Connect to Socket.IO server
        socketRef.current = io(import.meta.env.VITE_SERVER_DOMAIN, {
            auth: {
                token: `Bearer ${access_token}`,
            },
        });

        // 2) Join this user's specific room so we only get updates for our own profile
        socketRef.current.emit("joinProfileRoom", { userId });

        // 3) Listen for real-time "profileUpdated" events
        socketRef.current.on("profileUpdated", (updatedData) => {
            if (updatedData._id === userId) {
                const { personal_info, social_links } = updatedData;
                setPersonalInfo({
                    fullname: personal_info.fullname,
                    email: personal_info.email,
                    username: personal_info.username,
                    bio: personal_info.bio,
                    profile_img: personal_info.profile_img,
                });
                setSocialLinks({
                    twitter: social_links.twitter || "",
                    instagram: social_links.instagram || "",
                    facebook: social_links.facebook || "",
                    github: social_links.github || "",
                    linkedin: social_links.linkedin || "",
                    website: social_links.website || "",
                });
                setCharacterLeft(150 - (personal_info.bio?.length || 0));
                toast.success("Your profile was updated elsewhere, refreshing view.");
            }
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [access_token, userId]);

    // ─── Fetch Profile on Mount ─────────────────────────────────────────────────
    useEffect(() => {
        if (!access_token) {
            window.location.href = "/signin";
            return;
        }

        axios
            .post(
                `${import.meta.env.VITE_SERVER_DOMAIN}/get-profile`,
                { username: userAuth.username },
                {
                    headers: { Authorization: `Bearer ${access_token}` },
                }
            )
            .then(({ data }) => {
                const { personal_info, social_links = {} } = data;
                setPersonalInfo({
                    fullname: personal_info.fullname,
                    email: personal_info.email,
                    username: personal_info.username,
                    bio: personal_info.bio,
                    profile_img: personal_info.profile_img,
                });
                setSocialLinks({
                    twitter: social_links.twitter || "",
                    instagram: social_links.instagram || "",
                    facebook: social_links.facebook || "",
                    github: social_links.github || "",
                    linkedin: social_links.linkedin || "",
                    website: social_links.website || "",
                });
                setCharacterLeft(150 - (personal_info.bio?.length || 0));
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to load profile:", err);
                toast.error("Failed to load profile. Please try again.");
            });
    }, [access_token, userAuth.username]);

    // ─── Re-validate Whenever Fields Change ─────────────────────────────────────
    useEffect(() => {
        const fullnameOK = personalInfo.fullname.trim().length >= 3;
        const usernameOK = /^[a-zA-Z0-9_]{3,20}$/.test(personalInfo.username);
        const bioOK = personalInfo.bio.length <= 150;

        setValidFields({ fullname: fullnameOK, username: usernameOK, bio: bioOK });
        setFormValid(fullnameOK && usernameOK && bioOK);
    }, [personalInfo]);

    // ─── Handlers ──────────────────────────────────────────────────────────────── 
    const handleInputChange = (field, value) => {
        setPersonalInfo((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSocialChange = (platform, value) => {
        setSocialLinks((prev) => ({
            ...prev,
            [platform]: value,
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        imgRef.current.src = URL.createObjectURL(file);
        setChangedImg(file);
    };

    const handleImgUpload = async (e) => {
        e.preventDefault();
        if (!changedImg) {
            toast.error("Please choose an image first.");
            return;
        }
        const toastId = toast.loading("Uploading image...");
        try {
            // Upload via backend which returns { url, public_id }
            const uploadResult = await UploadImage(changedImg);
            if (!uploadResult || !uploadResult.url) {
                throw new Error("Upload failed: no URL returned");
            }

            // Optimistically update the local UI to show the uploaded image immediately
            const prevProfileImg = personalInfo.profile_img;
            setPersonalInfo((prev) => ({ ...prev, profile_img: uploadResult.url }));

            // Inform backend of new URL. Include alternative keys the server might expect.
            const body = {
                url: uploadResult.url,
                profile_img: uploadResult.url,
            };
            if (uploadResult.public_id) {
                body.public_id = uploadResult.public_id;
                body.publicId = uploadResult.public_id;
                body.cloudinary_id = uploadResult.public_id;
            }

            const res = await axios.post(
                `${import.meta.env.VITE_SERVER_DOMAIN}/changeImg`,
                body,
                { headers: { Authorization: `Bearer ${access_token}` } }
            );

            // Update userAuth and session using backend's returned profile_img if available,
            // otherwise fall back to the optimistic URL we already set.
            const newProfileImg = res?.data?.profile_img || uploadResult.url;
            const updatedUserAuth = {
                ...userAuth,
                profile_img: newProfileImg,
            };
            storeInSession("user", JSON.stringify(updatedUserAuth));
            setUserAuth(updatedUserAuth);

            toast.dismiss(toastId);
            setChangedImg(null);
            toast.success("Profile image updated!");

            // ─ Emit "forceProfileRefresh" so backend re-broadcasts our entire updated profile
            socketRef.current.emit("forceProfileRefresh", { userId });
        } catch (err) {
            console.error(err);
            // revert optimistic UI update on failure
            setPersonalInfo((prev) => ({ ...prev, profile_img: prev.profile_img }));
            toast.dismiss(toastId);
            toast.error("Failed to update image.");
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (loading) {
            return toast.error("Loading data, please wait.");
        }
        if (!formValid) {
            return toast.error("Please fix validation errors before saving.");
        }
        setSaving(true);

        // Build a payload exactly matching backend expectations
        const payload = {
            username: personalInfo.username.trim(),
            fullname: personalInfo.fullname.trim(),
            bio: personalInfo.bio.trim(),
            social_links: {
                twitter: socialLinks.twitter.trim(),
                instagram: socialLinks.instagram.trim(),
                facebook: socialLinks.facebook.trim(),
                github: socialLinks.github.trim(),
                linkedin: socialLinks.linkedin.trim(),
                website: socialLinks.website.trim(),
            },
        };

        try {
            await axios.post(
                `${import.meta.env.VITE_SERVER_DOMAIN}/api/v1/update-profile`,
                payload,
                {
                    headers: { Authorization: `Bearer ${access_token}` },
                }
            );
            toast.success("Profile updated successfully!");

            // Emit “forceProfileRefresh” so backend re-broadcasts “profileUpdated”
            socketRef.current.emit("forceProfileRefresh", { userId });
        } catch (err) {
            console.error("Update failed:", err);

            // If the server returned a 422 with an array of validation messages…
            if (err.response?.status === 422 && Array.isArray(err.response.data.errors)) {
                console.log("Validation errors from server:", err.response.data.errors);
                err.response.data.errors.forEach((message) => {
                    toast.error(message);
                });
            } else {
                // Otherwise, show a generic or single‐error message
                const msg =
                    err.response?.data?.error ||
                    "An unexpected error occurred while saving.";
                toast.error(msg);
            }
        } finally {
            setSaving(false);
        }

    };

    // ─── Render ─────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <AnimationWrapper>
                <Toaster position="top-center" />
                <Loader />
            </AnimationWrapper>
        );
    }

    return (
        <AnimationWrapper  >
            <Toaster position="top-center" />

            <form onSubmit={handleSave} className="max-w-3xl  mx-auto px-4 py-10 sm:px-6">
                <div className="bg-white border-4 dark:bg-black/20 shadow-xl rounded-3xl overflow-hidden backdrop-blur-xl ring-1 ring-cyan-100/30">
                    <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-6 sm:p-8">
                        <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>
                        <p className="text-cyan-100 text-sm mt-1">Craft your online identity</p>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* ─── Profile Image ───────────────────────────────────────────── */}
                        <div className="flex justify-center">
                            <div className="relative group w-32 h-32 sm:w-40 sm:h-40">
                                <img
                                    ref={imgRef}
                                    src={personalInfo.profile_img || "/default-profile.png"}
                                    alt="Profile"
                                    className="w-full h-full object-cover rounded-full border-4 border-white shadow-lg group-hover:scale-105 transition"
                                />
                                <label
                                    htmlFor="profileImg"
                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center rounded-full cursor-pointer transition"
                                >
                                    <i className="fi fi-rr-camera text-white text-xl mb-1"></i>
                                    <span className="text-white text-sm">Change</span>
                                    <input
                                        type="file"
                                        name="profileImg"
                                        id="profileImg"
                                        accept=".jpeg,.jpg,.png,.webp,.svg"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </label>
                            </div>
                        </div>
                        <button
                            onClick={handleImgUpload}
                            disabled={!changedImg}
                            className={`btn-dark mt-5 center  lg:w-[50%] px-10 ${changedImg ? "" : "opacity-50 cursor-not-allowed"
                                }`}
                        >
                            Upload Image
                        </button>

                        {/* ─── Personal Info Inputs ─────────────────────────────────────── */}
                        <div className="grid sm:grid-cols-2 gap-6">
                            <InputBox
                                name="fullname"
                                type="text"
                                label="Full Name"
                                value={personalInfo.fullname}
                                onChange={(e) => handleInputChange("fullname", e.target.value)}
                                className="capitalize"
                                icon="fi-rr-user"
                                validation={validFields.fullname}
                                helper={
                                    validFields.fullname
                                        ? ""
                                        : "Full name must be at least 3 letters."
                                }
                            />
                            <InputBox
                                name="email"
                                type="email"
                                label="Email"
                                value={personalInfo.email}
                                icon="fi-rr-envelope"
                                validation={true}
                                readOnly
                            />
                            <InputBox
                                name="username"
                                type="text"
                                label="Username"
                                value={personalInfo.username}
                                onChange={(e) => handleInputChange("username", e.target.value)}
                                icon="fi-rr-at"
                                validation={validFields.username}
                                helper={
                                    validFields.username
                                        ? ""
                                        : "3–20 chars; letters, numbers, or underscore only."
                                }
                            />
                        </div>

                        {/* ─── Bio ──────────────────────────────────────────────────────────   */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                                Bio
                            </label>
                            <textarea
                                name="bio"
                                value={personalInfo.bio}
                                onChange={(e) => {
                                    handleInputChange("bio", e.target.value);
                                    setCharacterLeft(150 - e.target.value.length);
                                }}
                                maxLength={150}
                                placeholder="Describe yourself in 150 characters"
                                className={`w-full h-36 p-3 border rounded-xl shadow-sm bg-white/70 focus:ring-2 focus:ring-cyan-500 resize-none ${!validFields.bio ? "border-red-400" : ""
                                    }`}
                            />
                            {!validFields.bio && (
                                <p className="text-xs text-red-500 mt-1">
                                    Bio must be 150 characters or fewer.
                                </p>
                            )}
                            <p className="text-xs mt-1 text-right text-cyan-600">
                                {characterLeft}/150
                            </p>
                        </div>

                        {/* ─── Social Links ───────────────────────────────────────────────── */}
                        <div>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-3">
                                Social Links
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Object.entries({
                                    twitter: "fi fi-brands-twitter",
                                    instagram: "fi fi-brands-instagram",
                                    facebook: "fi fi-brands-facebook",
                                    github: "fi fi-brands-github",
                                    linkedin: "fi fi-brands-linkedin",
                                    website: "fi fi-rr-globe",
                                }).map(([platform, icon]) => (
                                    <div key={platform} className="flex items-center space-x-3">
                                        <i className={`${icon} text-xl text-cyan-500`}></i>
                                        <input
                                            name={platform}
                                            type="url"
                                            value={socialLinks[platform] || ""}
                                            onChange={(e) =>
                                                handleSocialChange(platform, e.target.value)
                                            }
                                            placeholder={`${platform}.com/username`}
                                            className="flex-1 p-2 rounded-lg bg-white/80 border focus:ring-cyan-500 focus:ring-2"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ─── Save Button ───────────────────────────────────────────────── */}
                        <div className="pt-6 text-right">
                            <button
                                type="submit"
                                disabled={!formValid || saving}
                                className={`px-8 py-3 rounded-xl text-white font-bold transition-all duration-300 ${formValid && !saving
                                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:scale-105 shadow-md"
                                    : "bg-gray-400 cursor-not-allowed"
                                    }`}
                            >
                                {saving ? "Saving…" : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </AnimationWrapper>
    );
};

export default EditProfile;
