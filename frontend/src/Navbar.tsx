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
        <>
            <nav className="flex justify-end pb-3 pt-3 pr-2 border-b gap-2">
                <div className="">
                    <NavLink className="p-2 rounded-md bg-cyan-400 hover:bg-cyan-600" to='/'>AI-dvisor</NavLink>
                </div>

                {/* Wait until auth state is determined before rendering links */}
                {!loading && (
                    <>
                        {!user ? (
                            <>
                                <div className="">
                                    <NavLink className='p-2 rounded-md bg-blue-400 hover:bg-blue-600' to="/login">Login</NavLink>
                                </div>
                                <div className="">
                                    <NavLink className='p-2 rounded-md bg-green-400 hover:bg-green-600' to="/signup">Signup</NavLink>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="">
                                    <NavLink className='p-2 rounded-md bg-blue-400 text-white hover:bg-blue-600' to="/dashboard">Dashboard</NavLink>
                                </div>                            
                                <div className="">
                                    <a className='p-2 rounded-md bg-red-400 text-white hover:bg-red-600 cursor-pointer' onClick={handleSignOut}>Logout</a>
                                </div>
                                <div className="">
                                    <NavLink className='p-2 rounded-md bg-amber-400 hover:bg-amber-600 text-white' to="/profile">Profile</NavLink>
                                </div>
                            </>
                        )}
                    </>
                )}
            </nav>
        </>
    );
}