
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, DollarSign } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const growthData = [
  { month: 'Jan', revenue: 3200, subscribers: 310 },
  { month: 'Feb', revenue: 4150, subscribers: 390 },
  { month: 'Mar', revenue: 5830, subscribers: 444 },
  { month: 'Apr', revenue: 7420, subscribers: 550 },
  { month: 'May', revenue: 9950, subscribers: 668 },
  { month: 'Jun', revenue: 10800, subscribers: 710 },
  { month: 'Jul', revenue: 12300, subscribers: 790 },
];

const tiers = [
  { name: "Basic", subscribers: 390, revenue: 2340 },
  { name: "Premium", subscribers: 210, revenue: 6100 },
  { name: "VIP", subscribers: 110, revenue: 5850 },
];

const Analytics = () => {
  return (
    <DashboardLayout title="Analytics">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 lg:gap-6 mb-4 md:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">
                Total Subscribers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">1,110</div>
              <p className="text-xs text-muted-foreground">
                +90 this month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">$18,290</div>
              <p className="text-xs text-muted-foreground">
                +$2,010 this month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Active Tiers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                Basic, Premium, VIP
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Churn Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">2.5%</div>
              <p className="text-xs text-muted-foreground">
                -0.5% vs prev. month
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Revenue &amp; Subscriber Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={340}>
              <LineChart
                data={growthData}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#7366ff" name="Revenue ($)" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="subscribers" stroke="#23c58f" name="Subscribers" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Tiers Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {tiers.map((tier, i) => (
                <div key={tier.name} className="flex flex-col items-center p-4 bg-gray-50 rounded-lg shadow-sm">
                  <span className="text-base md:text-lg font-semibold">{tier.name}</span>
                  <span className="text-gray-500 text-xs md:text-sm">
                    {tier.subscribers} Subscribers
                  </span>
                  <span className="mt-2 text-2xl font-bold text-green-600">${tier.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
