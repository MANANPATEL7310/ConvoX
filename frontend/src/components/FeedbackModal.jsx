import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquarePlus, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import axios from 'axios';
import { toast } from 'sonner';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

export default function FeedbackModal({ isOpen, onClose }) {
  const { dark } = useTheme();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a star rating first.");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(
        `${SERVER_URL}/api/v1/feedback`,
        { rating, comment },
        { withCredentials: true }
      );
      toast.success("Thank you for your feedback!");
      onClose(); // Proceed with navigation/close
    } catch (err) {
      console.error("Feedback submission error:", err);
      toast.error("Failed to submit feedback. Try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl border ${
            dark ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-100'
          }`}
        >
          {/* Close / Skip button */}
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
              dark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-8 mt-2">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              dark ? 'bg-indigo-500/20' : 'bg-indigo-50'
            }`}>
              <MessageSquarePlus className={`w-8 h-8 ${dark ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
              How was your meeting?
            </h2>
            <p className={`text-sm px-4 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              Your feedback helps us improve the platform for everyone.
            </p>
          </div>

          {/* Star Rating System */}
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-transform hover:scale-110"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`w-10 h-10 transition-colors ${
                    (hoveredRating || rating) >= star
                      ? 'fill-yellow-400 text-yellow-400'
                      : dark ? 'text-gray-700' : 'text-gray-200'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Comment TextField */}
          <div className="mb-8">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more about your experience (optional)..."
              className={`w-full p-4 rounded-xl text-sm resize-none h-28 focus:outline-none focus:ring-2 transition-all ${
                dark
                  ? 'bg-gray-800/50 text-white placeholder-gray-500 focus:ring-indigo-500/50 border border-gray-700/50'
                  : 'bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-indigo-500/30 border border-gray-200'
              }`}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
              className={`w-full py-6 rounded-xl font-bold text-base shadow-lg transition-all ${
                rating === 0 
                 ? 'opacity-50 cursor-not-allowed'
                 : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
            
            <Button
              variant="ghost"
              onClick={onClose}
              className={`w-full rounded-xl ${
                dark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Maybe Later
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
