import { NavLink } from "react-router-dom";

export default function Homepage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
            <div className="max-w-4xl w-full bg-white shadow-lg rounded-lg p-8">
                <h1 className='text-5xl font-bold text-center text-gray-800 mb-4'>AI-dvisor</h1>
                <p className="text-lg text-center text-gray-600 mb-8">
                    An easy-to-use, specialized utility for planning your course schedules with the help of a responsive, informed LLM-powered AI advisor.
                </p>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">About</h2>
                        <p className="text-gray-600">
                            AI-dvisor is a powerful tool designed to assist university students in organizing their courses. It combines up-to-date course information with
                            LLM-powered guidance to provide a course planning experience as if meeting with a real academic advisor.
                        </p>
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Usage</h2>
                        <ol className="list-decimal list-inside text-gray-600 space-y-2">
                            <li>Make an account through the signup link.</li>
                            <li>Create a course plan and give it a name.</li>
                            <li>Use the chat interface to ask your AI-dvisor anything about your university's courses.</li>
                            <li>See your course list update in real-time.</li>
                        </ol>
                    </div>
                </div>

                <div className="text-center">
                    <NavLink
                        className="inline-block px-8 py-3 text-lg font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                        to='/dashboard'
                    >
                        Dashboard
                    </NavLink>
                </div>
            </div>
        </div>
    );
}