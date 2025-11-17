import { Link } from "react-router-dom";
import { userContext } from "../App"; // <-- FIX: Lowercase 'u'
import { useContext } from "react";
import { removeFromSession } from "../common/session";
import { motion } from "framer-motion";

const UserNavigationPanel = () => {

    const { userAuth: { username, role }, setUserAuth } = useContext(userContext); // <-- FIX: Lowercase 'u'

    const signOutUser = () => {
        removeFromSession("user");
        setUserAuth({ access_token: null });
    }

    return (
        <motion.div
            className="bg-white dark:bg-dark-grey absolute right-0 border border-gray-200 dark:border-grey w-60 overflow-hidden rounded-lg shadow-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
        >
            {
                role === 'editor' &&
                <Link to="/editor" className="flex gap-2 link md:hidden pl-8 py-4">
                    <i className="fi fi-rr-file-edit"></i>
                    <p>Write</p>
                </Link>
            }
            
            <Link to={`/user/${username}`} className="flex gap-2 link pl-8 py-4">
                <i className="fi fi-rr-user"></i>
                <p>Profile</p>
            </Link>

            {/* --- NEW COMMUNITY LINK --- */}
            <Link to="/community" className="flex gap-2 link pl-8 py-4 md:hidden">
                <i className="fi fi-rr-users-alt"></i>
                <p>Community</p>
            </Link>
            {/* --- END NEW LINK --- */}

            <Link to="/dashboard/blogs" className="flex gap-2 link pl-8 py-4">
                <i className="fi fi-rr-layout-fluid"></i>
                <p>Dashboard</p>
            </Link>
            <Link to="/settings/edit-profile" className="flex gap-2 link pl-8 py-4">
                <i className="fi fi-rr-settings"></i>
                <p>Settings</p>
            </Link>
            
            <span className="absolute border-t border-gray-200 dark:border-grey w-full"></span>
            
            <button 
                className="text-left p-4 hover:bg-gray-50 dark:hover:bg-grey/50 w-full pl-8 py-4"
                onClick={signOutUser}
            >
                <h1 className="font-bold text-red text-lg">Sign Out</h1>
                <p className="text-dark-grey dark:text-gray-400">@{username}</p>
            </button>
            
        </motion.div>
    )
}

export default UserNavigationPanel;