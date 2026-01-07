import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {

    const navigate = useNavigate()
    const auth = getAuth();
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [message, setMessage] = useState<string>('');

    function handleForgotPassword() {
        if (!email) {
            setError("Please enter your email address to reset your password.");
            setMessage('');
            return;
        }

        sendPasswordResetEmail(auth, email)
            .then(() => {
                setMessage("Password reset email sent! Check your inbox.");
                setError('');
            })
            .catch((firebaseError) => {
                switch (firebaseError.code) {
                    case 'auth/user-not-found':
                    case 'auth/invalid-email':
                        setError('No user found with this email or invalid email format.');
                        break;
                    default:
                        setError('Failed to send reset email. Please try again.');
                        break;
                    }
                setMessage('');
            });
    }

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
                            onChange={(e) => { setEmail(e.target.value); setError(''); setMessage(''); }} 
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
                            onChange={(e) => { setPassword(e.target.value); setError(''); setMessage(''); }}
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    {message && <p className="text-green-500 text-sm text-center">{message}</p>}
                    <button type="submit" className="mt-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer">Submit</button>
                </form>
                <div className="flex flex-col items-center gap-2 mt-2">
                    <p className="text-sm text-gray-600">
                        Don't have an account? <Link to="/signup" className="text-blue-500 hover:underline">Sign up here.</Link>
                    </p>
                    <button 
                        type="button" 
                        onClick={handleForgotPassword} 
                        className="text-sm text-blue-500 hover:underline cursor-pointer"
                    >
                        Forgot password?
                    </button>
                </div>
            </div>
        </div>
    );
}