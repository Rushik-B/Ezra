import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Ezra',
  description: 'Privacy Policy for Ezra AI Email Assistant',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-600">
            Effective Date: June 15, 2025 | Last Updated: June 15, 2025
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Welcome to Ezra ("we," "our," or "us"). Ezra is an AI-powered email assistant that helps you manage and respond to your emails more efficiently. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By using Ezra, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, do not use our service.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium text-gray-800 mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Account information (name, email address) when you sign up through Google OAuth</li>
              <li>Feedback and communications when you contact us</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3">2.2 Gmail Data We Access</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              With your explicit consent, we access your Gmail data to provide our AI email assistant services:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li><strong>Email Content:</strong> We read your sent and received emails to understand your communication style and generate appropriate responses</li>
              <li><strong>Email Metadata:</strong> We access email headers, timestamps, sender/recipient information, and thread information</li>
              <li><strong>Email Composition:</strong> We send emails on your behalf when you approve AI-generated responses</li>
              <li><strong>Gmail Labels and Threads:</strong> We access Gmail organizational data to maintain email context</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3">2.3 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Usage data and analytics about how you interact with our service</li>
              <li>Device information and browser type</li>
              <li>IP address and general location information</li>
              <li>Log files and error reports</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li><strong>Provide AI Email Assistance:</strong> Analyze your email patterns to generate personalized response suggestions</li>
              <li><strong>Create Your Personal Operating System (POS):</strong> Build interaction networks and strategic rulebooks based on your communication style</li>
              <li><strong>Send Emails:</strong> Send approved responses on your behalf through Gmail</li>
              <li><strong>Improve Our Service:</strong> Analyze usage patterns to enhance our AI models and user experience</li>
              <li><strong>Provide Support:</strong> Respond to your inquiries and provide customer support</li>
              <li><strong>Security:</strong> Monitor for suspicious activity and protect against fraud</li>
              <li><strong>Legal Compliance:</strong> Comply with applicable laws and regulations</li>
            </ul>
          </section>

          {/* Google API Services */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Google API Services</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Ezra's use and transfer of information received from Google APIs adheres to the{' '}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                Google API Services User Data Policy
              </a>, including the Limited Use requirements.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              We only request the minimum Gmail permissions necessary to provide our service:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li><strong>Gmail Read:</strong> To analyze your email communication patterns</li>
              <li><strong>Gmail Send:</strong> To send approved responses on your behalf</li>
              <li><strong>Gmail Modify:</strong> To manage email threads and labels</li>
            </ul>
          </section>

          {/* Data Storage and Security */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Storage and Security</h2>
            <h3 className="text-xl font-medium text-gray-800 mb-3">5.1 Data Storage</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Your data is stored securely on Heroku's cloud infrastructure</li>
              <li>Email data is stored in encrypted PostgreSQL databases</li>
              <li>We retain your data only as long as necessary to provide our services</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3">5.2 Security Measures</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>All data transmission is encrypted using HTTPS/TLS</li>
              <li>Database connections are encrypted and secured</li>
              <li>Access to your data is restricted to authorized personnel only</li>
              <li>We implement industry-standard security practices</li>
              <li>Regular security audits and monitoring</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Sharing and Disclosure</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not sell, trade, or otherwise transfer your personal information to third parties, except in the following circumstances:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li><strong>Service Providers:</strong> We may share data with trusted third-party services that help us operate our platform (e.g., Google Cloud, Heroku)</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In the event of a merger or acquisition, your information may be transferred</li>
              <li><strong>With Your Consent:</strong> We may share information with your explicit consent</li>
            </ul>
          </section>

          {/* AI and Machine Learning */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. AI and Machine Learning</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Ezra uses artificial intelligence to analyze your emails and generate responses:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>We use Google's Gemini AI models to process your email content</li>
              <li>Your email data is used to train personalized models specific to your communication style</li>
              <li>We do not use your data to train general AI models that would benefit other users</li>
              <li>All AI processing is done securely and in accordance with this privacy policy</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Your Rights and Choices</h2>
            <p className="text-gray-700 leading-relaxed mb-4">You have the following rights regarding your data:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li><strong>Access:</strong> Request access to your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your data</li>
              <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
              <li><strong>Revoke Consent:</strong> Revoke Gmail access permissions at any time through your Google Account settings</li>
              <li><strong>Account Deletion:</strong> Delete your Ezra account and all associated data</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              To exercise these rights, please contact us at the information provided below.
            </p>
          </section>

          {/* Data Retention */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Data Retention</h2>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>We retain your email data only as long as necessary to provide our services</li>
              <li>You can request deletion of your data at any time</li>
              <li>When you delete your account, we will delete all associated data within 30 days</li>
              <li>Some data may be retained for legal compliance or security purposes</li>
            </ul>
          </section>

          {/* International Transfers */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your data may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Ezra is not intended for use by children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>Email:</strong> rushikbusiness@gmail.com</p>
              <p className="text-gray-700"><strong>Website:</strong> https://ezra-app-6228801c9f8d.herokuapp.com/</p>
            </div>
          </section>

          {/* Compliance */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Compliance</h2>
            <p className="text-gray-700 leading-relaxed">
              This Privacy Policy is designed to comply with applicable privacy laws including GDPR, CCPA, and other relevant regulations. We are committed to protecting your privacy and handling your data responsibly.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            © 2025 Ezra. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
} 