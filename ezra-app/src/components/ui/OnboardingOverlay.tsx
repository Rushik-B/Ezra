'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Brain, 
  Users, 
  ListChecks, 
  Mail, 
  CheckCircle2, 
  Loader2, 
  Sparkles,
  ArrowRight,
  Clock
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  borderColor: string;
  completed: boolean;
  inProgress: boolean;
}

interface OnboardingOverlayProps {
  onComplete?: () => void;
}

export const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({ onComplete }) => {
  const { data: session } = useSession();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const fetchOnboardingStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/user/onboarding-status');
      const data = await response.json();
      
      if (data.success) {
        const user = data.user;
        
        const onboardingSteps: OnboardingStep[] = [
          {
            id: 'emails',
            title: 'Fetching Your Emails',
            description: 'Analyzing your email patterns and communication style',
            icon: Mail,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            completed: user.emailsFetched,
            inProgress: !user.emailsFetched
          },
          {
            id: 'master-prompt',
            title: 'Generating Your AI Voice',
            description: 'Creating a personalized communication style based on your emails',
            icon: Brain,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
            completed: user.masterPromptGenerated,
            inProgress: user.emailsFetched && !user.masterPromptGenerated
          },
          {
            id: 'interaction-network',
            title: 'Building Your Network Map',
            description: 'Identifying key contacts and communication patterns',
            icon: Users,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            borderColor: 'border-emerald-200',
            completed: user.interactionNetworkGenerated,
            inProgress: user.masterPromptGenerated && !user.interactionNetworkGenerated
          },
          {
            id: 'strategic-rulebook',
            title: 'Creating Smart Rules',
            description: 'Establishing intelligent response patterns and preferences',
            icon: ListChecks,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            borderColor: 'border-amber-200',
            completed: user.strategicRulebookGenerated,
            inProgress: user.interactionNetworkGenerated && !user.strategicRulebookGenerated
          }
        ];
        
        setSteps(onboardingSteps);
        
        // Calculate progress
        const completedSteps = onboardingSteps.filter(step => step.completed).length;
        const totalSteps = onboardingSteps.length;
        setProgress((completedSteps / totalSteps) * 100);
        
        // Set current step
        const inProgressStep = onboardingSteps.find(step => step.inProgress);
        setCurrentStep(inProgressStep?.id || null);
        
        // Check if all steps are completed
        if (completedSteps === totalSteps && onComplete) {
          setTimeout(() => {
            onComplete();
          }, 2000); // Give a moment to show completion
        }
      }
    } catch (error) {
      console.error('Error fetching onboarding status:', error);
    } finally {
      setLoading(false);
    }
  }, [onComplete]);

  // Fetch user onboarding status
  useEffect(() => {
    if (!session?.user?.email) return;
    
    fetchOnboardingStatus();
    const interval = setInterval(fetchOnboardingStatus, 3000); // Poll every 3 seconds
    
    return () => clearInterval(interval);
  }, [session, fetchOnboardingStatus]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 z-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if onboarding is complete
  const allCompleted = steps.every(step => step.completed);
  if (allCompleted) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 via-white to-blue-50 z-50 flex items-center justify-center animate-fade-out">
        <div className="text-center animate-bounce-in">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Complete!</h2>
          <p className="text-gray-600">Your AI assistant is ready to help manage your emails.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 z-50 overflow-auto">
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12 animate-slide-down">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-ping"></div>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Setting Up Your AI Assistant
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              We're analyzing your communication patterns to create a personalized AI that writes just like you.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-12 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">Setup Progress</span>
              <span className="text-sm font-medium text-blue-600">{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = step.completed;
              const isInProgress = step.inProgress;
              const isUpcoming = !isCompleted && !isInProgress;

              return (
                <div
                  key={step.id}
                  className={`relative p-8 rounded-2xl border-2 transition-all duration-500 shadow-lg hover:shadow-xl ${
                    isCompleted 
                      ? 'bg-white border-emerald-200 shadow-emerald-100' 
                      : isInProgress 
                        ? `${step.bgColor} ${step.borderColor} animate-pulse-gentle`
                        : 'bg-white border-gray-200'
                  }`}
                  style={{
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  {/* Status Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isCompleted 
                        ? 'bg-emerald-100' 
                        : isInProgress 
                          ? step.bgColor
                          : 'bg-gray-100'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      ) : isInProgress ? (
                        <div className="relative">
                          <Icon className={`w-6 h-6 ${step.color}`} />
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                        </div>
                      ) : (
                        <Icon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    
                    {/* Step Number */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isCompleted 
                        ? 'bg-emerald-500 text-white' 
                        : isInProgress 
                          ? 'bg-blue-500 text-white animate-bounce-slow'
                          : 'bg-gray-200 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className={`text-xl font-bold mb-3 ${
                      isCompleted 
                        ? 'text-emerald-900' 
                        : isInProgress 
                          ? 'text-gray-900'
                          : 'text-gray-500'
                    }`}>
                      {step.title}
                    </h3>
                    <p className={`text-sm leading-relaxed ${
                      isCompleted 
                        ? 'text-emerald-700' 
                        : isInProgress 
                          ? 'text-gray-700'
                          : 'text-gray-500'
                    }`}>
                      {step.description}
                    </p>
                  </div>

                  {/* Status Indicator */}
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {isCompleted && (
                        <span className="text-sm font-medium text-emerald-600 flex items-center">
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Complete
                        </span>
                      )}
                      {isInProgress && (
                        <span className="text-sm font-medium text-blue-600 flex items-center">
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          In Progress...
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="text-sm font-medium text-gray-500 flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Waiting
                        </span>
                      )}
                    </div>
                    
                    {isInProgress && (
                      <ArrowRight className="w-4 h-4 text-blue-600 animate-bounce-x" />
                    )}
                  </div>

                  {/* Progress Indicator for Current Step */}
                  {isInProgress && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-2xl overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 animate-progress-bar"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="text-center mt-12 animate-fade-in">
            <p className="text-sm text-gray-500 mb-4">
              This process typically takes 2-3 minutes. Please don't close this page.
            </p>
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Analyzing your communication patterns...</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes pulse-gentle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }
        
        @keyframes progress-bar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-pulse-gentle {
          animation: pulse-gentle 2s infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
        
        .animate-bounce-x {
          animation: bounce-x 1s infinite;
        }
        
        .animate-progress-bar {
          animation: progress-bar 3s infinite;
        }
        
        .animate-slide-down {
          animation: slide-down 0.6s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out 0.2s both;
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out 1s both;
        }
        
        .animate-fade-out {
          animation: fade-out 0.5s ease-out 1.5s both;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}; 