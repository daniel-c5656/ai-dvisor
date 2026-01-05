import { useEffect, useState, type FormEvent } from "react"
import { useAuth } from "./useAuth"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "./firebase"
import { useNavigate } from "react-router-dom"


export default function Profile() {

    const [name, setName] = useState<string>("")
    const [email, setEmail] = useState<string>("")
    const [major, setMajor] = useState<string>("")
    const [school, setSchool] = useState<string>("")
    const [error, setError] = useState<string>("")

    const {user} = useAuth()
    const navigate = useNavigate()
    useEffect(() => {
        if (user) {

            const userRef = doc(db, "users", user.uid)

            getDoc(userRef).then((data) => {

                setName(data.get("name"))
                setEmail(data.get("email"))
                const retrievedMajor = data.get("major")
                if (retrievedMajor !== undefined) {
                    setMajor(retrievedMajor)
                }
                const retrievedSchool = data.get("school")
                if (retrievedSchool !== undefined) {
                    setSchool(retrievedSchool)
                }
            })
        }
    }, [user])

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()

        if (name.length == 0) {
            setError("Please enter your full name.")
            return
        }
        if (major.length == 0) {
            setError("Please enter your major.")
            return
        }
        if (school.length == 0) {
            setError("Please select your school.")
            return
        }

        if (user) {
            const userRef = doc(db, "users", user.uid)

            await updateDoc(userRef, {
                name: name,
                major: major,
                school: school
            })

            navigate("/dashboard")
        }
    }

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="flex flex-col gap-4 p-8 mx-auto max-w-xl w-full shadow-lg border border-gray-200 rounded-2xl items-center">
                <div className="text-2xl">Profile</div>
                <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
                    <div className="flex flex-col">

                        <label htmlFor="profile-name" className="mb-1">Full Name</label>
                        <input type="text"
                            id="profile-name"
                            name="profile-name"
                            className="p-2 border border-gray-300 shadow-sm rounded"
                            value={name}
                            onChange={(e) => {setName(e.target.value)}}
                        
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="user-email" className="mb-1">Email</label>
                        <input type="text"
                            id="user-email"
                            name="user-email"
                            className="p-2 border border-gray-300 shadow-sm rounded bg-gray-200"
                            value={email}
                            onChange={(e) => {setEmail(e.target.value)}}
                            disabled
                            
                        />
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="major" className="mb-1">Major</label>
                        <select className="p-2 border border-gray-300 shadow-sm rounded"
                                id="major" 
                                name="major" 
                                value={major} 
                                onChange={(e) => {setMajor(e.target.value)}}>
                            <option value="">--Please choose an option--</option>
                            <option value="computerscience">Computer Science</option>
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="school" className="mb-1">School</label>
                        <select className="p-2 border border-gray-300 shadow-sm rounded" id="school" name="school" value={school} onChange={(e) => {setSchool(e.target.value)}}>
                            <option value="">--Please choose an option--</option>
                            <option value="usc">University of Southern California (USC)</option>
                        </select>
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button type="submit" className="mt-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer">Save</button>
                </form>
            </div>
        </div>
    )
}