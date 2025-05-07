import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Users, Mail } from 'lucide-react';
import Header from '../components/Header';
import GradientButton from '../components/GradientButton';
import FeatureCard from '../components/FeatureCard';
const Index = () => {
  return <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      <Header />
      
      <main className="flex-grow">
        <section className="py-12 md:py-20 bg-gradient-brand">
          <div className="container px-4 md:px-6 max-w-6xl">
            <div className="text-center mb-12">
              <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-semibold mb-6 text-white">
                Contact™:
              </h1>
              
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-normal text-white mb-8">
                The Creator Text Messaging Platform
              </h2>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
                <Link to="/signup">
                  <GradientButton variant="primary" size="lg" className="bg-white text-brand-blue hover:bg-gray-100">
                    Get Started
                  </GradientButton>
                </Link>
              </div>
            </div>
            
            <div className="mt-20 md:mt-24 space-y-8 md:space-y-12">
              <FeatureCard title="Send Texts" description="Share your content and message with your entire following or a single fan" icon={MessageCircle} align="left" />
              
              <FeatureCard title="Engage Contacts" description="Texting has the highest engagement rates of any media platform: 98% open, 77% response, 18% click through" icon={Users} align="right" className="delay-100" bgColor="bg-brand-blue" />
              
              <FeatureCard title="Monetize" description="Start earning through: VIP Subscriptions, Paid Partnerships, Supercharged Affiliate Links, & More" icon={Mail} align="left" className="delay-200" />
            </div>
          </div>
        </section>
        
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                Connect With Your Fans Like Never Before
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Our platform gives you direct access to your audience, with powerful tools to engage and monetize your following.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-gradient-brand rounded-lg flex items-center justify-center mb-6">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">Direct Messaging</h3>
                <p className="text-gray-600">
                  Send personal messages to your entire audience or target specific segments for more tailored communication.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-gradient-brand rounded-lg flex items-center justify-center mb-6">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">Audience Insights</h3>
                <p className="text-gray-600">
                  Get deep analytics on your audience engagement, opening rates, and interaction metrics to optimize your strategy.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-gradient-brand rounded-lg flex items-center justify-center mb-6">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">Never Explicit</h3>
                <p className="text-gray-600">We ensure that no "spicy" content is shared via iMessage ever. Creating a safe environment for Creators and their fans.</p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-gradient-brand">
          <div className="container px-4 md:px-6 max-w-6xl">
            <div className="text-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6 text-white">
                Ready to Connect With Your Fans?
              </h2>
              <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
                Join thousands of creators who are building deeper relationships with their audience through direct messaging.
              </p>
              <Link to="/signup">
                <GradientButton size="lg" className="bg-white text-brand-blue hover:bg-gray-100">
                  Start For Free
                </GradientButton>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>;
};
export default Index;