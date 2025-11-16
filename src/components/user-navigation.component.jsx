import React, { useContext } from 'react'
import AnimationWrapper from '../common/page-animation'
import { Link } from 'react-router-dom'
import { userContext } from '../App'
import { removeFromSession } from '../common/session'

const UserNavigationPanel = () => {
    const {
        userAuth: { username },
        setUserAuth,
    } = useContext(userContext)

    const signOutUser = () => {
        removeFromSession('user')
        setUserAuth({ access_token: null })
    }

    return (
        <AnimationWrapper
            className="absolute   z-50"
            transition={{ duration: 0.2 }}
        >
            <nav role="menu" aria-label="User Navigation" className="absolute top-[100%]  w-64 bg-white/80 right-0 dark:bg-grey-900/80 backdrop-blur-lg border border-grey-200 dark:border-gray-700 rounded-2xl shadow-xl flex flex-col py-2">
                <Link
                    to="/editor"
                    className="flex items-center px-6 py-3 hover:bg-grey dark:hover:bg-gray-800 transition rounded-lg"
                    role="menuitem"
                >
                    <i className="fi fi-rr-file-edit text-lg" />
                    <span className="ml-3 text-sm font-medium">Create</span>
                </Link>

                <Link
                    to={`/user/${username}`}
                    className="flex items-center px-6 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition rounded-lg"
                    role="menuitem"
                >
                    <i className="fi fi-rr-user text-lg" />
                    <span className="ml-3 text-sm font-medium">Profile</span>
                </Link>

                <Link
                    to="/dashboard/blogs"
                    className="flex items-center px-6 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition rounded-lg"
                    role="menuitem"
                >
                    <i className="fi fi-rr-dashboard text-lg" />
                    <span className="ml-3 text-sm font-medium">Dashboard</span>
                </Link>

                <Link
                    to="/settings/edit-profile"
                    className="flex items-center px-6 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition rounded-lg"
                    role="menuitem"
                >
                    <i className="fi fi-rr-settings text-lg" />
                    <span className="ml-3 text-sm font-medium">Settings</span>
                </Link>

                <hr className="my-2 border-gray-200 dark:border-gray-700" />

                <button
                    onClick={signOutUser}
                    className="flex items-center px-6 py-3 hover:bg-red-50 dark:hover:bg-red-900 transition rounded-lg text-red-600 dark:text-red-400"
                    role="menuitem"
                >
                    <i className="fi fi-rr-sign-out-alt text-lg" />
                    <span className="ml-3 text-sm font-medium">Sign Out @{username}</span>
                </button>
            </nav>
        </AnimationWrapper>
    )
}

export default UserNavigationPanel
