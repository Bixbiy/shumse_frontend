// ProtectedRoute.jsx
import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { UserContext } from '../App';
import { toast } from 'react-toastify';
import { Toaster } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles = ['admin', 'editor'] }) => {
    const { userAuth } = useContext(UserContext);
    const role = userAuth?.role;

    if (!userAuth?.access_token) {
        return <Navigate to="/signin" replace />;
    }

    if (!allowedRoles.includes(role)) {
        toast(
            <div>
                <p>Only editors are allowed to create posts.</p>
                <p className="mt-1">
                    You can request editor access by sending us a message from the{' '}
                    <Link
                        to="/contact"
                        className="text-blue-600 underline"
                    >
                        contact page
                    </Link>.
                </p>
            </div>,
            {
                autoClose: 5000,
                closeButton: true,
            }
        );
        return <Navigate to="/" replace />;
    }

    return <> <Outlet />
        <Toaster />
    </>;
};

export default ProtectedRoute;