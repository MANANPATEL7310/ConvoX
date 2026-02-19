import React, { useContext, useEffect, useState, useMemo } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([])
    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch {
                // handle error
            }
        }
        fetchHistory();
    }, [getHistoryOfUser])

    let formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        const year = date.getFullYear();
        return `${day}/${month}/${year}`
    }

    const [weekAgo] = useState(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const thisWeekCount = useMemo(() => 
        meetings.filter(m => new Date(m.date) > weekAgo).length, 
        [meetings, weekAgo]
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Navigation Header */}
            <nav className="bg-white shadow-lg border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Meeting History
                            </h2>
                        </div>

                        <button
                            onClick={() => routeTo("/home")}
                            className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        >
                            <HomeIcon className="text-xl" />
                            <span className="font-medium">Back to Home</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {meetings.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-6">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No meeting history found</h3>
                        <p className="text-gray-600 mb-6">You haven't joined any meetings yet. Start your first video call!</p>
                        <button
                            onClick={() => routeTo("/home")}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Start a Meeting
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Meeting History</h1>
                            <p className="text-gray-600">View and manage your past video calls</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {meetings.map((meeting, index) => (
                                <div
                                    key={index}
                                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group cursor-pointer"
                                    onClick={() => routeTo(`/${meeting.meetingCode}`)}
                                >
                                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2"></div>
                                    
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                                                Meeting #{index + 1}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-500 mb-1">Meeting Code</p>
                                                <p className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                                                    {meeting.meetingCode}
                                                </p>
                                            </div>
                                            
                                            <div>
                                                <p className="text-sm text-gray-500 mb-1">Date</p>
                                                <p className="text-gray-800 font-medium">
                                                    {formatDate(meeting.date)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium group-hover:underline">
                                                Rejoin Meeting →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary Stats */}
                        <div className="mt-12 bg-white rounded-xl shadow-md p-6 border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Meeting Summary</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-600 mb-1">{meetings.length}</div>
                                    <div className="text-sm text-gray-600">Total Meetings</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-600 mb-1">
                                        {thisWeekCount}
                                    </div>
                                    <div className="text-sm text-gray-600">This Week</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-purple-600 mb-1">
                                        {meetings.length > 0 ? "Active" : "None"}
                                    </div>
                                    <div className="text-sm text-gray-600">Status</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
