'use client';

import { useState } from 'react';
import { 
  IoArrowBack,
  IoSendOutline,
  IoSparklesOutline,
  IoSearchOutline,
  IoChevronForwardOutline
} from 'react-icons/io5';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useToast } from '@/contexts/ToastContext';

// FAQ Database
const FAQ_DATABASE = [
  {
    question: "How do I buy airtime or data?",
    answer: "Go to the VTU page, enter your phone number, select the amount or data plan, and click Buy. The service will be delivered instantly to your number.",
    keywords: ["airtime", "data", "buy", "vtu", "recharge", "topup"]
  },
  {
    question: "Why do I need KYC verification?",
    answer: "KYC verification is required to post items on the marketplace and access certain features. It helps us maintain a safe and trusted community. You can verify your identity in the KYC section.",
    keywords: ["kyc", "verification", "verify", "identity", "marketplace", "post"]
  },
  {
    question: "How do I get a verification badge?",
    answer: "You can purchase a verification badge from your profile page. The badge costs ₦2,000 for 30 days and gives you premium features including the ability to post media and a blue checkmark next to your name.",
    keywords: ["badge", "verification badge", "blue check", "verified", "checkmark", "premium"]
  },
  {
    question: "How do I deposit money into my wallet?",
    answer: "Go to your Wallet page and click 'Deposit'. You can fund your wallet using bank transfer, card payment, or crypto. Deposits are usually instant.",
    keywords: ["deposit", "fund", "wallet", "money", "payment", "add money"]
  },
  {
    question: "How do I withdraw money?",
    answer: "Go to your Wallet, click 'Withdraw', enter the amount and your bank details. Withdrawals are processed within 24 hours. A small fee applies.",
    keywords: ["withdraw", "withdrawal", "cash out", "bank", "transfer"]
  },
  {
    question: "What is escrow and how does it work?",
    answer: "Escrow is a secure payment system for marketplace transactions. The buyer's payment is held safely until they confirm receiving the item. This protects both buyers and sellers from fraud.",
    keywords: ["escrow", "safe", "secure", "payment", "marketplace", "protection"]
  },
  {
    question: "How do I sell items on the marketplace?",
    answer: "First, complete your KYC verification. Then go to Marketplace > Create Listing. Add photos, description, price, and publish. Buyers can purchase using escrow for safety.",
    keywords: ["sell", "marketplace", "listing", "post", "item", "product"]
  },
  {
    question: "What are purchase requests?",
    answer: "Purchase requests let you ask other users to buy something for you. Create a request with details and budget, and other users can accept and fulfill it for you.",
    keywords: ["purchase request", "request", "buy for me", "orders"]
  },
  {
    question: "How do I report a user or listing?",
    answer: "Click the three dots menu on any post or user profile and select 'Report'. Choose the reason and submit. Our team reviews all reports within 24 hours.",
    keywords: ["report", "flag", "abuse", "scam", "fraud", "complaint"]
  },
  {
    question: "Why was my account suspended?",
    answer: "Accounts are suspended for violating our terms: posting prohibited items, scamming, harassment, or fraudulent activity. Contact support if you believe this was a mistake.",
    keywords: ["suspended", "banned", "blocked", "account", "violation"]
  },
  {
    question: "How do I change my password?",
    answer: "Go to Settings > Security > Change Password. Enter your current password and new password. For security, you'll be logged out and need to log in again.",
    keywords: ["password", "change password", "reset", "security", "login"]
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept bank transfers, debit/credit cards (via Flutterwave), and cryptocurrency (Bitcoin, USDT, Ethereum). All payments are secure and encrypted.",
    keywords: ["payment", "pay", "card", "bank", "crypto", "bitcoin"]
  },
  {
    question: "How long does KYC verification take?",
    answer: "KYC verification is usually instant if your documents are clear and valid. In some cases, manual review may take up to 24 hours. You'll receive a notification when approved.",
    keywords: ["kyc time", "how long", "verification time", "waiting"]
  },
  {
    question: "Can I cancel a transaction?",
    answer: "Escrow transactions can be cancelled before the seller confirms shipment. VTU purchases (airtime/data) cannot be cancelled once processed. Contact support for refund requests.",
    keywords: ["cancel", "refund", "return", "undo", "reverse"]
  },
  {
    question: "What are the transaction fees?",
    answer: "Deposit: 3%, Withdrawal: 3%, VTU: 2%, Marketplace: 5% (seller pays). Verification badge: ₦2,000/month. All fees are clearly shown before you confirm.",
    keywords: ["fees", "charges", "cost", "price", "commission"]
  }
];

export default function HelpPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'ai', content: string}>>([
    { role: 'ai', content: '👋 Hi! I\'m your ClanPlug AI assistant. Ask me anything about using the platform!' }
  ]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // AI Response Generator
  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Search FAQ database
    for (const faq of FAQ_DATABASE) {
      if (faq.keywords.some(keyword => lowerMessage.includes(keyword))) {
        return faq.answer;
      }
    }
    
    // Greeting responses
    if (lowerMessage.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
      return "Hello! 👋 How can I help you today? You can ask me about airtime/data purchases, KYC verification, wallet deposits, marketplace, or any other feature!";
    }
    
    // Thank you responses
    if (lowerMessage.match(/(thank|thanks|appreciate)/)) {
      return "You're welcome! 😊 Feel free to ask if you have any other questions. I'm here to help!";
    }
    
    // Default response with suggestions
    return "I'm not sure about that specific question, but I can help you with:\n\n• Buying airtime & data\n• KYC verification\n• Wallet deposits & withdrawals\n• Marketplace listings\n• Verification badges\n• Escrow payments\n• Purchase requests\n\nTry asking about any of these topics, or contact our support team at support@clanplug.com for personalized assistance!";
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // Add user message
    const userMsg = message.trim();
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setMessage('');
    setLoading(true);
    
    // Simulate AI thinking
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMsg);
      setChatHistory(prev => [...prev, { role: 'ai', content: aiResponse }]);
      setLoading(false);
    }, 800);
  };

  const handleQuickQuestion = (question: string) => {
    setMessage(question);
    setTimeout(() => handleSendMessage(), 100);
  };

  const filteredFAQs = searchQuery 
    ? FAQ_DATABASE.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.keywords.some(k => k.includes(searchQuery.toLowerCase()))
      )
    : FAQ_DATABASE.slice(0, 5);

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-[200px] lg:pb-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 py-4 mb-4">
          <div className="max-w-4xl mx-auto px-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-white/80 hover:text-white mb-3 transition-colors"
            >
              <IoArrowBack className="w-5 h-5" />
              <span className="text-sm">Back</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <IoSparklesOutline className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Help & Support</h1>
                <p className="text-sm text-white/80">AI-powered assistance</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 space-y-4">
          {/* AI Chat Section */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <IoSparklesOutline className="w-5 h-5 text-blue-400" />
                AI Assistant
              </h2>
              <p className="text-xs text-gray-400 mt-1">Ask me anything about ClanPlug</p>
            </div>

            {/* Chat Messages */}
            <div className="h-[400px] overflow-y-auto p-4 space-y-3">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-700 text-gray-200'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-700 rounded-2xl px-4 py-3">
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
                  className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || loading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium transition-all flex items-center gap-2"
                >
                  <IoSendOutline className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700 p-4">
            <h2 className="text-lg font-semibold text-white mb-4">Frequently Asked Questions</h2>
            
            {/* Search */}
            <div className="relative mb-4">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search FAQs..."
                className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              {filteredFAQs.map((faq, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuestion(faq.question)}
                  className="w-full flex items-center justify-between p-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors text-left group"
                >
                  <span className="text-sm text-white">{faq.question}</span>
                  <IoChevronForwardOutline className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-4">
            <h3 className="text-white font-semibold mb-2">Need More Help?</h3>
            <p className="text-sm text-gray-300 mb-3">
              Can't find what you're looking for? Our support team is here to help!
            </p>
            <a 
              href="mailto:support@clanplug.com"
              className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all"
            >
              Email Support
            </a>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
