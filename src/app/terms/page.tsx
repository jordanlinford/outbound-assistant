export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Effective Date:</strong> {new Date().toLocaleDateString()}
            </p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using Outbound Assistant, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
              <p className="text-gray-700 mb-4">
                Outbound Assistant is an AI-powered email automation platform that helps users:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Create and manage email campaigns</li>
                <li>Generate AI-powered email content</li>
                <li>Automate outbound sales processes</li>
                <li>Track campaign performance</li>
                <li>Schedule and manage follow-ups</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
              <p className="text-gray-700 mb-4">You agree to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Use the service only for lawful purposes</li>
                <li>Comply with all applicable anti-spam laws (CAN-SPAM, GDPR, etc.)</li>
                <li>Obtain proper consent before sending emails to recipients</li>
                <li>Not use the service to send unsolicited or harmful content</li>
                <li>Maintain the security of your account credentials</li>
                <li>Respect rate limits and usage quotas</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibent text-gray-900 mb-4">4. Prohibited Uses</h2>
              <p className="text-gray-700 mb-4">You may not use our service to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Send spam or unsolicited bulk emails</li>
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Distribute malware or harmful content</li>
                <li>Impersonate others or provide false information</li>
                <li>Attempt to breach system security</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Service Availability</h2>
              <p className="text-gray-700 mb-4">
                We strive to maintain service availability but do not guarantee uninterrupted access. 
                We may suspend service for maintenance, updates, or security reasons.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Payment and Billing</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Subscription fees are billed in advance</li>
                <li>All fees are non-refundable unless required by law</li>
                <li>We may change pricing with 30 days notice</li>
                <li>Accounts may be suspended for non-payment</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data and Privacy</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                Outbound Assistant shall not be liable for any indirect, incidental, special, consequential, or punitive damages, 
                including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Termination</h2>
              <p className="text-gray-700 mb-4">
                Either party may terminate this agreement at any time. Upon termination, your access to the service will cease, 
                and we may delete your data according to our data retention policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Information</h2>
              <p className="text-gray-700">
                For questions about these terms, contact us at:
                <br />
                <strong>Email:</strong> legal@outboundassistant.com
                <br />
                <strong>Address:</strong> [Your Business Address]
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 