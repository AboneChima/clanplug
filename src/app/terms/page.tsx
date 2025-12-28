'use client';

import { IoArrowBack, IoDocumentTextOutline } from 'react-icons/io5';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';

export default function TermsPage() {
  const router = useRouter();

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
                <IoDocumentTextOutline className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Terms & Conditions</h1>
                <p className="text-sm text-white/80">Last updated: December 2024</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 space-y-6 text-gray-300">
            
            {/* Introduction */}
            <div>
              <h2 className="text-xl font-bold text-white mb-3">Welcome to ClanPlug</h2>
              <p className="text-sm leading-relaxed">
                By accessing and using ClanPlug, you accept and agree to be bound by these terms and conditions. 
                Please read them carefully before using our services. If you do not agree with any part of these terms, 
                you must not use our platform.
              </p>
            </div>

            {/* 1. Account Registration */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">1. Account Registration & Security</h3>
              <ul className="space-y-2 text-sm list-disc list-inside">
                <li>You must be at least 18 years old to create an account</li>
                <li>You must provide accurate and complete information during registration</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You must notify us immediately of any unauthorized access to your account</li>
                <li>One person may only have one account. Multiple accounts will be suspended</li>
                <li>You accept responsibility for all activities that occur under your account</li>
              </ul>
            </div>

            {/* 2. KYC Verification */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">2. KYC Verification Requirements</h3>
              <ul className="space-y-2 text-sm list-disc list-inside">
                <li><strong>Mandatory for Marketplace:</strong> You must complete KYC verification before posting any items for sale</li>
                <li>Valid government-issued ID is required (National ID, Driver's License, or International Passport)</li>
                <li>All submitted documents must be clear, valid, and belong to you</li>
                <li>Submitting fake or fraudulent documents will result in permanent account suspension</li>
                <li>KYC verification helps maintain a safe and trusted community</li>
                <li>We reserve the right to request additional verification at any time</li>
              </ul>
            </div>

            {/* 3. Verification Badge */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">3. Verification Badge</h3>
              <ul className="space-y-2 text-sm list-disc list-inside">
                <li>Verification badges cost ₦2,000 for 30 days</li>
                <li>Badges are non-refundable once purchased</li>
                <li>Benefits include: blue checkmark, ability to post media, and premium features</li>
                <li>Badges expire after 30 days and must be renewed</li>
                <li>Misuse of verification badge privileges will result in badge removal without refund</li>
              </ul>
            </div>

            {/* 4. Marketplace Rules */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">4. Marketplace Rules & Prohibited Items</h3>
              <p className="text-sm mb-2"><strong>You may NOT sell or post:</strong></p>
              <ul className="space-y-2 text-sm list-disc list-inside mb-3">
                <li>Illegal items, drugs, weapons, or stolen goods</li>
                <li>Counterfeit or fake products</li>
                <li>Adult content or services</li>
                <li>Items that violate intellectual property rights</li>
                <li>Hazardous or dangerous materials</li>
                <li>Live animals (except through approved channels)</li>
                <li>Human body parts or fluids</li>
                <li>Items that promote hate, violence, or discrimination</li>
              </ul>
              <p className="text-sm mb-2"><strong>Seller Responsibilities:</strong></p>
              <ul className="space-y-2 text-sm list-disc list-inside">
                <li>Provide accurate descriptions and real photos of items</li>
                <li>Honor the price and terms stated in your listing</li>
                <li>Ship items within the stated timeframe</li>
                <li>Respond to buyer inquiries promptly</li>
                <li>Accept escrow payments for buyer protection</li>
                <li>Pay the 5% marketplace fee on completed sales</li>
              </ul>
            </div>

            {/* 5. Escrow System */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">5. Escrow Payment System</h3>
              <ul className="space-y-2 text-sm list-disc list-inside">
                <li>All marketplace transactions must use our escrow system</li>
                <li>Buyer's payment is held securely until delivery is confirmed</li>
                <li>Sellers must ship items within 48 hours of payment</li>
                <li>Buyers have 7 days to confirm receipt or raise a dispute</li>
                <li>Attempting to bypass escrow will result in account suspension</li>
                <li>Disputes are reviewed by our team within 48 hours</li>
                <li>Our decision on disputes is final</li>
              </ul>
            </div>

            {/* 6. VTU Services */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">6. VTU Services (Airtime & Data)</h3>
              <ul className="space-y-2 text-sm list-disc list-inside">
                <li>VTU purchases are final and cannot be cancelled once processed</li>
                <li>Ensure phone numbers are correct before purchasing</li>
                <li>Delivery is usually instant but may take up to 5 minutes</li>
                <li>A 2% service fee applies to all VTU transactions</li>
                <li>Refunds are only issued for failed transactions (not delivered)</li>
                <li>We are not responsible for network provider issues</li>
              </ul>
            </div>

            {/* 7. Wallet & Payments */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">7. Wallet & Payment Terms</h3>
              <ul className="space-y-2 text-sm list-disc list-inside">
                <li><strong>Deposits:</strong> 3% fee, instant processing</li>
                <li><strong>Withdrawals:</strong> 3% fee, processed within 24 hours</li>
                <li>Minimum withdrawal: ₦1,000</li>
                <li>You must provide accurate bank details for withdrawals</li>
                <li>We are not responsible for funds sent to wrong bank accounts</li>
                <li>Suspicious transactions may be frozen for investigation</li>
                <li>We reserve the right to request source of funds documentation</li>
              </ul>
            </div>

            {/* 8. Prohibited Activities */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">8. Prohibited Activities & Consequences</h3>
              <p className="text-sm mb-2"><strong>The following will result in immediate account suspension:</strong></p>
              <ul className="space-y-2 text-sm list-disc list-inside">
                <li>Fraud, scamming, or deceptive practices</li>
                <li>Money laundering or illegal financial activities</li>
                <li>Harassment, bullying, or threatening other users</li>
                <li>Posting prohibited items or content</li>
                <li>Attempting to bypass fees or escrow system</li>
                <li>Using bots or automated systems</li>
                <li>Creating multiple accounts</li>
                <li>Impersonating other users or ClanPlug staff</li>
                <li>Sharing or selling account access</li>
                <li>Any activity that violates Nigerian law</li>
              </ul>
            </div>

            {/* 9. Content & Intellectual Property */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">9. Content & Intellectual Property</h3>
              <ul className="space-y-2 text-sm list-disc list-inside">
                <li>You retain ownership of content you post</li>
                <li>By posting, you grant us a license to display and distribute your content</li>
                <li>You must have rights to all content you post</li>
                <li>Do not post copyrighted material without permission</li>
                <li>We may remove content that violates these terms</li>
                <li>Repeated violations will result in account suspension</li>
              </ul>
            </div>

            {/* 10. Refunds & Cancellations */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">10. Refunds & Cancellations</h3>
              <ul className="space-y-2 text-sm list-disc list-inside">
                <li>VTU purchases: No refunds unless service fails to deliver</li>
                <li>Verification badges: Non-refundable</li>
                <li>Marketplace: Refunds handled through escrow dispute system</li>
                <li>Wallet deposits: Non-refundable (withdraw instead)</li>
                <li>Refund requests must be submitted within 7 days</li>
                <li>All refunds are subject to review and approval</li>
              </ul>
            </div>

            {/* 11. Privacy & Data */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">11. Privacy & Data Protection</h3>
              <ul className="space-y-2 text-sm list-disc list-inside">
                <li>We collect and store your personal information securely</li>
                <li>Your data is used only for platform operations and improvements</li>
                <li>We do not sell your personal information to third parties</li>
                <li>KYC documents are encrypted and stored securely</li>
                <li>You can request data deletion by contacting support</li>
                <li>We comply with Nigerian data protection regulations</li>
              </ul>
            </div>

            {/* 12. Liability & Disclaimers */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">12. Liability & Disclaimers</h3>
              <ul className="space-y-2 text-sm list-disc list-inside">
                <li>ClanPlug is a platform connecting buyers and sellers</li>
                <li>We are not responsible for the quality or legality of items sold</li>
                <li>Users transact at their own risk</li>
                <li>We are not liable for losses due to user error or negligence</li>
                <li>Our maximum liability is limited to the transaction amount</li>
                <li>We do not guarantee uninterrupted service availability</li>
              </ul>
            </div>

            {/* 13. Modifications */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">13. Modifications to Terms</h3>
              <ul className="space-y-2 text-sm list-disc list-inside">
                <li>We reserve the right to modify these terms at any time</li>
                <li>Changes will be posted on this page with updated date</li>
                <li>Continued use after changes constitutes acceptance</li>
                <li>Major changes will be communicated via email or notification</li>
              </ul>
            </div>

            {/* 14. Termination */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">14. Account Termination</h3>
              <ul className="space-y-2 text-sm list-disc list-inside">
                <li>We may suspend or terminate accounts that violate these terms</li>
                <li>You may close your account at any time</li>
                <li>Upon termination, you must withdraw all funds within 30 days</li>
                <li>Suspended accounts may be reinstated after review</li>
                <li>Permanently banned users cannot create new accounts</li>
              </ul>
            </div>

            {/* 15. Dispute Resolution */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">15. Dispute Resolution</h3>
              <ul className="space-y-2 text-sm list-disc list-inside">
                <li>All disputes should first be reported through our platform</li>
                <li>Our support team will mediate and make a decision</li>
                <li>Decisions are typically made within 48 hours</li>
                <li>If unsatisfied, disputes may be escalated to Nigerian courts</li>
                <li>These terms are governed by Nigerian law</li>
              </ul>
            </div>

            {/* Contact */}
            <div className="pt-4 border-t border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-2">Contact Us</h3>
              <p className="text-sm">
                For questions about these terms or to report violations, contact us at:
              </p>
              <p className="text-sm mt-2">
                <strong>Email:</strong> <a href="mailto:support@clanplug.com" className="text-blue-400 hover:underline">support@clanplug.com</a>
              </p>
              <p className="text-sm mt-1">
                <strong>Support:</strong> Available through Help & Support page
              </p>
            </div>

            {/* Acceptance */}
            <div className="pt-4 border-t border-slate-700 bg-blue-600/10 rounded-xl p-4">
              <p className="text-sm text-blue-400 font-medium">
                ✓ By using ClanPlug, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
