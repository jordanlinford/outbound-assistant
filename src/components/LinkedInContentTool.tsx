'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

interface LinkedInProfile {
  id: string;
  name: string;
  headline: string;
  industry: string;
  followerCount: number;
  engagementRate: number;
  recentPostTopics: string[];
  profileUrl: string;
  location?: string;
  connectionDegree: '1st' | '2nd' | '3rd+';
}



interface GeneratedPost {
  id: string;
  content: string;
  hashtags: string[];
  postType: string;
  engagementHooks: string[];
  callToAction?: string;
  bestTimeToPost?: string;
  estimatedReach?: number;
}

const LinkedInContentTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'content' | 'calendar'>('suggestions');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // People Suggestions State
  const [industry, setIndustry] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<LinkedInProfile[]>([]);
  
  // Content Generation State
  const [userContext, setUserContext] = useState({
    industry: '',
    experience: 'mid-level',
    targetAudience: 'professionals',
    personalStyle: 'professional'
  });
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [contentIdea, setContentIdea] = useState('');
  
  // Content Calendar State
  const [calendarSettings, setCalendarSettings] = useState({
    period: 'week' as 'week' | 'month' | 'custom',
    postsPerWeek: 5,
    focusArea: 'mixed' as 'mixed' | 'thought-leadership' | 'personal-brand' | 'industry-insights'
  });
  const [generatedCalendar, setGeneratedCalendar] = useState<any>(null);

  const industries = [
    'Technology', 'Sales', 'Marketing', 'Finance', 'Healthcare', 
    'Real Estate', 'Consulting', 'E-commerce', 'Manufacturing', 'Education'
  ];

  const experienceLevels = [
    { value: 'entry-level', label: 'Entry Level (0-2 years)' },
    { value: 'mid-level', label: 'Mid Level (3-7 years)' },
    { value: 'senior-level', label: 'Senior Level (8-15 years)' },
    { value: 'executive', label: 'Executive (15+ years)' }
  ];

  const targetAudiences = [
    'executives', 'entrepreneurs', 'sales professionals', 'marketers', 
    'consultants', 'small business owners', 'general professionals'
  ];

  const personalStyles = [
    { value: 'professional', label: 'Professional & Formal' },
    { value: 'conversational', label: 'Conversational & Friendly' },
    { value: 'thought-leader', label: 'Thought Leader & Authoritative' },
    { value: 'storyteller', label: 'Storyteller & Personal' }
  ];



  const handleGetSuggestions = async () => {
    if (!industry) {
      setError('Please select an industry');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/linkedin/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry, interests })
      });

      const data = await response.json();

      if (data.success) {
        setSuggestions(data.suggestions);
      } else {
        setError(data.error || 'Failed to get suggestions');
      }
    } catch (error) {
      setError('Failed to get suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePost = async () => {
    if (!contentIdea.trim()) {
      setError('Please provide a content idea');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/linkedin/content/smart-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentIdea: contentIdea.trim(),
          userContext: {
            industry: userContext.industry,
            experience: userContext.experience,
            targetAudience: userContext.targetAudience,
            personalStyle: userContext.personalStyle,
            name: 'Jordan Linford' // You could make this dynamic from session
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Smart generate API returns the post data directly
        console.log('Smart generate response:', data);
        const postData = {
          id: Date.now().toString(),
          content: data.content || '',
          hashtags: data.hashtags || [],
          postType: data.postType || 'text',
          engagementHooks: data.engagementHooks || [],
          callToAction: data.callToAction,
          bestTimeToPost: data.bestTimeToPost,
          estimatedReach: data.estimatedReach
        };
        console.log('Setting generated post:', postData);
        setGeneratedPost(postData);
      } else {
        setError(data.error || 'Failed to generate post');
      }
    } catch (error) {
      console.error('Error generating post:', error);
      setError('Failed to generate post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addInterest = (interest: string) => {
    if (interest && !interests.includes(interest)) {
      setInterests([...interests, interest]);
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const handleGenerateCalendar = async () => {
    if (!userContext.industry) {
      setError('Please select an industry first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/linkedin/content/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          period: calendarSettings.period,
          postsPerWeek: calendarSettings.postsPerWeek,
          focusArea: calendarSettings.focusArea,
          userContext: {
            industry: userContext.industry,
            experience: userContext.experience,
            targetAudience: userContext.targetAudience,
            personalStyle: userContext.personalStyle,
            name: 'Jordan Linford' // You could make this dynamic from session
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Calendar generation response:', data);
        setGeneratedCalendar(data);
      } else {
        setError(data.error || 'Failed to generate calendar');
      }
    } catch (error) {
      console.error('Error generating calendar:', error);
      setError('Failed to generate calendar. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">LinkedIn Content Assistant</h1>
        <p className="text-gray-600">
          Discover industry leaders to follow and generate engaging LinkedIn content with AI
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'suggestions', label: 'People to Follow', icon: '👥' },
          { id: 'content', label: 'Content Generator', icon: '✍️' },
          { id: 'calendar', label: 'Content Calendar', icon: '📅' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* People Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Find Industry Leaders to Follow</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry *
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  aria-label="Select industry for people suggestions"
                >
                  <option value="">Select Industry</option>
                  {industries.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interests (Optional)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Add interest..."
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addInterest((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {interests.map(interest => (
                    <span
                      key={interest}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center space-x-1"
                    >
                      <span>{interest}</span>
                      <button
                        onClick={() => removeInterest(interest)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={handleGetSuggestions}
              disabled={loading || !industry}
              className="w-full md:w-auto"
            >
              {loading ? 'Finding Suggestions...' : 'Get Suggestions'}
            </Button>
          </Card>

          {/* Suggestions Results */}
          {suggestions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map((profile) => (
                <Card key={profile.id} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {profile.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{profile.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{profile.headline}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{profile.followerCount.toLocaleString()} followers</span>
                        <span>{profile.engagementRate}% engagement</span>
                        <span className="px-2 py-1 bg-gray-100 rounded">{profile.connectionDegree}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {profile.recentPostTopics.slice(0, 3).map(topic => (
                          <span key={topic} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                            {topic}
                          </span>
                        ))}
                      </div>
                      <a
                        href={profile.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Profile →
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content Generator Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Generate LinkedIn Content</h2>
            
            {/* Content Idea Input */}
            <div className="mb-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  💡 AI Content Generator
                </h3>
                <p className="text-sm text-gray-600">
                  Share any idea, link, experience, or question and AI will create engaging LinkedIn content
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What would you like to post about? *
                    </label>
                    <textarea
                      value={contentIdea}
                      onChange={(e) => setContentIdea(e.target.value)}
                      placeholder="Share a link, experience, insight, or question...

Examples:
📰 Article: https://techcrunch.com/2024/01/15/ai-startup-funding
💡 Insight: 'Remote work has completely changed how I manage my team'
❓ Question: 'What's the biggest challenge in your industry right now?'
📖 Experience: 'I just failed at launching my product and here's what I learned'
🔥 Opinion: 'Everyone talks about work-life balance, but I think it's wrong'
💰 Business lesson: 'My biggest client just fired me and it was the best thing that happened'"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[150px] font-mono text-sm"
                    />
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-3">
                      <div className="text-blue-600 text-xl">🚀</div>
                      <div>
                        <p className="text-blue-900 font-medium mb-2">AI-Powered Content Generation</p>
                        <p className="text-blue-800 text-sm mb-3">
                          Our AI will analyze your input and create engaging LinkedIn content that:
                        </p>
                        <ul className="text-blue-700 text-sm space-y-1 mb-3">
                          <li>• Matches your industry and writing style</li>
                          <li>• Includes strategic hashtags and CTAs</li>
                          <li>• Uses proven engagement techniques</li>
                          <li>• Sounds authentic, not robotic</li>
                        </ul>
                        
                        <div className="space-y-2">
                          <p className="text-blue-700 text-xs font-medium">Try these content types:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[
                              { text: "🎯 Share a contrarian opinion about your industry", example: "Everyone says networking is key, but I think it's overrated" },
                              { text: "📈 Analyze a business trend you've noticed", example: "Why I think the 4-day work week will fail" },
                              { text: "💪 Tell a failure story with lessons", example: "I lost $50k on my first startup. Here's what I learned" },
                              { text: "🔗 Comment on an article you read", example: "https://example.com/article + your take" },
                              { text: "❓ Ask a thought-provoking question", example: "What if remote work is actually bad for creativity?" },
                              { text: "🏆 Share a recent win or achievement", example: "Just hit 100 customers. Here's how we did it" }
                            ].map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => setContentIdea(suggestion.example)}
                                className="text-left p-3 bg-white rounded-md border border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                                title={`Click to use: ${suggestion.example}`}
                              >
                                <div className="text-blue-800 text-xs font-medium group-hover:text-blue-900">
                                  {suggestion.text}
                                </div>
                                <div className="text-blue-600 text-xs mt-1 opacity-75 group-hover:opacity-100">
                                  "{suggestion.example}"
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* User Context */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry *</label>
                <select
                  value={userContext.industry}
                  onChange={(e) => setUserContext({...userContext, industry: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  aria-label="Select your industry"
                >
                  <option value="">Select Industry</option>
                  {industries.map(ind => (
                    <option key={ind} value={ind.toLowerCase()}>{ind}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                <select
                  value={userContext.experience}
                  onChange={(e) => setUserContext({...userContext, experience: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  aria-label="Select your experience level"
                >
                  {experienceLevels.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                <select
                  value={userContext.targetAudience}
                  onChange={(e) => setUserContext({...userContext, targetAudience: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  aria-label="Select your target audience"
                >
                  {targetAudiences.map(audience => (
                    <option key={audience} value={audience}>{audience}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Writing Style</label>
                <select
                  value={userContext.personalStyle}
                  onChange={(e) => setUserContext({...userContext, personalStyle: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  aria-label="Select your writing style"
                >
                  {personalStyles.map(style => (
                    <option key={style.value} value={style.value}>{style.label}</option>
                  ))}
                </select>
              </div>
            </div>



            <Button
              onClick={handleGeneratePost}
              disabled={loading || !contentIdea.trim() || !userContext.industry}
              className="w-full md:w-auto"
            >
              {loading ? 'Generating Post...' : 'Generate from Idea'}
            </Button>
          </Card>

          {/* Generated Post */}
          {generatedPost && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">✨</span>
                Generated LinkedIn Post
              </h3>
              
              {/* Main Post Content */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
                <div className="whitespace-pre-wrap text-gray-900 leading-relaxed text-base mb-4">
                  {generatedPost.content || 'No content generated'}
                </div>
                {/* Debug info */}
                <div className="text-xs text-gray-400 mt-2">
                  Debug: Content length: {generatedPost.content?.length || 0}
                </div>
                
                {/* Hashtags */}
                {generatedPost.hashtags && generatedPost.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                    {generatedPost.hashtags.map((hashtag, index) => (
                      <span key={index} className="text-blue-600 font-medium hover:text-blue-700 cursor-pointer">
                        {hashtag.startsWith('#') ? hashtag : `#${hashtag}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Post Analytics & Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {generatedPost.estimatedReach && (
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {generatedPost.estimatedReach.toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-800">Estimated Reach</div>
                  </div>
                )}
                
                {generatedPost.bestTimeToPost && (
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {generatedPost.bestTimeToPost}
                    </div>
                    <div className="text-sm text-green-800">Best Time to Post</div>
                  </div>
                )}
                
                {generatedPost.postType && (
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-lg font-semibold text-purple-600 capitalize">
                      {generatedPost.postType}
                    </div>
                    <div className="text-sm text-purple-800">Post Type</div>
                  </div>
                )}
              </div>

              {/* Call to Action */}
              {generatedPost.callToAction && (
                <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-orange-800">
                        <strong>💡 Call to Action:</strong> {generatedPost.callToAction}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => {
                    const fullPost = generatedPost.content + 
                      (generatedPost.hashtags && generatedPost.hashtags.length > 0 
                        ? '\n\n' + generatedPost.hashtags.map(tag => 
                            tag.startsWith('#') ? tag : `#${tag}`
                          ).join(' ') 
                        : '');
                    navigator.clipboard.writeText(fullPost);
                  }}
                  variant="outline"
                  className="flex-1 sm:flex-none"
                >
                  📋 Copy Post
                </Button>
                <Button
                  onClick={() => window.open('https://www.linkedin.com/feed/', '_blank')}
                  className="flex-1 sm:flex-none"
                >
                  🚀 Post to LinkedIn
                </Button>
                <Button
                  onClick={() => setGeneratedPost(null)}
                  variant="outline"
                  className="flex-1 sm:flex-none"
                >
                  🔄 Generate New
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Content Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">📅 Content Calendar</h2>
            <p className="text-gray-600 mb-6">
              Generate a strategic content calendar with diverse post types optimized for engagement.
            </p>

            {/* Calendar Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Calendar Period</label>
                <select 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  aria-label="Select calendar period"
                  value={calendarSettings.period}
                  onChange={(e) => setCalendarSettings({...calendarSettings, period: e.target.value as any})}
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Posts Per Week</label>
                <select 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  aria-label="Select posts per week"
                  value={calendarSettings.postsPerWeek}
                  onChange={(e) => setCalendarSettings({...calendarSettings, postsPerWeek: parseInt(e.target.value)})}
                >
                  <option value="3">3 posts/week</option>
                  <option value="5">5 posts/week (recommended)</option>
                  <option value="7">Daily posts</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Focus Area</label>
                <select 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  aria-label="Select content focus area"
                  value={calendarSettings.focusArea}
                  onChange={(e) => setCalendarSettings({...calendarSettings, focusArea: e.target.value as any})}
                >
                  <option value="mixed">Mixed Content</option>
                  <option value="thought-leadership">Thought Leadership</option>
                  <option value="personal-brand">Personal Branding</option>
                  <option value="industry-insights">Industry Insights</option>
                </select>
              </div>
            </div>

            <Button 
              onClick={handleGenerateCalendar}
              className="w-full sm:w-auto mb-6"
              disabled={loading || !userContext.industry}
            >
              {loading ? 'Generating Calendar...' : '🚀 Generate Content Calendar'}
            </Button>

            {/* Generated Calendar */}
            {generatedCalendar && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                  📋 {calendarSettings.period === 'week' ? 'This Week\'s' : 'This Month\'s'} Content Plan
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedCalendar.posts?.map((post: any, index: number) => (
                    <div key={index} className={`p-4 rounded-lg border-2 ${post.color}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold">{post.day}</div>
                          <div className="text-sm opacity-75">{post.date}</div>
                        </div>
                        <div className="text-xs px-2 py-1 bg-white rounded-full">
                          {post.time}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-xs font-medium mb-1">{post.type}</div>
                        <div className="text-sm font-medium leading-tight">{post.title}</div>
                        {post.contentIdea && (
                          <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {post.contentIdea}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span>📊 {post.engagement}</span>
                        <div className="flex gap-1">
                          <button 
                            className="px-2 py-1 bg-white rounded hover:bg-gray-50"
                            title="Edit post"
                            onClick={() => {
                              setContentIdea(post.contentIdea || post.title);
                              setActiveTab('content');
                            }}
                          >
                            ✏️
                          </button>
                          <button 
                            className="px-2 py-1 bg-white rounded hover:bg-gray-50"
                            title="Copy to clipboard"
                            onClick={() => {
                              const text = `${post.title}\n\n${post.contentIdea || ''}\n\n${post.hashtags?.join(' ') || ''}`;
                              navigator.clipboard.writeText(text);
                            }}
                          >
                            📋
                          </button>
                          <button 
                            className="px-2 py-1 bg-white rounded hover:bg-gray-50"
                            title="Generate full post"
                            onClick={() => {
                              setContentIdea(post.contentIdea || post.title);
                              setActiveTab('content');
                              // Auto-generate after a short delay
                              setTimeout(() => handleGeneratePost(), 100);
                            }}
                          >
                            🚀
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {generatedCalendar.strategy && (
                  <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-3">📈 Content Strategy</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-blue-800">Content Mix</div>
                        <div className="text-blue-700">
                          {typeof generatedCalendar.strategy.contentMix === 'string' 
                            ? generatedCalendar.strategy.contentMix
                            : '• Balanced mix of content types'}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-blue-800">Best Times</div>
                        <div className="text-blue-700">
                          {typeof generatedCalendar.strategy.bestTimes === 'string'
                            ? generatedCalendar.strategy.bestTimes
                            : '• Mon-Wed: 9-11 AM\n• Thu-Fri: 1-3 PM'}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-blue-800">Goals</div>
                        <div className="text-blue-700">
                          {Array.isArray(generatedCalendar.strategy.goals)
                            ? generatedCalendar.strategy.goals.map((goal: string) => `• ${goal}`).join('\n')
                            : '• Build thought leadership\n• Increase engagement'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 text-center">
                  <p className="text-blue-700 text-sm">
                    💡 <strong>Pro tip:</strong> Click the 🚀 button on any post to generate the full content with AI!
                  </p>
                </div>
              </div>
            )}

            {/* Sample Calendar Preview - shown when no calendar generated yet */}
            {!generatedCalendar && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">📋 Sample Content Calendar</h3>
                <p className="text-blue-700 text-sm mb-4">
                  Select your preferences above and click "Generate Content Calendar" to create a personalized plan.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      day: 'Monday',
                      date: 'Dec 16',
                      type: 'Industry Insight',
                      title: 'AI is changing how we work - here\'s what I\'ve learned',
                      time: '9:00 AM',
                      engagement: 'High',
                      color: 'bg-blue-100 border-blue-300 text-blue-800'
                    },
                    {
                      day: 'Wednesday', 
                      date: 'Dec 18',
                      type: 'Personal Story',
                      title: 'The mistake that taught me everything about leadership',
                      time: '1:00 PM',
                      engagement: 'Very High',
                      color: 'bg-green-100 border-green-300 text-green-800'
                    },
                    {
                      day: 'Friday',
                      date: 'Dec 20',
                      type: 'Question/Poll',
                      title: 'What\'s the biggest challenge in your industry right now?',
                      time: '11:00 AM',
                      engagement: 'High',
                      color: 'bg-purple-100 border-purple-300 text-purple-800'
                    }
                  ].map((post, index) => (
                    <div key={index} className={`p-4 rounded-lg border-2 ${post.color} opacity-75`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold">{post.day}</div>
                          <div className="text-sm opacity-75">{post.date}</div>
                        </div>
                        <div className="text-xs px-2 py-1 bg-white rounded-full">
                          {post.time}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-xs font-medium mb-1">{post.type}</div>
                        <div className="text-sm font-medium leading-tight">{post.title}</div>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span>📊 {post.engagement}</span>
                        <div className="flex gap-1">
                          <button className="px-2 py-1 bg-white rounded hover:bg-gray-50">✏️</button>
                          <button className="px-2 py-1 bg-white rounded hover:bg-gray-50">📋</button>
                          <button className="px-2 py-1 bg-white rounded hover:bg-gray-50">🚀</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-center">
                  <p className="text-blue-700 text-sm">
                    💡 <strong>Pro tip:</strong> Consistency beats perfection. Start with 3 posts per week and build momentum.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default LinkedInContentTool; 