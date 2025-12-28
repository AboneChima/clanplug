'use client';

import { IoArrowBack } from 'react-icons/io5';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';

export default function TermsPage() {
  const router = useRouter();

  return (
    <AppShell hideNavOnMobile={true} hideBottomNavOnMobile={true}>
      <div className="min-h-screen bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
          <div className="w-full px-4 py-4 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <IoArrowBack className="w-5 h-5 text-gray-400" />
            </button>
            <h1 className="text-lg font-bold text-white">Terms & Conditions</h1>
          </div>
        </div>

        {/* Content - Full Width, Mobile Optimized */}
        <div className="w-full px-3 sm:px-4 py-4 sm:py-6 pb-24">
          <div className="bg-slate-800 border border-slate-700 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 text-gray-300">
            
            <div className="text-center pb-3 sm:pb-4 border-b border-slate-700">
              <h2 className="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2">ClanPlug Terms & Conditions</h2>
              <p className="text-[10px] sm:text-xs text-gray-400">Last Updated: December 25th, 2025</p>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-sm sm:text-lg font-semibold text-white mb-2 sm:mb-3">1. Acceptance of Terms</h3>
                <p className="text-xs sm:text-sm leading-relaxed">
                  By accessing or using ClanPlug ("the Platform"), you agree to be bound by these Terms and Conditions. 
                  If you do not agree to these terms, please do not use our services. We reserve the right to modify 
                  these terms at any time, and continued use of the Platform constitutes acceptance of any changes.
                </p>
              </div>

              <div>
                <h3 className="text-sm sm:text-lg font-semibold text-white mb-2 sm:mb-3">2. Account Registration & Security</h3>
                <p className="text-xs sm:text-sm leading-relaxed mb-2">
                  <strong className="text-white">Eligibility:</strong> You must be at least 18 years old to create an account and use ClanPlug services.
                </p>
                <p className="text-xs sm:text-sm leading-relaxed mb-2">
                  <strong className="text-white">Account Security:</strong> You are responsible for maintaining the confidentiality of your account 
                  credentials. Any activity under your account is your responsibility.
                </p>
                <p className="text-xs sm:text-sm leading-relaxed">
                  <strong className="text-white">One Account Policy:</strong> Each user is permitted only one account. Creating multiple accounts 
                  may result in suspension of all associated accounts.
                </p>
              </div>

              <div>
                <h3 className="text-sm sm:text-lg font-semibold text-white mb-2 sm:mb-3">3. KYC Verification</h3>
                <p className="text-xs sm:text-sm leading-relaxed mb-2">
                  <strong className="text-white">Requirement:</strong> Know Your Customer (KYC) verification is mandatory for users who wish to 
                  post items on the marketplace. This helps maintain a safe and trustworthy community.
                </p>
                <p className="text-xs sm:text-sm leading-relaxed mb-2">
                  <strong className="text-white">Documentation:</strong> You must submit valid government-issued identification documents. 
                  All documents are encrypted and stored securely.
                </p>
                <p className="text-xs sm:text-sm leading-relaxed">
                  <strong className="text-white">Consequences:</strong> Submitting fake or fraudulent documents will result in immediate and 
                  permanent account suspension, and may be reported to relevant authorities.
                </p>
              </div>

              <div>
                <h3 className="text-sm sm:text-lg font-semibold text-white mb-2 sm:mb-3">4. Verification Badge</h3>
                <p className="text-xs sm:text-sm leading-relaxed mb-2">
                  <strong className="text-white">Cost:</strong> The verification badge costs ₦2,000 for 30 days of premium access.
                </p>
                <p className="text-xs sm:text-sm leading-relaxed mb-2">
                  <strong className="text-white">Benefits:</strong> Verified users receive a blue checkmark next to their name, can post media 
                  content, and gain increased visibility on the platform.
                </p>
                <p className="text-xs sm:text-sm leading-relaxed">
                  <strong className="text-white">Non-Refundable:</strong> All verification badge purchases are final and non-refundable. 
                  The badge expires after 30 days and must be renewed.
                </p>
              </div>

              <div>
                <h3 className="text-sm sm:text-lg font-semibold text-white mb-2 sm:mb-3">5. Marketplace Rules & Regulations</h3>
                <p className="text-xs sm:text-sm leading-relaxed mb-2">
                  <strong className="text-white">Prohibited Items:</strong> The following items are strictly prohibited from being listed:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-3 sm:ml-4 mb-2 text-xs sm:text-sm">
                  <li>Illegal items, drugs, or controlled substances</li>
                  <li>Weapons, ammunition, or explosives</li>
                  <li>Counterfeit or pirated goods</li>
                  <li>Adult content or services</li>
                  <li>Stolen property or items obtained illegally</li>
                  <li>Live animals (except through approved channels)</li>
                </ul>
                <p className="text-xs sm:text-sm leading-relaxed mb-2">
                  <strong className="text-white">Seller Obligations:</strong> Sellers must provide accurate descriptions, authentic photos, 
                  ship items within 48 hours of payment confirmation, and accept escrow payments for all transactions.
                </p>
                <p className="text-xs sm:text-sm leading-relaxed">
                  <strong className="text-white">Buyer Protection:</strong> Buyers are protected through our escrow system. Always use the 
                  platform's payment system for your safety.
                </p>
              </div>

              <div>
                <h3 className="text-sm sm:text-lg font-semibold text-white mb-2 sm:mb-3">6. Escrow System</h3>
                <p className="text-xs sm:text-sm leading-relaxed mb-2">
                  <strong className="text-white">Mandatory Use:</strong> All marketplace transactions must use the escrow system. This protects 
                  both buyers and sellers from fraud.
                </p>
                <p className="text-xs sm:text-sm leading-relaxed mb-2">
                  <strong className="text-white">How It Works:</strong> Payment is held securely by ClanPlug until the buyer confirms receipt 
                  and satisfaction with the item. Only then is payment released to the seller.
                </p>
                <p className="text-xs sm:text-sm leading-relaxed">
                  <strong className="text-white">Bypassing Escrow:</strong> Attempting to bypass the escrow system or conducting transactions 
                  outside the platform will result in immediate account suspension.
                </p>
              </div>

              <div>
                <h3 className="text-sm sm:text-lg font-semibold text-white mb-2 sm:mb-3">7. Airtime & Data Services</h3>
                <p className="text-xs sm:text-sm leading-relaxed mb-2">
                  <strong className="text-white">Service Delivery:</strong> Airtime and data purchases are processed instantly. Delivery 
                  typically occurs within seconds to minutes.
                </p>
                <p className="text-xs sm:text-sm leading-relaxed mb-2">
                  <strong className="text-white">Final Sale:</strong> All airtime and data purchases are final. Refunds are only provided 
                  if delivery fails due to technical issues on our end.
                </p>
                <p className="text-xs sm:text-sm leading-relaxed">
                  <strong className="text-white">Service Fee:</strong> A 2% service fee applies to all airtime and data transactions.
                </p>
              </div>

              <div>
                <h3 className="text-sm sm:text-lg font-semibold text-white mb-2 sm:mb-3">8. Wallet & Transaction Fees</h3>
                <p className="text-xs sm:text-sm leading-relaxed mb-2">
                  <strong className="text-white">Fee Structure:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-3 sm:ml-4 mb-2 text-xs sm:text-sm">
                  <li>Deposits: 3% processing fee</li>
                  <li>Withdrawals: 3% processing fee</li>
                  <li>Airtime & Data: 2% service fee</li>
                  <li>Marketplace Transactions: 5% commission</li>
                  <li>Verification Badge: ₦2,000 per month</li>
                </ul>
                <p className="text-xs sm:text-sm leading-relaxed">
                  <strong className="text-white">Payment Methods:</strong> We accept bank transfers, card payments, and cryptocurrency. 
                  Processing times vary by method.
                </p>
              </div>

              <div>
                <h3 className="text-sm sm:text-lg font-semibold text-white mb-2 sm:mb-3">9. Prohibited Activities</h3>
                <p className="text-xs sm:text-sm leading-relaxed mb-2">
                  The following activities will result in immediate account suspension or termination:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-3 sm:ml-4 text-xs sm:text-sm">
                  <li>Fraud, scamming, or deceptive practices</li>
                  <li>Harassment, bullying, or threatening behavior</li>
                  <li>Creating multiple accounts to bypass restrictions</li>
                  <li>Attempting to bypass platform fees</li>
                  <li>Sharing or selling account access</li>
                  <li>Using automated bots or scripts without permission</li>
                  <li>Posting spam or unsolicited advertisements</li>
                  <li>Impersonating other users or entities</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm sm:text-lg font-semibold text-white mb-2 sm:mb-3">10. Refund Policy</h3>
                <p className="text-xs sm:text-sm leading-relaxed mb-2">
                  <strong className="text-white">Airtime & Data:</strong> Refunds are only issued if delivery fails due to technical issues. 
                  Wrong number entries are not eligible for refunds.
                </p>
                <p className="text-xs sm:text-sm leading-relaxed mb-2">
                  <strong className="text-white">Verification Badge:</strong> All badge purchases are non-refundable under any circumstances.
                </p>
                <p className="text-xs sm:text-sm leading-relaxed">
                  <strong className="text-white">Marketplace:</strong> Refunds are handled through the escrow dispute resolution process. 
                  Buyers must provide evidence of issues within 7 days of delivery.
                </p>
              </div>

              <div>
                <h3 className="text-sm sm:text-lg font-semibold text-white mb-2 sm:mb-3">11. Privacy & Data Protection</h3>
                <p className="text-xs sm:text-sm leading-relaxed mb-2">
                  <strong className="text-white">Data Security:</strong> We take your privacy seriously. All personal information and KYC 
                  documents are encrypted and stored securely.
                </p>
                <p className="text-xs sm:text-sm leading-relaxed mb-2">
                  <strong className="text-white">Information Usage:</strong> We use your data to provide services, prevent fraud, and improve 
                  the platform. We do not sell your personal information to third parties.
                </p>
                <p className="text-xs sm:text-sm leading-relaxed">
                  <strong className="text-white">Data Retention:</strong> We retain your data as long as your account is active and for a 
                  reasonable period afterward as required by law.
                </p>
              </div>

              <div>
                <h3 className="text-sm sm:text-lg font-semibold text-white mb-2 sm:mb-3">12. Dispute Resolution</h3>
                <p className="text-xs sm:text-sm leading-relaxed mb-2">
                  <strong className="text-white">Marketplace Disputes:</strong> All marketplace disputes must be reported within 7 days of 
                  delivery. Our support team will mediate and make a final decision.
                </p>
                <p className="text-xs sm:text-sm leading-relaxed">
                  <strong className="text-white">Platform Decisions:</strong> ClanPlug's decisions on disputes are final and binding. We reserve 
                  the right to suspend accounts involved in repeated disputes.
                </p>
              </div>

              <div>
                <h3 className="text-sm sm:text-lg font-semibold text-white mb-2 sm:mb-3">13. Limitation of Liability</h3>
                <p className="text-xs sm:text-sm leading-relaxed">
                  ClanPlug is not liable for any indirect, incidental, or consequential damages arising from your use of the platform. 
                  We provide the platform "as is" without warranties of any kind. Our total liability is limited to the amount of fees 
                  you paid to us in the past 12 months.
                </p>
              </div>

              <div>
                <h3 className="text-sm sm:text-lg font-semibold text-white mb-2 sm:mb-3">14. Termination</h3>
                <p className="text-xs sm:text-sm leading-relaxed">
                  We reserve the right to suspend or terminate your account at any time for violation of these terms, suspicious activity, 
                  or at our discretion. Upon termination, you may withdraw any remaining balance in your wallet, subject to our verification 
                  process.
                </p>
              </div>

              <div>
                <h3 className="text-sm sm:text-lg font-semibold text-white mb-2 sm:mb-3">15. Changes to Terms</h3>
                <p className="text-xs sm:text-sm leading-relaxed">
                  We may update these Terms and Conditions at any time. Significant changes will be communicated via email or platform 
                  notification. Continued use of the platform after changes constitutes acceptance of the new terms.
                </p>
              </div>

              <div className="pt-3 sm:pt-4 border-t border-slate-700">
                <p className="text-xs sm:text-sm leading-relaxed mb-2">
                  <strong className="text-white">Contact Us:</strong>
                </p>
                <p className="text-xs sm:text-sm leading-relaxed">
                  For questions about these terms or any issues with the platform, please contact us at{' '}
                  <a href="mailto:admin@clanplug.site" className="text-blue-400 hover:underline">
                    admin@clanplug.site
                  </a>
                </p>
              </div>

              <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-blue-400 text-center">
                  ✓ By using ClanPlug, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-slate-700/50">
              <p className="text-xs sm:text-sm text-gray-500">
                Developed by <span className="text-blue-400 font-semibold">De Oracle</span>
              </p>
              <p className="text-[10px] sm:text-xs text-gray-600 mt-1 sm:mt-2">© 2025 ClanPlug. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
