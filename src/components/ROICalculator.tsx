'use client';

import { useState } from 'react';

interface ROIData {
  bdrSalary: number;
  numberOfBdrs: number;
  benefits: number;
  tools: number;
  management: number;
  totalYearlyCost: number;
  ourCost: number;
  savings: number;
  roi: number;
}

export default function ROICalculator() {
  const [bdrCount, setBdrCount] = useState(2);
  const [avgSalary, setAvgSalary] = useState(65000);
  const [planType, setPlanType] = useState<'monthly' | 'yearly'>('yearly');

  const calculateROI = (): ROIData => {
    const baseSalary = avgSalary * bdrCount;
    const benefits = baseSalary * 0.25; // 25% benefits
    const tools = 3000 * bdrCount; // Sales tools per BDR
    const management = 15000 * Math.ceil(bdrCount / 5); // Manager for every 5 BDRs
    const totalYearlyCost = baseSalary + benefits + tools + management;
    
    const ourCost = planType === 'yearly' ? 500 : 599.88; // $49.99 * 12
    const savings = totalYearlyCost - ourCost;
    const roi = ((savings / ourCost) * 100);

    return {
      bdrSalary: baseSalary,
      numberOfBdrs: bdrCount,
      benefits,
      tools,
      management,
      totalYearlyCost,
      ourCost,
      savings,
      roi
    };
  };

  const roi = calculateROI();

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          💰 ROI Calculator
        </h2>
        <p className="text-lg text-gray-600">
          See how much you'll save by replacing your BDR team with AI
        </p>
      </div>

      {/* Input Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of BDRs
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={bdrCount}
            onChange={(e) => setBdrCount(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            aria-label="Number of BDRs"
          />
          <div className="text-center mt-2">
            <span className="text-2xl font-bold text-indigo-600">{bdrCount}</span>
            <span className="text-sm text-gray-500 ml-1">BDRs</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Average BDR Salary
          </label>
          <input
            type="range"
            min="45000"
            max="85000"
            step="5000"
            value={avgSalary}
            onChange={(e) => setAvgSalary(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            aria-label="Average BDR Salary"
          />
          <div className="text-center mt-2">
            <span className="text-2xl font-bold text-green-600">
              ${avgSalary.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500 ml-1">/year</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Our Plan
          </label>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setPlanType('monthly')}
              className={`flex-1 py-2 px-4 text-sm font-medium ${
                planType === 'monthly'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPlanType('yearly')}
              className={`flex-1 py-2 px-4 text-sm font-medium ${
                planType === 'yearly'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Yearly
            </button>
          </div>
          <div className="text-center mt-2">
            <span className="text-2xl font-bold text-purple-600">
              ${roi.ourCost.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500 ml-1">/year</span>
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Traditional BDR Team Costs */}
        <div className="bg-red-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
            👥 Traditional BDR Team
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Base Salaries ({bdrCount} BDRs)</span>
              <span className="font-medium">${roi.bdrSalary.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Benefits & Insurance (25%)</span>
              <span className="font-medium">${roi.benefits.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sales Tools & Software</span>
              <span className="font-medium">${roi.tools.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Management Overhead</span>
              <span className="font-medium">${roi.management.toLocaleString()}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-bold text-red-600">
                <span>Total Annual Cost</span>
                <span>${roi.totalYearlyCost.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Our Solution */}
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
            🤖 AI BDR Team (Ours)
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">AI BDR Team Subscription</span>
              <span className="font-medium">${roi.ourCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Setup & Training</span>
              <span className="font-medium">$0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Management Overhead</span>
              <span className="font-medium">$0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">24/7 Operation</span>
              <span className="font-medium">Included</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-bold text-green-600">
                <span>Total Annual Cost</span>
                <span>${roi.ourCost.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Savings Summary */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-8 text-white text-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-3xl font-bold mb-2">
              ${roi.savings.toLocaleString()}
            </div>
            <div className="text-purple-100">Annual Savings</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">
              {roi.roi.toFixed(0)}%
            </div>
            <div className="text-purple-100">ROI</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">
              {Math.round(roi.savings / roi.ourCost)}x
            </div>
            <div className="text-purple-100">Return Multiple</div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-purple-400">
          <p className="text-lg mb-4">
            🎉 <strong>You save ${(roi.savings / 12).toLocaleString()} every month</strong> by choosing our AI BDR team!
          </p>
          <p className="text-purple-100">
            That's enough to hire {Math.floor(roi.savings / 65000)} additional team members 
            or reinvest in growing your business.
          </p>
        </div>
      </div>

      {/* Additional Benefits */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl mb-2">⚡</div>
          <div className="font-semibold text-blue-800">Instant Setup</div>
          <div className="text-sm text-blue-600">vs 3-6 months hiring</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl mb-2">🌙</div>
          <div className="font-semibold text-green-800">24/7 Operation</div>
          <div className="text-sm text-green-600">Never sleeps or takes breaks</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl mb-2">📈</div>
          <div className="font-semibold text-purple-800">Consistent Results</div>
          <div className="text-sm text-purple-600">No bad days or turnover</div>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <div className="text-2xl mb-2">🎯</div>
          <div className="font-semibold text-orange-800">Perfect Accuracy</div>
          <div className="text-sm text-orange-600">No human errors</div>
        </div>
      </div>
    </div>
  );
} 