import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "./firebase";
import { addDoc, collection, deleteDoc, doc, DocumentReference, getDocs, serverTimestamp, Timestamp } from "firebase/firestore";
import { useAuth } from "./useAuth";

interface CoursePlan {
    id: string;
    title: string;
    courseCount: number;
    modified: string;
}

interface QuickLink {
    id: number;
    title: string;
    link: string;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const { user } = useAuth(); // Use the custom hook
    const [coursePlans, setCoursePlans] = useState<CoursePlan[]>([]);
    const quickLinks: QuickLink[] = [
        {
            id: 1,
            title: "MyUSC",
            link: "https://my.usc.edu"
        },
        {
            id: 2,
            title: "USC Classes",
            link: "https://classes.usc.edu"
        },
        {
            id: 3,
            title: "Advise USC",
            link: "https://uscmeyestro.my.site.com/adviseusc/s/"
        },
        {
            id: 4,
            title: "OASIS",
            link: "https://my.usc.edu/portal/oasis/oasisbridge.php"
        },
        {
            id: 5,
            title: "Brightspace",
            link: "https://brightspace.usc.edu/d2l/login"
        },
        {
            id: 6,
            title: "Web Registration",
            link: "https://my.usc.edu/portal/oasis/webregbridge.php"
        }
    ]

    async function handleAddPlan() {
        const planName = prompt("Enter a name for your plan.")

        if (planName === null) {
            return
        }

        if (user) { // Check for user existence
            const reference: DocumentReference = await addDoc(collection(db, 'users', user.uid, 'coursePlans'), {
                courseCount: 0,
                modified: serverTimestamp(),
                title: planName
            })

            navigate(`/plans/${reference.id}`)
        }
    }

    async function handleDeletePlan(planId: string) {
        
        if (confirm("Are you sure you want to delete this plan?")) {
            if (user) {

                const reference: DocumentReference = doc(db, 'users', user.uid, "coursePlans", planId)

                deleteDoc(reference).then(() => {
                    location.reload()
                }).catch((error) => {
                    console.error(`Failed to delete plan ${planId}: ${error}`)
                })
            }
        }
    }

    useEffect(() => {
        if (user) {
            const planCollectionRef = collection(db, "users", user.uid, "coursePlans");

            getDocs(planCollectionRef)
                .then((data) => {
                    const plans = data.docs.map(doc => {
                        const docData = doc.data();
                        const modifiedTimestamp = docData.modified as Timestamp;
                        return {
                            id: doc.id,
                            title: docData.title,
                            courseCount: docData.courses.length,
                            modified: modifiedTimestamp
                                ? modifiedTimestamp.toDate().toLocaleString()
                                : "N/A",
                        };
                    });
                    setCoursePlans(plans as CoursePlan[]);
                })
                .catch((error) => {
                    console.error("Error fetching course plans: ", error);
                });
        }
    }, [user]);

    return (
        <>
            <div className="m-10 text-6xl">Dashboard</div>
            <div className="grid grid-flow-col grid-cols-3 p-10 gap-5">
                <div className="col-span-2 outline rounded">
                    <div className="flex justify-between items-center p-4">
                        <h2 className="text-2xl font-bold text-left">Course Plans</h2>
                        <button
                            onClick={handleAddPlan}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
                        >
                            + New Plan
                        </button>
                    </div>
                    <div className="grid grid-cols-4 gap-4 p-4 text-left">
                        <div className="font-bold">Title</div>
                        <div className="font-bold">Courses</div>
                        <div className="font-bold">Last Modified</div>
                        <div className="font-bold text-right">Actions</div>
                    </div>
                    {coursePlans.length > 0 ? (
                        coursePlans.map((plan) => (
                            <div key={plan.id} className="grid grid-cols-4 gap-4 p-4 border-t text-left items-center">
                                <div><Link className="text-blue-500 underline" to={`/plans/${plan.id}`}>{plan.title}</Link></div>
                                <div>{plan.courseCount}</div>
                                <div>{plan.modified}</div>
                                <div className="text-right">
                                    <button
                                        onClick={() => {handleDeletePlan(plan.id)}}
                                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded cursor-pointer"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-center">No course plans found.</div>
                    )}
                </div>
                <div className="col-span-1 outline rounded">
                    <div className="flex justify-between items-center p-4">
                        <h2 className="text-2xl font-bold text-left">Quick Links</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-10 p-5 text-center">
                        {
                            quickLinks.map((link) => (
                                <a key={link.id} className="col-span-1 bg-red-400 text-white hover:bg-red-600 py-4 rounded font-bold" href={link.link} target="_blank">{link.title}</a>                                
                            ))
                        }
                    </div>
                </div>
            </div>
        </>
    );
}