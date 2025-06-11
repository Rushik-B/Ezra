"use client"

import { useSession, signIn } from "next-auth/react"
import { FcGoogle } from "react-icons/fc"
import { EzraApp } from "@/components/EzraApp"

export default function Home() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
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
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
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

  return <EzraApp />
}
