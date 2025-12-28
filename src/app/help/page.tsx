'use client';

import { useState } from 'react';
import { 
  IoArrowBack,
  IoSendOutline,
  IoSparklesOutline,
  IoMailOutline,
  IoDocumentTextOutline,
  IoHelpCircleOutline,
  IoCloseOutline,
  IoChatbubbleEllipsesOutline
} from 'react-icons/io5';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useToast } from '@/contexts/ToastContext';

// FAQ Database
const FAQS = [
  {
    q: "How do I buy airtime or data?",
    a: "Go to VTU page, enter phone number, select amount/plan, and click Buy. Delivery is instant."
  },
  {
    q: "Why do I need KYC verification?",
    a: "KYC is required to post items on marketplace. It helps maintain a safe community."
  },
  {
    q: "How do I get a verification badge?",
    a: "Purchase from your profile page for ₦2,000/month. Get blue checkmark and premium features."
  },
  {
    q: "How do I deposit money?",
    a: "Go to Wallet > Deposit. Use bank transfer, card, or crypto. Usually instant."
  },
  {
    q: "How does escrow work?",
    a: "Payment is held safely until buyer confirms receipt. Protects both parties from fraud."
  },
  {
    q: "What are the fees?",
    a: "Deposit: 3%, Withdrawal: 3%, VTU: 2%, Marketplace: 5%. Verification: ₦2,000/month."
  }
];

export default function HelpPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [showAIChat, setShowAIChat] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'ai', content: string}>>([
    { role: 'ai', content: '👋 Hi! Ask me anything about ClanPlug!' }
  ]);
  const [loading, setLoading] = useState(false);

  const generateAIResponse = (userMessage: string): string => {
    const lower = userMessage.toLowerCase();
    
    // Search FAQs
    for (const faq of FAQS) {
      if (lower.includes(faq.q.toLowerCase().split(' ').slice(0, 3).join(' '))) {
        return faq.a;
      }
    }
    
    if (lower.match(/^(hi|hello|hey)/)) {
      return "Hello! 👋 How can I help you today?";
    }
    
    if (lower.match(/(thank|thanks)/)) {
      return "You're welcome! 😊 Anything else I can help with?";
    }
    
    return "I can help with airtime/data, KYC, wallet, marketplace, badges, and more. Try asking about any of these!";
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const userMsg = message.trim();
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setMessage('');
    setLoading(true);
    
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMsg);
      setChatHistory(prev => [...prev, { role: 'ai', content: aiResponse }]);
      setLoading(false);
    }, 800);
  };

  return (
    <AppShell hideNavOnMobile={true} hideBottomNavOnMobile={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Clean Header */}
        <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <IoArrowBack className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">Help & Support</h1>
              <p className="text-xs text-gray-400">We're here to help</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4 pb-24">
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href="mailto:support@clanplug.com"
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <IoMailOutline className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Email Us</h3>
              <p className="text-xs text-gray-400">Get help via email</p>
            </a>

            <button
              onClick={() => router.push('/terms')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <IoDocumentTextOutline className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Terms</h3>
              <p className="text-xs text-gray-400">Read our terms</p>
            </button>
          </div>

          {/* FAQs */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <IoHelpCircleOutline className="w-5 h-5 text-blue-400" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {FAQS.map((faq, idx) => (
                <details key={idx} className="group">
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors">
                      <span className="text-sm text-white font-medium">{faq.q}</span>
                      <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </summary>
                  <div className="mt-2 px-3 py-2 text-sm text-gray-300 bg-slate-700/30 rounded-lg">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-blue-400 mb-2">Need More Help?</h3>
            <p className="text-xs text-gray-300 mb-3">
              Our support team responds within 24 hours
            </p>
            <a 
              href="mailto:support@clanplug.com"
              className="text-sm text-blue-400 hover:underline"
            >
              support@clanplug.com
            </a>
          </div>
        </div>

        {/* Floating AI Chat Button */}
        <button
          onClick={() => setShowAIChat(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-50"
        >
          <IoChatbubbleEllipsesOutline className="w-6 h-6 text-white" />
        </button>

        {/* AI Chat Modal */}
        {showAIChat && (
          <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowAIChat(false)}>
            <div className="bg-slate-800 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md sm:mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                    <IoSparklesOutline className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
                    <p className="text-xs text-gray-400">Ask me anything</p>
                  </div>
                </div>
                <button onClick={() => setShowAIChat(false)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                  <IoCloseOutline className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-700 text-gray-200'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-700 rounded-2xl px-4 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-slate-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your question..."
                    className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-all"
                  >
                    <IoSendOutline className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
