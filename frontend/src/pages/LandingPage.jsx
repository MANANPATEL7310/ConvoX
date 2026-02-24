import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Video, Shield, DollarSign } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden'>
            {/* Navigation */}
            <nav className="px-4 sm:px-6 lg:px-8 py-4 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-shrink-0"
                    >
                        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer">
                            ConvoX
                        </h2>
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center space-x-4"
                    >
                        <Link to="/auth" className="hidden sm:block">
                            <Button variant="ghost" className="text-gray-700 hover:text-blue-600 font-medium">
                                Sign In
                            </Button>
                        </Link>
                        <Link to="/auth">
                            <Button className="bg-blue-600 hover:bg-blue-700 shadow-md transition-all hover:scale-105">
                                Join Now
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 relative">
                <div className="absolute top-20 left-10 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-20 right-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center z-10 relative">
                    {/* Left Content */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center lg:text-left space-y-6 sm:space-y-8"
                    >
                        <div className="space-y-4 sm:space-y-6">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                                <span className="block">Connect with your</span>
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">
                                    Loved Ones
                                </span>
                            </h1>
                            
                            <p className="text-lg sm:text-xl text-gray-600 max-w-lg mx-auto lg:mx-0">
                                Cover any distance with ConvoX Video Call. Experience crystal-clear video calls that bring you closer together.
                            </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link to="/home">
                                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 scale-100 hover:scale-105 text-lg h-14 px-8 rounded-xl">
                                    Get Started
                                </Button>
                            </Link>
                            <Link to="/auth">
                                <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all duration-300 text-lg h-14 px-8 rounded-xl bg-transparent">
                                    Learn More
                                </Button>
                            </Link>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
                            <motion.div whileHover={{ y: -5 }} className="flex flex-col items-center lg:items-start p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm">
                                <Video className="w-8 h-8 text-blue-600 mb-2" />
                                <div className="text-lg font-bold text-gray-900">HD Quality</div>
                                <div className="text-sm text-gray-600 text-center lg:text-left">Crystal clear video</div>
                            </motion.div>
                            <motion.div whileHover={{ y: -5 }} className="flex flex-col items-center lg:items-start p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm">
                                <Shield className="w-8 h-8 text-purple-600 mb-2" />
                                <div className="text-lg font-bold text-gray-900">Secure</div>
                                <div className="text-sm text-gray-600 text-center lg:text-left">Encrypted calls</div>
                            </motion.div>
                            <motion.div whileHover={{ y: -5 }} className="flex flex-col items-center lg:items-start p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm">
                                <DollarSign className="w-8 h-8 text-orange-500 mb-2" />
                                <div className="text-lg font-bold text-gray-900">Free Forever</div>
                                <div className="text-sm text-gray-600 text-center lg:text-left">No hidden costs</div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Right Content - Image */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative hidden lg:block"
                    >
                        <div className="relative z-10 flex justify-center">
                            <img 
                                src="/mobile.png" 
                                alt="ConvoX Video Call App" 
                                className="w-full h-auto max-w-sm drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                        {/* Background decoration */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-200 to-purple-200 rounded-[3rem] transform rotate-6 -z-10 opacity-60"></div>
                        <div className="absolute inset-0 bg-gradient-to-bl from-pink-200 to-orange-200 rounded-[3rem] transform -rotate-6 -z-20 opacity-40"></div>
                    </motion.div>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-10 py-8 border-t border-gray-200/50 bg-white/30 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center text-gray-600">
                        <p>&copy; {new Date().getFullYear()} ConvoX. Bringing people together, one call at a time.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
