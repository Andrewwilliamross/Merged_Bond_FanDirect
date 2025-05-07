
import React from 'react';
import { MessageSquare, Users, Send, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import GradientButton from '../components/GradientButton';
import MassTextThread from '../components/messaging/MassTextThread';
import StatCard from '../components/dashboard/StatCard';

const Dashboard = () => {
  return (
    <DashboardLayout title="Dashboard">
      {/* Analytics Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 lg:gap-6 mb-4 md:mb-8">
        <StatCard
          title="Total Subscribers"
          value="0"
          icon={Users}
          change="Start growing!"
          positive={true}
        />
        <StatCard
          title="Messages Sent"
          value="0"
          icon={Send}
          change="Send your first message"
          positive={true}
        />
        <StatCard
          title="Messages Read"
          value="0"
          icon={Check}
          change="0% open rate"
          positive={true}
        />
        <StatCard
          title="Conversations"
          value="0"
          icon={MessageSquare}
          change="Start chatting!"
          positive={true}
        />
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Mass Text Thread</h2>
        </div>
        <MassTextThread />
      </div>
      
      {/* Quick Actions Section */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/dashboard/campaigns/create">
            <GradientButton className="flex items-center justify-center py-4 md:py-6 w-full">
              <MessageSquare className="mr-2 h-5 w-5" />
              New Campaign
            </GradientButton>
          </Link>
          <Link to="/dashboard/contacts">
            <GradientButton variant="outline" className="flex items-center justify-center py-4 md:py-6 w-full">
              <Users className="mr-2 h-5 w-5" />
              Add Contacts
            </GradientButton>
          </Link>
          <Link to="/dashboard/messaging">
            <GradientButton variant="outline" className="flex items-center justify-center py-4 md:py-6 w-full">
              <Send className="mr-2 h-5 w-5" />
              Quick Message
            </GradientButton>
          </Link>
          <Link to="/dashboard/analytics">
            <GradientButton variant="outline" className="flex items-center justify-center py-4 md:py-6 w-full">
              <Check className="mr-2 h-5 w-5" />
              View Reports
            </GradientButton>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
