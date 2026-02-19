import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { useAuth } from '../contexts/useAuth';

export default function HomeComponent() {
    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const { user, logout, addToUserHistory } = useAuth();

    let handleJoinVideoCall = async () => {
        if (!meetingCode.trim()) {
            alert('Please enter a meeting code');
            return;
        }
        await addToUserHistory(meetingCode)
        navigate(`/${meetingCode}`)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-lg border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                ConvoX Video
                            </h2>
                        </div>

                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <button
                                onClick={() => navigate("/history")}
                                className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            >
                                <RestoreIcon className="text-xl" />
                                <span className="hidden sm:inline font-medium">History</span>
                            </button>

                            <Button
                                onClick={() => {
                                    logout();
                                    navigate("/auth")
                                }}
                                variant="outlined"
                                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                            >
                                <span className="hidden sm:inline">Logout</span>
                                <span className="sm:hidden">Exit</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[calc(100vh-8rem)]">
                    {/* Left Panel */}
                    <div className="space-y-8">
                        <div className="space-y-6">
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                                Providing Quality Video Call
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                                    Just Like Quality Education
                                </span>
                            </h1>
                            
                            <p className="text-lg text-gray-600">
                                Connect with anyone, anywhere. Experience crystal-clear video calls with ConvoX.
                            </p>
                        </div>

                        {/* Meeting Code Input */}
                        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
                            <h3 className="text-xl font-semibold text-gray-800 mb-6">Join a Meeting</h3>
                            
                            <div className="space-y-4">
                                <TextField
                                    fullWidth
                                    label="Meeting Code"
                                    variant="outlined"
                                    value={meetingCode}
                                    onChange={e => setMeetingCode(e.target.value)}
                                    placeholder="Enter meeting code"
                                    className="w-full"
                                    InputProps={{
                                        className: "text-lg",
                                        style: { borderRadius: '12px' }
                                    }}
                                />
                                
                                <Button
                                    onClick={handleJoinVideoCall}
                                    variant='contained'
                                    fullWidth
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 text-lg font-semibold hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                                    style={{ borderRadius: '12px', textTransform: 'none' }}
                                >
                                    Join Meeting
                                </Button>
                            </div>

                            {/* Quick Actions */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <p className="text-sm text-gray-600 mb-4">Quick Actions:</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors duration-200">
                                        Schedule Call
                                    </button>
                                    <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors duration-200">
                                        Create Room
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* User Info */}
                        {user && (
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                                <p className="text-sm text-gray-600">
                                    Welcome back, <span className="font-semibold text-blue-600">{user.username}</span>!
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Panel */}
                    <div className="relative">
                        <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full opacity-20 -mr-16 -mt-16"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-200 rounded-full opacity-20 -ml-12 -mb-12"></div>
                            
                            <div className="relative z-10 text-center space-y-6">
                                <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg">
                                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-bold text-gray-800">Start Video Calling</h3>
                                    <p className="text-gray-600">
                                        Enter a meeting code or create your own room to start connecting with others.
                                    </p>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4 pt-6">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">HD</div>
                                        <div className="text-xs text-gray-600">Quality</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-purple-600">24/7</div>
                                        <div className="text-xs text-gray-600">Available</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">Free</div>
                                        <div className="text-xs text-gray-600">Forever</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
