import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {

    const auth = getAuth();
    const navigate = useNavigate();
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [passwordConfirm, setPasswordConfirm] = useState<string>('');
    const [error, setError] = useState<string>('');

    function handleAuthenticate(e: FormEvent) {
        e.preventDefault();
        
        if (name.length == 0) {
            setError("Please enter your full name.");
            return;
        }

        if (password !== passwordConfirm) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length == 0) {
            setError("Please provide a password.");
            return;
        }

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                setError(''); // Clear error on success
                
                const toInsert: UserData = {
                    email: email,
                    name: name,
                }
                // Prepare a user record.
                setDoc(doc(db, "users", userCredential.user.uid), toInsert).catch((creationError) => {
                    console.error(`Failed to create new records: ${creationError}`)
                })

                navigate('/profile');
            })
            .catch((firebaseError) => {
                switch (firebaseError.code) {
                    case 'auth/invalid-email':
                        setError('Please enter a valid email address.');
                        break;
                    case 'auth/weak-password':
                        setError('Password should be at least 6 characters long.');
                        break;
                    case 'auth/email-already-in-use':
                        setError('This email address is already in use.');
                        break;
                    default:
                        setError('Failed to create an account. Please try again.');
                        break;
                }
                console.error(firebaseError); // Log the original error for debugging

            });
    }

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="flex flex-col gap-4 p-8 mx-auto max-w-sm w-full shadow-lg border border-gray-200 rounded-2xl items-center">
                <div className="text-2xl">Sign Up</div>
                <form className="flex flex-col gap-4 w-full" onSubmit={handleAuthenticate}>
                    <div className="flex flex-col">
                        <label htmlFor="signup-name" className="mb-1">Full Name</label>
                        <input 
                            id="signup-name" 
                            type="text" 
                            name="signup-name" 
                            className="p-2 border border-gray-300 shadow-sm rounded" 
                            value={name} 
                            onChange={(e) => { setName(e.target.value); setError(''); }} 
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="signup-email" className="mb-1">Email</label>
                        <input 
                            id="signup-email" 
                            type="email" 
                            name="signup-email" 
                            className="p-2 border border-gray-300 shadow-sm rounded" 
                            value={email} 
                            onChange={(e) => { setEmail(e.target.value); setError(''); }} 
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="signup-password" className="mb-1">Password</label>
                        <input
                            id="signup-password"
                            type="password"
                            name="signup-password"
                            className="p-2 border border-gray-300 shadow-sm rounded"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="signup-password-confirm" className="mb-1">Confirm Password</label>
                        <input 
                            id="signup-password-confirm" 
                            type="password"
                            name="signup-password-confirm" 
                            className="p-2 border border-gray-300 shadow-sm rounded"
                            value={passwordConfirm}
                            onChange={(e) => { setPasswordConfirm(e.target.value); setError(''); }}
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button type="submit" className="mt-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer">Submit</button>
                </form>
                <p className="mt-2 text-sm text-gray-600">
                    Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Login here.</Link>
                </p>
            </div>
        </div>
    );
}