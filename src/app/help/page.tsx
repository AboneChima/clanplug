'use client';

import { useState } from 'react';
import { IoArrowBackOutline, IoChevronDownOutline, IoChevronUpOutline, IoChatbubbleOutline, IoMailOutline } from 'react-icons/io5';
import AppShell from '@/components/AppShell';
import { useRouter } from 'next/navigation';

const faqs = [
  {
    category: 'Account',
    questions: [
      {
        q: 'How do I verify my account?',
        a: 'Go to KYC Verification from the sidebar menu. Upload your ID card and selfie to complete the verification process. Verified accounts get a blue badge and access to premium features.'
      },
      {
        q: 'How do I change my profile picture?',
        a: 'Visit your Profile page and tap on your avatar. You can upload a new photo directly from there, or go to Settings > Edit Profile.'
      },
      {
        q: 'Can I change my username?',
        a: 'Yes! Go to Settings, tap on your profile card, and edit your username in the profile editor.'
      }
    ]
  },
  {
    category: 'Wallet & Payments',
    questions: [
      {
        q: 'How do I add money to my wallet?',
        a: 'Go to Wallet and tap "Fund Wallet". You can add money via bank transfer, card payment, or crypto deposit.'
      },
      {
        q: 'How do I send money to another user?',
        a: 'In your Wallet, select "Transfer" and enter the recipient\'s username or email. Enter the amount and confirm the transfer.'
      },
      {
        q: 'Are transactions secure?',
        a: 'Yes! All transactions are encrypted and protected. We use industry-standard security measures to keep your funds safe.'
      }
    ]
  },
  {
    category: 'Marketplace',
    questions: [
      {
        q: 'How do I list an item for sale?',
        a: 'Go to Shop and tap the "+" button. Fill in the details, upload photos, set your price, and publish your listing.'
      },
      {
        q: 'What is escrow protection?',
        a: 'Escrow holds the buyer\'s payment securely until both parties confirm the transaction is complete. This protects both buyers and sellers.'
      },
      {
        q: 'How do I track my orders?',
        a: 'Visit the Orders page from the sidebar to see all your purchases and sales, along with their current status.'
      }
    ]
  },
  {
    category: 'VTU Services',
    questions: [
      {
        q: 'What VTU services are available?',
        a: 'You can buy airtime, data bundles, pay electricity bills, and purchase cable TV subscriptions directly from your wallet.'
      },
      {
        q: 'How long does it take to receive airtime/data?',
        a: 'Most VTU services are instant. You\'ll receive your airtime or data within seconds of payment.'
      },
      {
        q: 'Can I get a refund if something goes wrong?',
        a: 'Yes! If your VTU purchase fails, the amount will be automatically refunded to your wallet within 24 hours.'
      }
    ]
  }
];

export default function HelpPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleFAQ = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-black pb-20 lg:pb-8">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-xl border-b border-[#2f3336] px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors">
            <IoArrowBackOutline className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Help & FAQ</h1>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Contact Support */}
          <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                <IoChatbubbleOutline className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-white font-semibold mb-2">Need More Help?</h2>
                <p className="text-gray-400 text-sm mb-4">Can't find what you're looking for? Our support team is here to help.</p>
                <div className="flex flex-wrap gap-2">
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2">
                    <IoChatbubbleOutline className="w-4 h-4" />
                    Live Chat
                  </button>
                  <button className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white text-sm rounded-lg transition-colors flex items-center gap-2">
                    <IoMailOutline className="w-4 h-4" />
                    Email Us
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Categories */}
          {faqs.map((category, catIndex) => (
            <div key={catIndex} className="space-y-3">
              <h3 className="text-white font-semibold text-lg px-2">{category.category}</h3>
              <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-[#2f3336]">
                {category.questions.map((faq, qIndex) => {
                  const id = `${catIndex}-${qIndex}`;
                  const isOpen = openIndex === id;
                  
                  return (
                    <div key={qIndex} className={qIndex !== 0 ? 'border-t border-[#2f3336]' : ''}>
                      <button
                        onClick={() => toggleFAQ(id)}
                        className="w-full px-4 py-4 flex items-center justify-between hover:bg-[#2a2a2a] transition-colors"
                      >
                        <span className="text-white text-sm font-medium text-left">{faq.q}</span>
                        {isOpen ? (
                          <IoChevronUpOutline className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                        ) : (
                          <IoChevronDownOutline className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4">
                          <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* App Info */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2f3336]">
            <h3 className="text-white font-semibold mb-4">About ClanPlug</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Version</span>
                <span className="text-white">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Platform</span>
                <span className="text-white">Web</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last Updated</span>
                <span className="text-white">May 2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
