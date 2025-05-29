"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { FcGoogle } from "react-icons/fc"
import { HiMail, HiLogout, HiUser } from "react-icons/hi"

export default function Home() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Ezra</h1>
            <p className="text-gray-600 mb-8">Your AI-powered email assistant</p>
            <p className="text-sm text-gray-500 mb-8">
              Connect your Gmail account to get started with intelligent email management
            </p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => signIn("google")}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              <FcGoogle className="w-5 h-5 mr-3" />
              Sign in with Google
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">
              By signing in, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Ezra</h1>
              <span className="ml-2 text-sm text-gray-500">AI Email Assistant</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <HiUser className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">{session.user?.email}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <HiLogout className="w-4 h-4 mr-1" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center py-12">
            <HiMail className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Ezra!
            </h2>
            <p className="text-gray-600 mb-6">
              Your Gmail account is now connected. We're setting up your AI email assistant.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-800">
                    ✅ Google OAuth authentication successful
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Email Analysis</h3>
                <p className="text-sm text-gray-600">
                  AI will analyze your email patterns and writing style
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Smart Replies</h3>
                <p className="text-sm text-gray-600">
                  Generate contextual email responses automatically
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Email Management</h3>
                <p className="text-sm text-gray-600">
                  Intelligent labeling and organization of your inbox
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
