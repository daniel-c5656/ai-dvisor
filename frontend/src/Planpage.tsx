import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { doc, updateDoc, onSnapshot, getDoc, arrayRemove, deleteField } from "firebase/firestore";
import { db } from './firebase.tsx';
import { Calendar, momentLocalizer, type Event as CalendarEvent } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from "./useAuth.tsx";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Setup for react-big-calendar
const localizer = momentLocalizer(moment);

const BACKEND_URL: string = "https://ai-dvisor-fastapi-75390045716.us-west1.run.app"

interface InstructorName {
    firstName: string
    lastName: string
}

interface CourseSection {
    sectionId: string;
    courseCode: string;
    courseName: string;
    type: string;
    days: string[];
    startTime: string;
    endTime: string;
    location: string;
    units: number;
    instructors: InstructorName[]
}

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'agent';
}

export default function Planpage() {
    const navigate = useNavigate();
    const { planId } = useParams<{ planId: string }>();
    const { user } = useAuth();
    const [planTitle, setPlanTitle] = useState<string>("");
    const [view, setView] = useState<string>("calendar");
    const [courses, setCourses] = useState<CourseSection[]>([])
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState<string>('');
    const [isAgentTyping, setIsAgentTyping] = useState<boolean>(false);
    const [historyLoaded, setHistoryLoaded] = useState<boolean>(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isAgentTyping]);
    // const [courses, setCourses] = useState<CourseSection[]>([
    //     {
    //         sectionId: "31009",
    //         courseCode: "EE109",
    //         courseName: "Introduction to Embedded Systems",
    //         type: "Lecture",
    //         days: [
    //             "Tue",
    //             "Thu"
    //         ],
    //         startTime: "14:00",
    //         endTime: "15:20",
    //         location: "THH301",
    //         units: 4,
    //         instructors: [
    //             {
    //                 firstName: "Mark",
    //                 lastName: "Redekopp"
    //             }
    //         ]
    //     }
    // ]
    useEffect(() => {
        if (!planId) {
            navigate('/dashboard');
            return;
        }

        if (user) {
            const planDocRef = doc(db, "users", user.uid, "coursePlans", planId);

            const unsubscribe = onSnapshot(planDocRef, async (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setPlanTitle(data.title || "");
                    if (data.courses === undefined) {
                        await updateDoc(planDocRef, { courses: [] });
                        setCourses([]);
                    } else {
                        setCourses(data.courses)
                    }
                    if (data.chat_history && data.chat_history.length > 0) {
                        setMessages(data.chat_history);
                    }
                    setHistoryLoaded(true);
                } else {
                    navigate("/dashboard");
                }
            });

            return () => unsubscribe();
        }

    }, [planId, navigate, user]);

    useEffect(() => {
        if (!historyLoaded) {
            return;
        }

        if (user && planId) {
            const docRef = doc(db, "users", user.uid, "coursePlans", planId);
            updateDoc(docRef, {
                chat_history: messages
            });
        }
    }, [messages, user, planId, historyLoaded]);

    // --- Helper to map course sections to calendar events ---
    const dayMap: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

    const calendarEvents: CalendarEvent[] = courses.flatMap(course => {
        return course.days.map(day => {
            const targetDay = moment().day(dayMap[day]);
            const [startHour, startMinute] = course.startTime.split(':').map(Number);
            const [endHour, endMinute] = course.endTime.split(':').map(Number);

            const startDate = targetDay.clone().hour(startHour).minute(startMinute).toDate();
            const endDate = targetDay.clone().hour(endHour).minute(endMinute).toDate();

            return {
                title: `${course.courseCode}: ${course.type}`,
                start: startDate,
                end: endDate,
                resource: course, // Attach original course data
            };
        });
    });

    function instructorsClean(instructorList: InstructorName[]): string {

        if (instructorList.length == 0) return ""

        let res = ""

        for (let i = 0; i < instructorList.length - 1; i++) {
            res += instructorList[i].lastName + ", " + instructorList[i].firstName + "; "
        }
        res += instructorList[instructorList.length - 1].lastName + ", " + instructorList[instructorList.length - 1].firstName
        return res
    }

    async function handleSendMessage() {
        if (inputValue.trim() === '') return;

        const userMessage = {
            id: Date.now(),
            text: inputValue,
            sender: 'user' as const,
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = inputValue;
        setInputValue('');
        setIsAgentTyping(true);

        // Simulate agent response
        // setTimeout(() => {
        //     const agentResponse = {
        //         id: Date.now(),
        //         text: `I am a placeholder response to: "${currentInput}"`, 
        //         sender: 'agent' as const,
        //     };
        //     setIsAgentTyping(false);
        //     setMessages(prev => [...prev, agentResponse]);
        // }, 1000);

        if (user && planId) {
            const planInfo = await getDoc(doc(db, "users", user.uid, "coursePlans", planId))
            const planData = planInfo.data()

            // Start a new chat if there's no messages.
            if (messages.length == 0) {
                const userInfo = await getDoc(doc(db, "users", user.uid))
                const userData = userInfo.data()

                let major = ""
                if (userData) {
                    major = userData.major
                }

                if (planData && planData.sessionId) {
                    const deleteParams = new URLSearchParams()
                    deleteParams.append("user_id", user.uid)
                    deleteParams.append("plan_id", planId)
                    deleteParams.append("session_id", planData.sessionId)
                    await fetch(`${BACKEND_URL}/session/delete?${deleteParams}`, {
                        method: "DELETE"
                    })
                }

                

                // console.log(deleteRes)

                const createParams = new URLSearchParams()
                createParams.append("user_id", user.uid)
                createParams.append("plan_id", planId)
                createParams.append("major", major)

                const createRes = await fetch(`${BACKEND_URL}/session/create?${createParams}`, {
                    method: "POST"
                })

                if (createRes.status >= 400) {
                    const agentResponse = {
                        id: Date.now(),
                        text: "Oops, it appears the agent is down. Please try again later.",
                        sender: 'agent' as const,
                    };
                    setMessages(prev => [...prev, agentResponse])
                    setIsAgentTyping(false)
                    return
                }

                // console.log(createRes)

            }

            // Make the request.
            // const contextualizedInput = `My current course plan is:\n${JSON.stringify(courses, null, 2)}\n\nMy request is: ${currentInput}`

            // console.log(contextualizedInput)

            /*
            const agentApiRes = await fetch(`/run`, {
                method: "POST",
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    app_name: "ai-dvisor",
                    user_id: user.uid,
                    session_id: planId,
                    new_message: {
                        role: "user",
                        parts: [
                            {
                                "text": contextualizedInput
                            }
                        ]
                    },
                    streaming: false
                })
            })
            */
            await new Promise(resolve => setTimeout(resolve, 2000))
            const updatedPlanInfo = await getDoc(doc(db, "users", user.uid, "coursePlans", planId))
            const updatedPlanData = updatedPlanInfo.data()
            const askParams = new URLSearchParams()
            askParams.append("user_id", user.uid)
            if (updatedPlanData) {
                askParams.append("session_id", updatedPlanData.sessionId)
            }
            askParams.append("message", currentInput)
            const agentApiRes = await fetch(`${BACKEND_URL}/ask?${askParams}`, {
                    method: "GET"
                }
            )
            console.log(`${BACKEND_URL}/ask?${askParams}`)

            if (agentApiRes.status >= 400) {
                const agentResponse = {
                    id: Date.now(),
                    text: "Oops, it appears the agent is down. Please try again later.",
                    sender: 'agent' as const,
                };
                setMessages(prev => [...prev, agentResponse])
                setIsAgentTyping(false)
                return
            } else {
                const agentResData = await agentApiRes.json()
                console.log(agentResData)
                const agentText = agentResData.content.parts[0].text

                if (agentText) {
                    const agentResponse = {
                        id: Date.now(),
                        text: agentText,
                        sender: 'agent' as const,
                    };
                    setMessages(prev => [...prev, agentResponse])
                }
            }

            

            /*
            const planDataRef = doc(db, "users", user.uid, "coursePlans", planId)
            console.log(agentResData)
            agentResData.forEach(async (element: { content: { parts: any[]; }; }) => {
                const operation = element.content.parts[0]
                if (operation.functionResponse) {
                    switch (operation.functionResponse.name) {

                        case "add_section":
                            if (operation.functionResponse.response.status === "success") {
                                await updateDoc(planDataRef, {
                                    courses: arrayUnion(operation.functionResponse.response.data)
                                })
                            }
                            break

                        case "remove_section":
                            if (operation.functionResponse.response.status === "success") {
                                const idToRemove = operation.functionResponse.response.section_id
                                // console.log(idToRemove)
                                let sectionToRemove

                                const currData = await getDoc(planDataRef)
                                const currCourses = currData.get("courses")
                                currCourses.forEach((element: CourseSection) => {
                                    if (element.sectionId == idToRemove) {
                                        sectionToRemove = element
                                    }
                                });

                                await updateDoc(planDataRef, {
                                    courses: arrayRemove(sectionToRemove)
                                })
                            }
                            break
                    }
                }
            });
            */
            
        }
        setIsAgentTyping(false)

    };

    async function handleAgentReset() {
        if (confirm("Are you sure you want to reset the chat?") && user && planId) {
            setMessages([])

            const planDocRef = doc(db, "users", user.uid, "coursePlans", planId)

            await updateDoc(planDocRef, {
                chat_history: deleteField()
            })

        }
    }

    async function handleDeleteCourse(course: CourseSection) {

        setCourses(courses.filter(c => c.sectionId !== course.sectionId));
        if (user && planId) {
            const planDocRef = doc(db, "users", user.uid, "coursePlans", planId)
            await updateDoc(planDocRef, {
                courses: arrayRemove(course)
            })
        }
    }

    return (
        <>
            <div>
                <div className="m-5 text-4xl">{planTitle}</div>
                <div className="grid grid-flow-col grid-cols-3 p-5 gap-5">
                    <div className="col-span-2">
                        <div className="grid grid-cols-2 gap-4 p-2 text-left">
                            <button onClick={() => setView('calendar')} className={`rounded font-bold cursor-pointer p-2 ${view === 'calendar' ? 'bg-amber-400' : 'bg-amber-200'}`}>Calendar View</button>
                            <button onClick={() => setView('list')} className={`rounded font-bold cursor-pointer p-2 ${view === 'list' ? 'bg-blue-400' : 'bg-blue-200'}`}>List View</button>
                        </div>
                        {
                            view === 'calendar' ? (
                                // --- Calendar View ---
                                <div style={{ height: '75vh' }} className="p-2">
                                    <Calendar
                                        localizer={localizer}
                                        events={calendarEvents}
                                        startAccessor="start"
                                        endAccessor="end"
                                        defaultView="week"
                                        views={['week', 'day']}
                                        toolbar={false} // Hides the top toolbar
                                        min={moment().hour(8).minute(0).toDate()} // Day starts at 8 AM
                                        max={moment().hour(22).minute(0).toDate()} // Day ends at 10 PM
                                        formats={{
                                            dayFormat: 'ddd', // Correct format for the week view header
                                        }}

                                    />
                                </div>
                            ) : (
                                // --- List View ---
                                <div className="p-2">
                                    {courses.length > 0 ? (
                                        <ul>
                                            {courses.map((course) => (
                                                <li key={course.sectionId} className="p-4 my-2 border rounded-lg shadow-md bg-white">
                                                    <div className="flex justify-end">
                                                        <button
                                                            className='bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded cursor-pointer'
                                                            onClick={() => {if (confirm('Are you sure you want to delete this course?')) handleDeleteCourse(course)}}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                    <p className="font-bold text-xl">{course.courseCode} - {course.courseName}</p>
                                                    <p className="text-gray-700">Section: {course.sectionId} ({course.type})</p>
                                                    <p className="text-gray-700">Time: {course.days.join(', ')} {course.startTime} - {course.endTime}</p>
                                                    <p className="text-gray-700">Location: {course.location}</p>
                                                    <p className="text-gray-700">Units: {course.units}</p>
                                                    <p className="text-gray-700">Instructors: {instructorsClean(course.instructors)}</p>
                                                
                                                </li>                                                
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-center p-4">No courses in this plan yet.</p>
                                    )}
                                </div>
                            )
                        }
                    </div>
                    <div className="col-span-1">
                        <div className="shadow-lg border border-gray-200 rounded h-full p-4 flex flex-col" style={{ height: '80vh' }}>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-left">AI-dvisor</h2>
                                <button onClick={handleAgentReset} className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-1 px-2 rounded text-sm cursor-pointer">
                                    Reset
                                </button>
                            </div>
                            <div ref={chatContainerRef} className="flex-grow overflow-y-auto mb-4 p-2 space-y-4 rounded">
                                {messages.map(message => (
                                    <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`rounded-lg px-3 py-2 max-w-xl ${message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
                                        </div>
                                    </div>
                                ))}
                                {isAgentTyping && (
                                    <div className="flex justify-start">
                                        <div className="rounded-lg px-3 py-2 max-w-xs bg-gray-200 text-blue-400">
                                            Waiting for response...
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex">
                                <input
                                    type="text"
                                    className="flex-grow border border-gray-300 shadow-sm rounded-l-lg p-2"
                                    placeholder="Ask me anything..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <button
                                    className="bg-blue-500 text-white rounded-r-lg px-4 hover:bg-blue-600 cursor-pointer"
                                    onClick={handleSendMessage}
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}