import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/common/Button';

export function Feedback() {
  const { user } = useAuth();
  const { success, error } = useToast();
  
  const [feedbackType, setFeedbackType] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement feedback submission API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      success('Thank you for your feedback! We\'ll review it and get back to you if needed.');
      setSubject('');
      setMessage('');
      setFeedbackType('general');
    } catch (err) {
      error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">J</span>
              </div>
              <span className="text-xl font-bold text-black">journo</span>
            </Link>
            <span className="text-gray-400">/</span>
            <h1 className="text-xl font-semibold text-gray-900">Send Feedback</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">We'd love to hear from you</h2>
              <p className="text-lg text-gray-600">Your feedback helps us improve Journo for everyone</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Feedback Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What type of feedback do you have?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="relative">
                    <input
                      type="radio"
                      name="feedbackType"
                      value="general"
                      checked={feedbackType === 'general'}
                      onChange={(e) => setFeedbackType(e.target.value)}
                      className="sr-only peer"
                    />
                    <div className="p-4 border border-gray-300 rounded-xl cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        <span className="font-medium text-gray-900">General</span>
                      </div>
                    </div>
                  </label>

                  <label className="relative">
                    <input
                      type="radio"
                      name="feedbackType"
                      value="bug"
                      checked={feedbackType === 'bug'}
                      onChange={(e) => setFeedbackType(e.target.value)}
                      className="sr-only peer"
                    />
                    <div className="p-4 border border-gray-300 rounded-xl cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium text-gray-900">Bug Report</span>
                      </div>
                    </div>
                  </label>

                  <label className="relative">
                    <input
                      type="radio"
                      name="feedbackType"
                      value="feature"
                      checked={feedbackType === 'feature'}
                      onChange={(e) => setFeedbackType(e.target.value)}
                      className="sr-only peer"
                    />
                    <div className="p-4 border border-gray-300 rounded-xl cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className="font-medium text-gray-900">Feature Request</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of your feedback"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Please provide as much detail as possible..."
                  required
                />
              </div>

              {/* User Info */}
              {user && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Your Information</h4>
                  <p className="text-sm text-gray-600">Name: {user.name}</p>
                  <p className="text-sm text-gray-600">Email: {user.email}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    This information will be included with your feedback so we can follow up if needed.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  * Required fields
                </p>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Send Feedback
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Additional Help */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">Need immediate help?</p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/help"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Visit Help Center
            </Link>
            <span className="text-gray-400">•</span>
            <a
              href="mailto:support@journo.com"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Feedback;