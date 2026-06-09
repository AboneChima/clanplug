'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IoShieldCheckmarkOutline,
  IoCheckmarkCircleOutline,
  IoStarOutline,
  IoTrophyOutline,
  IoArrowBackOutline,
  IoFlashOutline,
  IoRocketOutline,
} from 'react-icons/io5';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

type Plan = {
  id: string;
  name: string;
  duration: string;
  price: number;
  discount: number;
  popular?: boolean;
  icon: any;
  color: string;
};

export default function VerificationBadgePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans: Plan[] = [
    {
      id: 'monthly',
      name: 'Monthly',
      duration: '1 Month',
      price: 2000,
      discount: 0,
      icon: IoFlashOutline,
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: '6months',
      name: '6 Months',
      duration: '6 Months',
      price: 11400, // 5% discount: 12000 - 600
      discount: 5,
      popular: true,
      icon: IoTrophyOutline,
      color: 'from-purple-500 to-purple-600',
    },
    {
      id: 'yearly',
      name: 'Yearly',
      duration: '12 Months',
      price: 21600, // 10% discount: 24000 - 2400
      discount: 10,
      icon: IoRocketOutline,
      color: 'from-green-500 to-green-600',
    },
  ];

  const handleSubscribe = async (planId: string) => {
    if (!user?.isKYCVerified) {
      showToast('Complete KYC verification first', 'error');
      router.push('/kyc');
      return;
    }

    setLoading(true);
    setSelectedPlan(planId);

    try {
      const plan = plans.find(p => p.id === planId);
      if (!plan) return;

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verification-badge/subscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planId,
          amount: plan.price,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showToast('Verification badge activated!', 'success');
        router.push('/profile');
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to subscribe', 'error');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      showToast('Error processing subscription', 'error');
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const hasVerificationBadge = (user as any)?.verificationBadge?.status === 'verified' || (user as any)?.verificationBadge?.status === 'active';

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-xl border-b border-[#1a1a1a]">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <button onClick={() => router.back()} className="p-1.5 -ml-1 hover:bg-[#1a1a1a] rounded-full transition-colors">
            <IoArrowBackOutline className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white text-sm font-semibold">Premium Verification</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-3 py-4">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#0a0a0a] to-[#050505] border border-[#1a1a1a] rounded-xl p-4 mb-4 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center backdrop-blur-sm border border-blue-500/30">
            <IoShieldCheckmarkOutline className="w-7 h-7 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Choose Your Plan
          </h2>
          <p className="text-gray-400 text-xs max-w-sm mx-auto">
            Affordable and adaptable pricing to suit your goals.
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-[#0a0a0a] rounded-xl p-4 border border-[#1a1a1a] mb-4">
          <h3 className="text-sm font-semibold text-white mb-3">What&apos;s included:</h3>
          <div className="space-y-2">
            {[
              'Verified blue checkmark badge',
              'Priority listing visibility',
              'Enhanced profile credibility',
              'Build buyer trust instantly',
              'Stand out in marketplace',
              'Exclusive verified tag',
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <IoCheckmarkCircleOutline className="w-3 h-3 text-blue-400" />
                </div>
                <span className="text-gray-300 text-xs">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="space-y-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;
            const originalPrice = plan.duration === '6 Months' ? 12000 : plan.duration === '12 Months' ? 24000 : plan.price;
            
            return (
              <div
                key={plan.id}
                className={`relative bg-[#0a0a0a] rounded-xl p-3.5 border transition-all ${
                  plan.popular
                    ? 'border-blue-500/50 bg-gradient-to-br from-blue-500/5 to-transparent'
                    : 'border-[#1a1a1a] hover:border-[#2a2a2a]'
                } ${isSelected ? 'ring-1 ring-blue-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 rounded-full text-white text-[10px] font-semibold">
                    Recommended for you
                  </div>
                )}
                
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <h4 className="text-base font-semibold text-white">{plan.name}</h4>
                      <p className="text-xs text-gray-500">{plan.duration}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-xl font-bold text-white">₦{plan.price.toLocaleString()}</span>
                        <span className="text-xs text-gray-500">/month</span>
                      </div>
                      {plan.discount > 0 && (
                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                          <span className="text-[10px] text-gray-500 line-through">₦{originalPrice.toLocaleString()}</span>
                          <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded font-semibold">
                            {plan.discount}% OFF
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading || hasVerificationBadge}
                  className={`w-full py-2.5 rounded-lg font-semibold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#2a2a2a]'
                  }`}
                >
                  {loading && isSelected ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : hasVerificationBadge ? (
                    'Already Verified'
                  ) : (
                    plan.popular ? `Start with ${plan.name}` : `Get started`
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-gray-600">
            Subscription auto-renews. Cancel anytime from your settings.
          </p>
        </div>
      </div>
    </div>
  );
}
