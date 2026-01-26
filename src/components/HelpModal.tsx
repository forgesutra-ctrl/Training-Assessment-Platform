import { useState } from 'react'
import { X, HelpCircle, Book, MessageCircle, FileText, ChevronRight } from 'lucide-react'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

const HelpModal = ({ isOpen, onClose }: HelpModalProps) => {
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const faqs = [
    {
      question: 'How do I assess a trainer?',
      answer:
        'As a manager, go to your dashboard and click "New Assessment". Select a trainer from another team, fill in the ratings and comments, then submit.',
    },
    {
      question: 'How do I view my performance?',
      answer:
        'As a trainer, your dashboard shows your performance metrics, trends, and assessment history. Use the date range filter to view different periods.',
    },
    {
      question: 'Who can I assess?',
      answer:
        'Managers can only assess trainers from other teams, not their own direct reports. This ensures objective cross-team feedback.',
    },
    {
      question: 'How are ratings calculated?',
      answer:
        'Ratings are calculated as the average of all 6 parameters: Trainer\'s Readiness, Communication Skills, Domain Expertise, Knowledge Displayed, People Management, and Technical Skills.',
    },
    {
      question: 'How often should I assess?',
      answer:
        'Assessments should be submitted regularly, ideally monthly. The system tracks your assessment activity and provides reminders.',
    },
    {
      question: 'Can I edit an assessment after submitting?',
      answer:
        'No, assessments cannot be edited after submission to maintain data integrity. Contact an administrator if you need to make changes.',
    },
    {
      question: 'What if I receive an incorrect assessment?',
      answer:
        'Contact your manager or an administrator. They can review the assessment and take appropriate action if needed.',
    },
    {
      question: 'How do I change my password?',
      answer:
        'Go to Settings → Security tab, enter your current password and new password, then click "Update Password".',
    },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold">Help & Support</h2>
              <p className="text-sm text-primary-100 mt-1">Get help and find answers</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="card hover:shadow-lg transition-shadow text-left">
                <Book className="w-8 h-8 text-primary-600 mb-2" />
                <h3 className="font-semibold text-gray-900 mb-1">User Manual</h3>
                <p className="text-sm text-gray-600">Complete guide to using the platform</p>
              </button>
              <button className="card hover:shadow-lg transition-shadow text-left">
                <MessageCircle className="w-8 h-8 text-primary-600 mb-2" />
                <h3 className="font-semibold text-gray-900 mb-1">Contact Support</h3>
                <p className="text-sm text-gray-600">Get help from our support team</p>
              </button>
              <button className="card hover:shadow-lg transition-shadow text-left">
                <FileText className="w-8 h-8 text-primary-600 mb-2" />
                <h3 className="font-semibold text-gray-900 mb-1">FAQ</h3>
                <p className="text-sm text-gray-600">Frequently asked questions</p>
              </button>
            </div>

            {/* FAQ Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
              <div className="space-y-2">
                {faqs.map((faq, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => setActiveSection(activeSection === String(index) ? null : String(index))}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-900 text-left">{faq.question}</span>
                      <ChevronRight
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          activeSection === String(index) ? 'transform rotate-90' : ''
                        }`}
                      />
                    </button>
                    {activeSection === String(index) && (
                      <div className="px-4 pb-3 text-sm text-gray-600">{faq.answer}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Still Need Help?</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Email:</strong> support@trainingassessment.com
                </p>
                <p>
                  <strong>Phone:</strong> +1 (555) 123-4567
                </p>
                <p>
                  <strong>Hours:</strong> Monday - Friday, 9 AM - 5 PM EST
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HelpModal
