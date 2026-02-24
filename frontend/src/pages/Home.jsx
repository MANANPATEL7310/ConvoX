import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { History, LogOut, Video, Calendar, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
            {/* Navigation Bar */}
            <nav className="bg-white/70 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center"
                        >
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                ConvoX Video
                            </h2>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center space-x-2 sm:space-x-4"
                        >
                            <Button
                                variant="ghost"
                                onClick={() => navigate("/history")}
                                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                            >
                                <History className="w-5 h-5" />
                                <span className="hidden sm:inline font-medium">History</span>
                            </Button>

                            <Button
                                variant="destructive"
                                onClick={() => {
                                    logout();
                                    navigate("/auth")
                                }}
                                className="flex items-center space-x-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 hover:text-red-700 shadow-sm"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Logout</span>
                                <span className="sm:hidden">Exit</span>
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[calc(100vh-8rem)]">
                    {/* Left Panel */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-8"
                    >
                        <div className="space-y-6">
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
                                Providing Quality Video Call
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mt-2">
                                    Just Like Quality Education
                                </span>
                            </h1>
                            
                            <p className="text-lg text-gray-600 max-w-lg">
                                Connect with anyone, anywhere. Experience crystal-clear video calls with ConvoX.
                            </p>
                        </div>

                        {/* Meeting Code Input */}
                        <Card className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 sm:p-8 border border-white max-w-lg">
                            <h3 className="text-xl font-semibold text-gray-800 mb-6">Join a Meeting</h3>
                            
                            <div className="space-y-4">
                                <Input
                                    type="text"
                                    value={meetingCode}
                                    onChange={e => setMeetingCode(e.target.value)}
                                    placeholder="Enter meeting code"
                                    className="w-full text-lg h-14 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm transition-all bg-white"
                                />
                                
                                <Button
                                    onClick={handleJoinVideoCall}
                                    size="lg"
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 text-lg font-semibold hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform transition-all duration-300 rounded-xl"
                                >
                                    Join Meeting
                                </Button>
                            </div>

                            {/* Quick Actions */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <p className="text-sm text-gray-600 mb-4 font-medium">Quick Actions:</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="outline" className="h-12 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors flex items-center justify-center gap-2 rounded-lg">
                                        <Calendar className="w-4 h-4" />
                                        Schedule
                                    </Button>
                                    <Button variant="outline" className="h-12 border-gray-200 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-colors flex items-center justify-center gap-2 rounded-lg">
                                        <PlusCircle className="w-4 h-4" />
                                        Create Room
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* User Info */}
                        {user && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 }}
                                className="bg-blue-50/50 backdrop-blur-sm rounded-xl p-4 border border-blue-100 max-w-lg shadow-sm"
                            >
                                <p className="text-sm text-gray-700 flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                    </span>
                                    Logged in as <span className="font-semibold text-blue-700">{user.username}</span>
                                </p>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Right Panel */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative hidden lg:block"
                    >
                        <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden shadow-2xl border border-white/50">
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-300 rounded-full mix-blend-multiply opacity-30 -mr-20 -mt-20 blur-2xl animate-blob"></div>
                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-300 rounded-full mix-blend-multiply opacity-30 -ml-16 -mb-16 blur-2xl animate-blob animation-delay-2000"></div>
                            
                            <div className="relative z-10 text-center space-y-8">
                                <motion.div 
                                    whileHover={{ rotate: 15, scale: 1.1 }}
                                    className="w-24 h-24 bg-white/90 backdrop-blur-sm rounded-full mx-auto flex items-center justify-center shadow-lg border border-white/50"
                                >
                                    <Video className="w-12 h-12 text-blue-600" />
                                </motion.div>
                                
                                <div className="space-y-4">
                                    <h3 className="text-3xl font-bold text-gray-800 tracking-tight">Start Video Calling</h3>
                                    <p className="text-gray-600 text-lg max-w-sm mx-auto">
                                        Enter a meeting code or create your own room to start connecting with others instantly.
                                    </p>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4 pt-8 border-t border-gray-300/30">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">HD</div>
                                        <div className="text-sm font-medium text-gray-600">Quality</div>
                                    </div>
                                    <div className="text-center border-l border-r border-gray-300/30">
                                        <div className="text-2xl font-bold text-purple-600">24/7</div>
                                        <div className="text-sm font-medium text-gray-600">Available</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">Free</div>
                                        <div className="text-sm font-medium text-gray-600">Forever</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
