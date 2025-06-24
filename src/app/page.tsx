import Link from 'next/link';
import { 
  EnvelopeIcon, 
  CalendarIcon, 
  ChartBarIcon, 
  LinkIcon,
  CheckIcon,
  StarIcon,
  ArrowRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import ROICalculator from '@/components/ROICalculator';

const features = [
  {
    name: 'AI-Powered Email Sequences',
    description: 'Generate personalized, high-converting email sequences using GPT-4. Each email is tailored to your prospect\'s industry and role.',
    icon: EnvelopeIcon,
  },
  {
    name: 'Smart Calendar Booking',
    description: 'Automatically schedule meetings with qualified prospects. Sync with Google Calendar and send reminders.',
    icon: CalendarIcon,
  },
  {
    name: 'Multi-Channel Outreach',
    description: 'Reach prospects through email and LinkedIn with unified tracking and follow-up sequences.',
    icon: LinkIcon,
  },
  {
    name: 'Real-Time Analytics',
    description: 'Track opens, clicks, replies, and meetings booked. Get insights to optimize your campaigns.',
    icon: ChartBarIcon,
  },
];

const bdrFeatures = [
  {
    name: 'AI Prospecting & Research',
    description: 'Automatically finds and researches prospects, writes personalized outreach, and manages follow-ups. Does the work of 3 junior BDRs.',
    icon: EnvelopeIcon,
    bdrEquivalent: '3 Junior BDRs',
    monthlyCost: '$9,000'
  },
  {
    name: '24/7 Email Automation',
    description: 'Sends personalized emails, handles replies, books meetings, and nurtures prospects around the clock. Never sleeps, never takes breaks.',
    icon: CalendarIcon,
    bdrEquivalent: '2 Senior BDRs',
    monthlyCost: '$12,000'
  },
  {
    name: 'LinkedIn Outreach & Content',
    description: 'Generates LinkedIn content, sends connection requests, manages conversations, and builds your personal brand automatically.',
    icon: LinkIcon,
    bdrEquivalent: '1 Social Selling Specialist',
    monthlyCost: '$6,000'
  },
  {
    name: 'Meeting Coordination & CRM',
    description: 'Books qualified meetings, sends reminders, tracks all interactions, and provides detailed analytics on every prospect.',
    icon: ChartBarIcon,
    bdrEquivalent: '1 Sales Coordinator',
    monthlyCost: '$4,000'
  },
];

const roiCalculation = {
  traditionalBDR: {
    salary: 60000,
    benefits: 18000,
    training: 5000,
    tools: 3000,
    management: 12000,
    total: 98000
  },
  aiAssistant: {
    subscription: 600, // $50/month * 12
    setup: 0,
    maintenance: 0,
    total: 600
  }
};

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Sales Director',
    company: 'TechCorp',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    content: 'Outbound Assistant increased our response rate by 300% and booked 2x more meetings. The AI sequences are incredibly effective.',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Founder',
    company: 'StartupX',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    content: 'As a solo founder, this tool is a game-changer. It\'s like having a full-time BDR that never sleeps.',
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'VP Sales',
    company: 'GrowthCo',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    content: 'The ROI is incredible. We\'re closing 40% more deals with half the manual work. Highly recommend!',
    rating: 5,
  },
];

const stats = [
  { name: 'Response Rate Increase', value: '300%' },
  { name: 'Time Saved Weekly', value: '20+ hrs' },
  { name: 'Meetings Booked', value: '10,000+' },
  { name: 'Customer Satisfaction', value: '98%' },
];

export default function Home() {
  return (
    <div className="bg-white">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5 flex items-center">
              <img 
                src="/outbound-assistant-logo.svg" 
                alt="Outbound Assistant" 
                className="h-8 w-auto"
              />
            </Link>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            <Link href="#features" className="text-sm font-semibold leading-6 text-gray-900 hover:text-indigo-600">
              Features
            </Link>
            <Link href="#testimonials" className="text-sm font-semibold leading-6 text-gray-900 hover:text-indigo-600">
              Testimonials
            </Link>
            <Link href="/pricing" className="text-sm font-semibold leading-6 text-gray-900 hover:text-indigo-600">
              Pricing
            </Link>
          </div>
          <div className="flex flex-1 justify-end gap-x-6">
            <Link href="/login" className="text-sm font-semibold leading-6 text-gray-900 hover:text-indigo-600">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Start Free Trial
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero section */}
        <div className="relative isolate px-6 pt-14 lg:px-8">
          <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
            <div className="hidden sm:mb-8 sm:flex sm:justify-center">
              <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
                💰 Save $180,000/year vs hiring a BDR team.{' '}
                <a href="#roi" className="font-semibold text-indigo-600">
                  <span className="absolute inset-0" aria-hidden="true" />
                  See the math <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <img 
                  src="/outbound-assistant-logo.svg" 
                  alt="Outbound Assistant" 
                  className="h-24 w-auto"
                />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Your AI BDR Team That Never Sleeps
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Replace expensive BDR hires with AI that handles prospecting, email sequences, follow-ups, and meeting booking. 
                Get the sales results without the $60K+ salary, benefits, and training costs.
              </p>
              <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6 max-w-lg mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-800 mb-2">
                    $49.99/month vs $5,000+/month BDR
                  </div>
                  <div className="text-sm text-green-700">
                    Same results • 99% cost savings • Available 24/7
                  </div>
                </div>
              </div>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  href="/signup"
                  className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Start Your AI BDR Team
                </Link>
                <Link href="#demo" className="text-sm font-semibold leading-6 text-gray-900">
                  Watch 2-min demo <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-indigo-600">24/7</div>
                  <div className="text-sm text-gray-600">Always working</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-indigo-600">2 min</div>
                  <div className="text-sm text-gray-600">Setup time</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-indigo-600">99%</div>
                  <div className="text-sm text-gray-600">Cost savings</div>
                </div>
              </div>
              <div className="mt-8">
                <p className="text-sm text-gray-500">
                  ✓ No hiring hassles ✓ No training required ✓ No salary + benefits ✓ Instant results
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats section */}
        <div className="bg-indigo-600 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.name} className="mx-auto flex max-w-xs flex-col gap-y-4">
                  <dt className="text-base leading-7 text-indigo-200">{stat.name}</dt>
                  <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Features section */}
        <div id="features" className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-indigo-600">Complete BDR Replacement</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Everything a BDR team does, but better
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Our AI handles every aspect of business development - from prospecting to booking meetings. 
                Get the results of an entire BDR team for 99% less cost.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                {bdrFeatures.map((feature) => (
                  <div key={feature.name} className="relative pl-16">
                    <dt className="text-base font-semibold leading-7 text-gray-900">
                      <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                        <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </div>
                      <div className="flex justify-between items-start">
                        <span>{feature.name}</span>
                        <div className="text-right text-sm">
                          <div className="text-gray-500">{feature.bdrEquivalent}</div>
                          <div className="text-red-600 font-medium">{feature.monthlyCost}/mo</div>
                        </div>
                      </div>
                    </dt>
                    <dd className="mt-2 text-base leading-7 text-gray-600">{feature.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* ROI Calculator Section */}
        <div id="roi" className="bg-gray-50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                The Real Cost of Hiring BDRs
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Most founders underestimate the true cost of building a BDR team. Here's the reality:
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-4xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Traditional BDR Team */}
                <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-red-200">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Traditional BDR Team</h3>
                    <p className="text-gray-600">What most founders think vs reality</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Salary (1 BDR)</span>
                      <span className="font-medium">$60,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Benefits & Taxes (30%)</span>
                      <span className="font-medium">$18,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Training & Onboarding</span>
                      <span className="font-medium">$5,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tools & Software</span>
                      <span className="font-medium">$3,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Management Overhead</span>
                      <span className="font-medium">$12,000</span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-xl font-bold">
                        <span>Total Annual Cost</span>
                        <span className="text-red-600">$98,000</span>
                      </div>
                      <div className="text-center mt-2 text-sm text-gray-500">
                        Per month: $8,167
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-red-50 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">Hidden Costs:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• 3-6 months to get productive</li>
                      <li>• High turnover (avg 18 months)</li>
                      <li>• Vacation, sick days, holidays</li>
                      <li>• Inconsistent performance</li>
                      <li>• Office space & equipment</li>
                    </ul>
                  </div>
                </div>

                {/* AI Assistant */}
                <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-green-500">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Outbound Assistant AI</h3>
                    <p className="text-gray-600">Complete BDR team replacement</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Subscription</span>
                      <span className="font-medium">$50</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Setup & Training</span>
                      <span className="font-medium">$0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Benefits & Taxes</span>
                      <span className="font-medium">$0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Management Time</span>
                      <span className="font-medium">$0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Downtime/Vacation</span>
                      <span className="font-medium">$0</span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-xl font-bold">
                        <span>Total Annual Cost</span>
                        <span className="text-green-600">$600</span>
                      </div>
                      <div className="text-center mt-2 text-sm text-gray-500">
                        Per month: $50
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Bonus Benefits:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Works 24/7/365</li>
                      <li>• Instant setup (2 minutes)</li>
                      <li>• Consistent performance</li>
                      <li>• Scales infinitely</li>
                      <li>• Never quits or gets sick</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Savings Summary */}
              <div className="mt-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-8 text-white text-center">
                <h3 className="text-3xl font-bold mb-4">Your Annual Savings</h3>
                <div className="text-6xl font-bold mb-2">$97,400</div>
                <p className="text-xl opacity-90 mb-6">That's enough to hire 2 more developers or fund your runway for another year</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="bg-white/20 rounded-lg p-4">
                    <div className="text-2xl font-bold">163x</div>
                    <div className="text-sm opacity-90">ROI in first year</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4">
                    <div className="text-2xl font-bold">99.4%</div>
                    <div className="text-sm opacity-90">Cost reduction</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4">
                    <div className="text-2xl font-bold">2 min</div>
                    <div className="text-sm opacity-90">Setup time</div>
                  </div>
                </div>

                <div className="mt-8">
                  <Link
                    href="/signup"
                    className="bg-white text-green-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
                  >
                    Start Saving $97,400/Year Today
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROI Calculator section */}
        <div id="roi" className="bg-gray-50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <ROICalculator />
          </div>
        </div>

        {/* Testimonials section */}
        <div id="testimonials" className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-xl text-center">
              <h2 className="text-lg font-semibold leading-8 tracking-tight text-indigo-600">Testimonials</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Loved by sales teams worldwide
              </p>
            </div>
            <div className="mx-auto mt-16 flow-root max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {testimonials.map((testimonial) => (
                  <div key={testimonial.name} className="bg-white p-8 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-x-1 text-yellow-400 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <StarIcon key={i} className="h-5 w-5 fill-current" />
                      ))}
                    </div>
                    <blockquote className="text-gray-900">
                      <p>"{testimonial.content}"</p>
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-x-4">
                      <img className="h-10 w-10 rounded-full bg-gray-50" src={testimonial.image} alt="" />
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-gray-600">{testimonial.role} at {testimonial.company}</div>
                      </div>
                    </figcaption>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Email connection section */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Connect Your Email in 2 Minutes
              </h2>
              <p className="mt-2 text-lg leading-8 text-gray-600">
                Choose your email provider and start automating your outreach today
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <div className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-2">
                <div className="flex flex-col bg-gray-50 p-8 rounded-2xl">
                  <div className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <EnvelopeIcon className="h-5 w-5 flex-none text-indigo-600" aria-hidden="true" />
                    Gmail
                  </div>
                  <div className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">Connect your Gmail account with one click. Full OAuth security and permission control.</p>
                    <div className="mt-6">
                      <Link
                        href="/api/auth/google"
                        className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                      >
                        Connect Gmail
                        <ArrowRightIcon className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col bg-gray-50 p-8 rounded-2xl">
                  <div className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <EnvelopeIcon className="h-5 w-5 flex-none text-indigo-600" aria-hidden="true" />
                    Outlook
                  </div>
                  <div className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">Connect your Microsoft Outlook account. Works with Office 365 and Outlook.com.</p>
                    <div className="mt-6">
                      <Link
                        href="/api/auth/microsoft"
                        className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                      >
                        Connect Outlook
                        <ArrowRightIcon className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA section */}
        <div className="bg-indigo-600">
          <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to 10x your outbound?
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-indigo-200">
                Join thousands of sales professionals who've transformed their outreach with AI.
                Start your free trial today.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  href="/signup"
                  className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white flex items-center gap-x-2"
                >
                  Start Free Trial
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <Link href="/pricing" className="text-sm font-semibold leading-6 text-white hover:text-indigo-200">
                  View Pricing <span aria-hidden="true">→</span>
                </Link>
              </div>
              <p className="mt-4 text-sm text-indigo-200">
                ✓ 14-day free trial ✓ No setup fees ✓ Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <Link href="/pricing" className="text-gray-400 hover:text-gray-500">
              Pricing
            </Link>
            <Link href="/privacy" className="text-gray-400 hover:text-gray-500">
              Privacy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-gray-500">
              Terms
            </Link>
            <Link href="/login" className="text-gray-400 hover:text-gray-500">
              Login
            </Link>
            <Link href="/signup" className="text-gray-400 hover:text-gray-500">
              Sign Up
            </Link>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-gray-500">
              &copy; 2024 Outbound Assistant. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
