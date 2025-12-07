// src/pages/EditProfile.jsx

import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../App";
import api from "../common/api";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/Loader";
import InputBox from "../components/Input";
import { Toaster, toast } from "react-hot-toast";
import { UploadImage } from "../common/aws";
import { storeInSession } from "../common/session";
import { io } from "socket.io-client";

const EditProfile = () => {
    const {
        userAuth,
        userAuth: { access_token, id: userId },
        setUserAuth,
    } = useContext(UserContext);

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

                // Update Context and Session
                const updatedUserAuth = {
                    ...userAuth,
                    username: personal_info.username,
                    profile_img: personal_info.profile_img,
                };
                storeInSession("user", JSON.stringify(updatedUserAuth));
                setUserAuth(updatedUserAuth);

                toast.success("Profile updated from another session!");
            }
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [access_token, userId, userAuth, setUserAuth]);

    // ─── Fetch Profile on Mount ─────────────────────────────────────────────────
    useEffect(() => {
        if (!access_token) {
            window.location.href = "/signin";
            return;
        }

        api
            .post(
                "/get-profile",
                { username: userAuth.username }
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
                setLoading(false);
            });
    }, [access_token, userAuth.username]);

    // ─── Re-validate Whenever Fields Change ─────────────────────────────────────
    useEffect(() => {
        const fullnameOK = personalInfo.fullname?.trim().length >= 3;
        const usernameOK = /^[a-zA-Z0-9_]{3,20}$/.test(personalInfo.username);
        const bioOK = personalInfo.bio?.length <= 150;

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

            const res = await api.post(
                "/changeImg",
                body
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
            const { data } = await api.post(
                "/update-profile",
                payload
            );

            // CRITICAL FIX: Update Session and UserContext immediately
            const updatedUserAuth = {
                ...userAuth,
                username: data.username || payload.username, // prefer backend return
                // Check if backend returns more updated fields, but these are safer to assume changed
            };

            storeInSession("user", JSON.stringify(updatedUserAuth));
            setUserAuth(updatedUserAuth);

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
            <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
                <Loader />
            </div>
        );
    }

    return (
        <AnimationWrapper>
            <Toaster position="top-center" />

            <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {/* Futuristic Header */}
                <div className="relative mb-10 text-center">
                    <div className="absolute inset-0 flex items-center justify-center -z-10">
                        <div className="w-64 h-64 bg-cyan-500/20 rounded-full blur-[100px] opacity-50 dark:opacity-20 animate-pulse"></div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-blue-500 to-purple-600 dark:from-cyan-400 dark:via-blue-400 dark:to-purple-400 mb-2">
                        Customize Your Identity
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        Shape how the world sees you on <span className="font-semibold text-gray-800 dark:text-gray-200">Shumse</span>.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT PANEL: Image & Key Info */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col items-center relative overflow-hidden group">
                            {/* Decorative background element */}
                            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500"></div>

                            <div className="relative w-40 h-40 mb-6 mt-4">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                                <img
                                    ref={imgRef}
                                    src={personalInfo.profile_img || "/default-profile.png"}
                                    alt="Profile"
                                    className="w-full h-full object-cover rounded-full border-4 border-white dark:border-zinc-800 shadow-2xl relative z-10"
                                />
                                <div className="absolute bottom-0 right-2 z-20">
                                    <label htmlFor="profileImg" className="cursor-pointer bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 p-3 rounded-full shadow-lg border border-gray-100 dark:border-zinc-700 hover:scale-110 active:scale-95 transition-transform flex items-center justify-center">
                                        <i className="fi fi-rr-camera text-lg leading-none"></i>
                                    </label>
                                    <input
                                        type="file"
                                        name="profileImg"
                                        id="profileImg"
                                        accept=".jpeg,.jpg,.png,.webp,.svg"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </div>
                            </div>

                            <div className="w-full">
                                <button
                                    onClick={handleImgUpload}
                                    disabled={!changedImg}
                                    className={`w-full py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${changedImg
                                            ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:-translate-y-1"
                                            : "bg-gray-100 dark:bg-zinc-800/50 text-gray-400 cursor-not-allowed"
                                        }`}
                                >
                                    <i className="fi fi-rr-cloud-upload"></i>
                                    {changedImg ? "Upload New Photo" : "Upload to Save"}
                                </button>
                            </div>

                            <div className="mt-6 text-center">
                                <p className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-widest font-semibold mb-1">Current User</p>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">@{userAuth.username}</h3>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Form Inputs */}
                    <form onSubmit={handleSave} className="lg:col-span-8 space-y-6">

                        {/* Personal Details Card */}
                        <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                                <i className="fi fi-rr-id-card-clip text-cyan-500"></i> Personal Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <InputBox
                                    name="fullname"
                                    type="text"
                                    label="Full Name"
                                    value={personalInfo.fullname}
                                    onChange={(e) => handleInputChange("fullname", e.target.value)}
                                    className="capitalize"
                                    icon="fi-rr-user"
                                    validation={validFields.fullname}
                                    helper={!validFields.fullname && "Minimum 3 characters required."}
                                />
                                <InputBox
                                    name="username"
                                    type="text"
                                    label="Username"
                                    value={personalInfo.username}
                                    onChange={(e) => handleInputChange("username", e.target.value)}
                                    icon="fi-rr-at"
                                    validation={validFields.username}
                                    helper={!validFields.username && "3-20 characters alphanumeric."}
                                />
                            </div>
                            <div className="mb-6">
                                <InputBox
                                    name="email"
                                    type="email"
                                    label="Email Address"
                                    value={personalInfo.email}
                                    icon="fi-rr-envelope"
                                    validation={true}
                                    readOnly
                                    // Make email look clearly read-only
                                    className="opacity-70"
                                />
                                <p className="text-xs text-gray-500 mt-1 ml-1"><i className="fi fi-rr-lock"></i> Email cannot be changed.</p>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bio</label>
                                    <span className={`text-xs font-bold ${characterLeft < 0 ? 'text-red-500' : 'text-cyan-600'}`}>
                                        {characterLeft} / 150
                                    </span>
                                </div>
                                <textarea
                                    name="bio"
                                    value={personalInfo.bio}
                                    onChange={(e) => {
                                        handleInputChange("bio", e.target.value);
                                        setCharacterLeft(150 - e.target.value.length);
                                    }}
                                    maxLength={150}
                                    placeholder="Tell the world who you are..."
                                    className="w-full h-32 p-4 text-base border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-black/40 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all resize-none dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Social Links Card */}
                        <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                                <i className="fi fi-rr-share text-purple-500"></i> Social Presence
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                {Object.entries({
                                    website: { icon: "fi-rr-globe", label: "Website", placeholder: "https://" },
                                    twitter: { icon: "fi-brands-twitter", label: "Twitter", placeholder: "https://" },
                                    instagram: { icon: "fi-brands-instagram", label: "Instagram", placeholder: "https://" },
                                    facebook: { icon: "fi-brands-facebook", label: "Facebook", placeholder: "https://" },
                                    github: { icon: "fi-brands-github", label: "GitHub", placeholder: "https://" },
                                    linkedin: { icon: "fi-brands-linkedin", label: "LinkedIn", placeholder: "https://" },
                                }).map(([platform, config]) => (
                                    <div key={platform} className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <i className={`fi ${config.icon} text-gray-400 group-focus-within:text-cyan-500 transition-colors text-lg`}></i>
                                        </div>
                                        <input
                                            name={platform}
                                            type="url"
                                            value={socialLinks[platform] || ""}
                                            onChange={(e) => handleSocialChange(platform, e.target.value)}
                                            placeholder={config.label}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all dark:text-white placeholder-gray-400 text-sm"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="px-6 py-2.5 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!formValid || saving}
                                className={`px-10 py-3 rounded-xl font-bold text-white shadow-lg transition-all duration-300 flex items-center gap-2 ${formValid && !saving
                                        ? "bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:scale-105 hover:shadow-blue-500/40"
                                        : "bg-gray-400 dark:bg-zinc-700 cursor-not-allowed opacity-70"
                                    }`}
                            >
                                {saving ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </AnimationWrapper>
    );
};

export default EditProfile;

