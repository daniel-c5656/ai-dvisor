import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from './firebase.tsx';
import { Calendar, momentLocalizer, type Event as CalendarEvent } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from "./useAuth.tsx";

// Setup for react-big-calendar
const localizer = momentLocalizer(moment);

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

export default function Planpage() {
    const navigate = useNavigate();
    const { planId } = useParams<{ planId: string }>();
    const { user } = useAuth();
    const [planTitle, setPlanTitle] = useState<string>("");
    const [view, setView] = useState<string>("calendar");
    const [courses, setCourses] = useState<CourseSection[]>([
        {
            sectionId: "31009",
            courseCode: "EE109",
            courseName: "Introduction to Embedded Systems",
            type: "Lecture",
            days: [
                "Tue",
                "Thu"
            ],
            startTime: "14:00",
            endTime: "15:20",
            location: "THH301",
            units: 4,
            instructors: [
                {
                    firstName: "Mark",
                    lastName: "Redekopp"
                }
            ]
        },
        {
            sectionId: "30113",
            courseCode: "CSCI310",
            courseName: "Software Engineering",
            type: "Lecture",
            days: [
                "Tue",
                "Thu"
            ],
            startTime: "10:00",
            endTime: "11:50",
            location: "THH201",
            units: 4,
            instructors: [
                {
                    firstName: "Chao",
                    lastName: "Wang"
                }
            ],
        }
    ]);

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
                        // TODO: setCourses(data.courses);
                    }
                } else {
                    navigate("/dashboard");
                }
            });

            return () => unsubscribe();
        }

    }, [planId, navigate, user]);

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
        let res = ""
        
        for (let i=0; i < instructorList.length-1; i++) {
            res += instructorList[i].lastName + ", " + instructorList[i].firstName
        }
        res += instructorList[instructorList.length-1].lastName + ", " + instructorList[instructorList.length-1].firstName
        return res
    }

    return (
        <>
            <div>
                <div className="m-5 text-5xl">{planTitle}</div>
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
                        {/* Chat menu goes here */}
                        <div className="outline rounded h-full p-4">
                            <h2 className="text-2xl font-bold">Chat</h2>
                            {/* Chat interface will be built here */}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}