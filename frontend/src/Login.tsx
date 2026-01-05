import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {

    const navigate = useNavigate()
    const auth = getAuth();
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');

    function handleAuthenticate(e: FormEvent) {
        e.preventDefault();

        if (!email || !password) {
            setError("Please enter both email and password.");
            return;
        }

        signInWithEmailAndPassword(auth, email, password)
            .then(() => {
                setError(''); // Clear error on success
                navigate('/dashboard')
            })
            .catch((firebaseError) => {
                switch (firebaseError.code) {
                    case 'auth/user-not-found':
                    case 'auth/invalid-credential':
                    case 'auth/wrong-password':
                        setError('Invalid email or password.');
                        break;
                    case 'auth/invalid-email':
                        setError('Please enter a valid email address.');
                        break;
                    default:
                        setError('Failed to log in. Please try again.');
                        break;
                    }
            });
    }

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="flex flex-col gap-4 p-8 mx-auto max-w-sm w-full shadow-lg border border-gray-200 rounded-2xl items-center">
                <div className="text-2xl">Login</div>
                <form className="flex flex-col gap-4 w-full" onSubmit={handleAuthenticate}>
                    <div className="flex flex-col">
                        <label htmlFor="login-email" className="mb-1">Email</label>
                        <input 
                            id="login-email" 
                            type="email" 
                            name="login-email" 
                            className="p-2 border border-gray-300 shadow-sm rounded" 
                            value={email} 
                            onChange={(e) => { setEmail(e.target.value); setError(''); }} 
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="login-password" className="mb-1">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            name="login-password"
                            className="p-2 border border-gray-300 shadow-sm rounded"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button type="submit" className="mt-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer">Submit</button>
                </form>
                <p className="mt-2 text-sm text-gray-600">
                    Don't have an account? <Link to="/signup" className="text-blue-500 hover:underline">Sign up here.</Link>
                </p>
            </div>
        </div>
    );
}