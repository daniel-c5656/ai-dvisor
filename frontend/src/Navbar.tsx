import { NavLink, useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { useAuth } from "./useAuth";

export default function Navbar() {
    const { user, loading } = useAuth();
    const auth = getAuth();
    const navigate = useNavigate()

    function handleSignOut() {
        if (confirm("Are you sure you would like to sign out?")) {
            signOut(auth).then(() => {
                navigate("/login")
            }).catch(() => {
                console.error("Failed to log out");
            });
        }
    }

    return (
        <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-md">
            <NavLink className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors duration-200" to='/'>
                AI-dvisor
            </NavLink>

            <div className="flex items-center space-x-6"> {/* Increased space-x for more spacing */}
                {/* Wait until auth state is determined before rendering links */}
                {!loading && (
                    <>
                        {!user ? (
                            <>
                                <NavLink className='text-gray-700 hover:text-blue-600 transition-colors duration-200' to="/login">Login</NavLink>
                                <NavLink className='text-gray-700 hover:text-blue-600 transition-colors duration-200' to="/signup">Signup</NavLink>
                            </>
                        ) : (
                            <>
                                <NavLink className='text-gray-700 hover:text-blue-600 transition-colors duration-200' to="/dashboard">Dashboard</NavLink>
                                <NavLink className='text-gray-700 hover:text-blue-600 transition-colors duration-200' to="/profile">Profile</NavLink>
                                <a className='text-gray-700 hover:text-red-600 transition-colors duration-200 cursor-pointer' onClick={handleSignOut}>Logout</a>
                            </>
                        )}
                    </>
                )}
            </div>
        </nav>
    );
}