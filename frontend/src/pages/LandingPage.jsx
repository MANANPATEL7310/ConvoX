import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50'>
            {/* Navigation */}
            <nav className="px-4 sm:px-6 lg:px-8 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex-shrink-0">
                        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            ConvoX
                        </h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link 
                            to="/auth" 
                            className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 hidden sm:block"
                        >
                            Sign In
                        </Link>
                        <Link 
                            to="/auth" 
                            className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            Join Now
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left Content */}
                    <div className="text-center lg:text-left space-y-6 sm:space-y-8">
                        <div className="space-y-4 sm:space-y-6">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                                <span className="block">Connect with your</span>
                                <span className="block text-orange-500">Loved Ones</span>
                            </h1>
                            
                            <p className="text-lg sm:text-xl text-gray-600 max-w-lg mx-auto lg:mx-0">
                                Cover any distance with ConvoX Video Call. Experience crystal-clear video calls that bring you closer together.
                            </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link 
                                to="/home"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                            >
                                Get Started
                            </Link>
                            <Link 
                                to="/auth"
                                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-blue-500 hover:text-blue-600 transition-all duration-300"
                            >
                                Learn More
                            </Link>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600">HD</div>
                                <div className="text-sm text-gray-600">Video Quality</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-purple-600">Secure</div>
                                <div className="text-sm text-gray-600">Encrypted Calls</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-orange-500">Free</div>
                                <div className="text-sm text-gray-600">No Cost</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Image */}
                    <div className="relative">
                        <div className="relative z-10">
                            <img 
                                src="/mobile.png" 
                                alt="ConvoX Video Call App" 
                                className="w-full h-auto max-w-md mx-auto lg:max-w-none "
                            />
                        </div>
                        {/* Background decoration */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-200 to-purple-200 rounded-2xl transform rotate-6 -z-10 opacity-50"></div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-20 py-8 border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center text-gray-600">
                        <p>&copy; 2024 ConvoX. Bringing people together, one call at a time.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
