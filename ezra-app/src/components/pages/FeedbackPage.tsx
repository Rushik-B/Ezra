import React from 'react';
import { Mail, Phone, MessageCircle, Heart } from 'lucide-react';

export const FeedbackPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            We'd Love Your Feedback
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Feedback and opinions are very greatly appreciated. Please contact me by:
          </p>
        </div>

        {/* Contact Cards */}
        <div className="space-y-6">
          {/* Email Card */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center space-x-6">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center">
                <Mail className="w-7 h-7 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Email</h3>
                <a 
                  href="mailto:rushik@iitk.ac.in" 
                  className="text-blue-600 hover:text-blue-700 font-medium text-lg transition-colors"
                >
                  rushik@iitk.ac.in
                </a>
                <p className="text-gray-500 text-sm mt-1">Best for detailed feedback and suggestions</p>
              </div>
            </div>
          </div>

          {/* Phone Card */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center space-x-6">
              <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Phone className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Phone</h3>
                <a 
                  href="tel:+919718271221" 
                  className="text-emerald-600 hover:text-emerald-700 font-medium text-lg transition-colors"
                >
                  +91 97182 71221
                </a>
                <p className="text-gray-500 text-sm mt-1">Quick questions and urgent feedback</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Message */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <MessageCircle className="w-8 h-8 text-purple-600 mx-auto mb-4" />
            <p className="text-gray-700 leading-relaxed">
              Your feedback helps make Ezra better for everyone. Whether it's a bug report, 
              feature request, or just your thoughts on the experience - every message matters!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 