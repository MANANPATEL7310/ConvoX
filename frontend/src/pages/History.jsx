import React, { useContext, useEffect, useState, useMemo } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Video, Calendar, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Navigation Header */}
            <nav className="bg-white/70 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center"
                        >
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Meeting History
                            </h2>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <Button
                                variant="ghost"
                                onClick={() => routeTo("/home")}
                                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            >
                                <Home className="w-5 h-5" />
                                <span className="hidden sm:inline font-medium">Back to Home</span>
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {meetings.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-20 max-w-md mx-auto"
                    >
                        <div className="w-24 h-24 bg-blue-50 border border-blue-100 rounded-full mx-auto flex items-center justify-center mb-6 shadow-inset">
                            <Video className="w-10 h-10 text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">No meeting history found</h3>
                        <p className="text-gray-600 mb-8 text-lg">You haven't joined any meetings yet. Start your first video call with ConvoX!</p>
                        <Button
                            size="lg"
                            onClick={() => routeTo("/home")}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all w-full sm:w-auto"
                        >
                            Start a Meeting
                        </Button>
                    </motion.div>
                ) : (
                    <div className="space-y-8">
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center mb-10"
                        >
                            <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Your Meeting History</h1>
                            <p className="text-lg text-gray-600">View and rejoin your past video calls effortlessly</p>
                        </motion.div>

                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {meetings.map((meeting, index) => (
                                <motion.div key={index} variants={itemVariants}>
                                    <Card 
                                        className="bg-white/80 backdrop-blur-sm shadow-md hover:shadow-xl transition-all duration-300 border-gray-100 overflow-hidden group cursor-pointer h-full flex flex-col hover:-translate-y-1"
                                        onClick={() => routeTo(`/${meeting.meetingCode}`)}
                                    >
                                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 w-full"></div>
                                        
                                        <CardContent className="p-6 flex-1 flex flex-col">
                                            <div className="flex items-center justify-between mb-5">
                                                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                                    <Video className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <Badge variant="outline" className="text-xs text-gray-500 bg-gray-50 uppercase tracking-wider font-medium border-gray-200">
                                                    Meeting #{index + 1}
                                                </Badge>
                                            </div>
                                            
                                            <div className="space-y-4 flex-1">
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-1 flex items-center gap-1">
                                                        <Video className="w-3 h-3" /> Code
                                                    </p>
                                                    <p className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 truncate pr-2">
                                                        {meeting.meetingCode}
                                                    </p>
                                                </div>
                                                
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-1 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" /> Date
                                                    </p>
                                                    <p className="text-md text-gray-800 font-medium">
                                                        {formatDate(meeting.date)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center text-blue-600 group-hover:text-blue-700 font-semibold group-hover:gap-2 transition-all">
                                                <span>Rejoin Meeting</span>
                                                <ArrowRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Summary Stats */}
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Card className="mt-12 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100">
                                <CardContent className="p-8">
                                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-gray-500" /> Meeting Summary
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                                        <div className="text-center pt-4 sm:pt-0">
                                            <div className="text-4xl font-extrabold text-blue-600 mb-2">{meetings.length}</div>
                                            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Meetings</div>
                                        </div>
                                        <div className="text-center pt-4 sm:pt-0">
                                            <div className="text-4xl font-extrabold text-green-600 mb-2">
                                                {thisWeekCount}
                                            </div>
                                            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">This Week</div>
                                        </div>
                                        <div className="text-center pt-4 sm:pt-0">
                                            <div className="text-3xl mt-1 font-bold text-purple-600 mb-2">
                                                {meetings.length > 0 ? "Active" : "None"}
                                            </div>
                                            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Status</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    )
}
