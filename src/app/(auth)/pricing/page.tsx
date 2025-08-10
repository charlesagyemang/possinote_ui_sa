'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Shield, Sparkles, ArrowRight, Users, MessageSquare, BarChart3, Clock, Globe, Award, CreditCard, DollarSign } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '₵0',
    initial_credits: 10,
    description: 'Perfect for testing and small projects',
    features: [
      '10 initial credits',
      'Basic analytics',
      'API access',
      'Email support',
      'Valid for 12 months'
    ],
    popular: false,
    color: 'from-gray-500 to-slate-600',
    bgColor: 'from-gray-500/10 to-slate-600/10',
    icon: Users,
    savings: null
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '₵80',
    initial_credits: 1000,
    description: 'Great for growing businesses',
    features: [
      '1,000 initial credits',
      'Advanced analytics',
      'Priority support',
      'Custom sender IDs',
      'Bulk messaging',
      'Valid for 12 months'
    ],
    popular: true,
    color: 'from-blue-500 to-purple-600',
    bgColor: 'from-blue-500/10 to-purple-600/10',
    icon: MessageSquare,
    savings: null
  },
  {
    id: 'business',
    name: 'Business',
    price: '₵800',
    initial_credits: 10000,
    description: 'For established businesses',
    features: [
      '10,000 initial credits',
      'Real-time analytics',
      '24/7 support',
      'Custom integrations',
      'Advanced reporting',
      'Webhook support',
      'Valid for 12 months'
    ],
    popular: false,
    color: 'from-purple-500 to-pink-600',
    bgColor: 'from-purple-500/10 to-pink-600/10',
    icon: BarChart3,
    savings: null
  }
];

export default function PricingPage() {
  const scrollToPlans = () => {
    const plansSection = document.getElementById('plans');
    if (plansSection) {
      plansSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              PossiNotify
            </h1>
          </div>
          <h2 className="text-4xl font-bold text-white mb-6">
            Choose Your Plan
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Start with our free tier and scale as you grow. All plans include initial credits to get you started.
          </p>
        </div>

        {/* Plan Cards */}
        <div id="plans" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-black/30 transition-all duration-300 ${
                plan.popular ? 'ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/25' : ''
              }`}
            >
              <CardHeader className={`bg-gradient-to-r ${plan.bgColor} border-b border-white/10 p-10`}>
                <div className="text-center space-y-4">
                  {plan.popular && (
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 px-4 py-2 rounded-xl">
                      <Star className="h-4 w-4 mr-2" />
                      Most Popular
                    </Badge>
                  )}
                  
                  <div className="flex items-center justify-center space-x-3">
                    <div className={`p-3 bg-gradient-to-r ${plan.color} rounded-2xl`}>
                      <plan.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">
                      {plan.name}
                    </CardTitle>
                  </div>
                  
                  <div className="text-5xl font-bold text-white">
                    {plan.price}
                    {plan.price !== 'Custom' && <span className="text-xl text-gray-400">/plan</span>}
                  </div>
                  
                  <p className="text-gray-400 text-sm">
                    {plan.description}
                  </p>
                </div>
              </CardHeader>
              
              <CardContent className="p-10 space-y-8">
                <div className="text-center p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-2xl">
                  <div className="text-4xl font-bold text-white">
                    {plan.initial_credits.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">
                    Initial Credits
                  </div>
                </div>
                
                <ul className="space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="p-1 bg-green-500/20 rounded-lg mt-0.5">
                        <Check className="h-4 w-4 text-green-400" />
                      </div>
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="pt-4">
                  <Link href={`/signup?plan=${plan.id}`}>
                    <Button 
                      className={`w-full h-12 rounded-xl text-lg font-medium transition-all duration-300 ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25' 
                          : 'bg-gradient-to-r from-gray-600 to-slate-700 hover:from-gray-700 hover:to-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{plan.id === 'enterprise' ? 'Contact Sales' : 'Get Started'}</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-gray-400 text-lg">
              Simple, transparent pricing with no hidden fees
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl border border-white/10">
              <div className="p-4 bg-blue-500/20 rounded-2xl w-fit mx-auto mb-6">
                <CreditCard className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">1. Choose Your Plan</h3>
              <p className="text-gray-400">
                Select a plan that fits your needs. Each plan comes with initial credits to get you started.
              </p>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-3xl border border-white/10">
              <div className="p-4 bg-green-500/20 rounded-2xl w-fit mx-auto mb-6">
                <MessageSquare className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">2. Send Messages</h3>
              <p className="text-gray-400">
                Use our API to send SMS and email notifications. Each message costs credits based on the service.
              </p>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl border border-white/10">
              <div className="p-4 bg-purple-500/20 rounded-2xl w-fit mx-auto mb-6">
                <DollarSign className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">3. Top Up When Needed</h3>
              <p className="text-gray-400">
                Buy more credits anytime. No monthly commitments or hidden fees.
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Why Choose PossiNotify?
            </h2>
            <p className="text-gray-400 text-lg">
              Built for developers, trusted by businesses worldwide
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl border border-white/10">
              <div className="p-4 bg-blue-500/20 rounded-2xl w-fit mx-auto mb-6">
                <Zap className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Lightning Fast</h3>
              <p className="text-gray-400">
                Deliver notifications in milliseconds with our optimized infrastructure
              </p>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-3xl border border-white/10">
              <div className="p-4 bg-green-500/20 rounded-2xl w-fit mx-auto mb-6">
                <Shield className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Enterprise Security</h3>
              <p className="text-gray-400">
                Bank-level security with end-to-end encryption and compliance
              </p>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl border border-white/10">
              <div className="p-4 bg-purple-500/20 rounded-2xl w-fit mx-auto mb-6">
                <Sparkles className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Developer First</h3>
              <p className="text-gray-400">
                Simple APIs, comprehensive docs, and 24/7 developer support
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-400 text-lg">
              Everything you need to know about our pricing and features
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-6 bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-400" />
                <span>Do initial credits expire?</span>
              </h3>
              <p className="text-gray-400">
                Initial credits are valid for 12 months from account creation. You can use them anytime within that period.
              </p>
            </div>
            
            <div className="p-6 bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-400" />
                <span>What happens when I run out of credits?</span>
              </h3>
              <p className="text-gray-400">
                You&apos;ll receive a notification when you reach 10% of your credits. You can top up anytime to continue sending.
              </p>
            </div>
            
            <div className="p-6 bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                <Award className="h-5 w-5 text-purple-400" />
                <span>Can I get a refund?</span>
              </h3>
              <p className="text-gray-400">
                We offer a 30-day money-back guarantee for unused credits. Contact support for assistance.
              </p>
            </div>
            
            <div className="p-6 bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                <Globe className="h-5 w-5 text-amber-400" />
                <span>Is there a setup fee?</span>
              </h3>
              <p className="text-gray-400">
                No setup fees. You only pay for the plan you choose. Create an account and start sending immediately.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="p-8 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-3xl border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-gray-400 mb-6">
              Create your account and choose your plan. Start sending notifications in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={scrollToPlans}
                className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-xl px-8 py-3 text-lg font-medium shadow-lg shadow-teal-500/25"
              >
                <div className="flex items-center space-x-2">
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Button>
              <Link href="/login">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-xl px-8 py-3 text-lg font-medium">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 