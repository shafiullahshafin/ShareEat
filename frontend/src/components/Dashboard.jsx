import { useState, useEffect } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Package, AlertCircle, Leaf, HandHeart, Zap } from 'lucide-react';
import { analyticsAPI } from '../services/api';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

const Dashboard = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [donationTrends, setDonationTrends] = useState([]);
  const [urgencyBreakdown, setUrgencyBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetches all dashboard data in parallel.
        const [statsRes, trendsRes, urgencyRes] = await Promise.all([
          analyticsAPI.getDashboardStats(),
          analyticsAPI.getDonationTrends(30),
          analyticsAPI.getUrgencyBreakdown(),
        ]);

        setDashboardStats(statsRes.data);
        setDonationTrends(trendsRes.data);
        setUrgencyBreakdown(urgencyRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-dark-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardStats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-900">
        <div className="text-center bg-dark-800 p-8 rounded-xl shadow-lg border border-dark-700">
          <AlertCircle className="h-16 w-16 text-accent-red mx-auto mb-4" />
          <p className="text-lg font-semibold text-white">Error loading dashboard data</p>
          <p className="text-sm text-dark-400 mt-2">{error || 'Please try refreshing the page'}</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Donations',
      value: dashboardStats.donations.total,
      icon: HandHeart,
      color: 'from-brand-600 to-brand-700',
      iconBg: 'bg-brand-500/10',
      iconColor: 'text-brand-500',
      borderColor: 'border-brand-500'
    },
    {
      title: 'Active Donations',
      value: dashboardStats.donations.active,
      icon: Zap,
      color: 'from-accent-green to-green-700',
      iconBg: 'bg-accent-green/10',
      iconColor: 'text-accent-green',
      borderColor: 'border-accent-green'
    },
    {
      title: 'Available Items',
      value: dashboardStats.food_items.available,
      icon: Package,
      color: 'from-accent-orange to-orange-700',
      iconBg: 'bg-accent-orange/10',
      iconColor: 'text-accent-orange',
      borderColor: 'border-accent-orange'
    },
    {
      title: 'Urgent Items',
      value: dashboardStats.food_items.urgent,
      icon: AlertCircle,
      color: 'from-accent-red to-red-700',
      iconBg: 'bg-accent-red/10',
      iconColor: 'text-accent-red',
      borderColor: 'border-accent-red'
    },
  ];

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-dark-800 shadow-sm border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center">
            <Leaf className="h-10 w-10 text-brand-500 mr-4" />
            <div>
              <h1 className="text-3xl font-display font-bold text-white">ShareEat Analytics Dashboard</h1>
              <p className="text-dark-400 mt-1">Zero-Waste Food Redistribution Network</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-dark-800 rounded-xl shadow-lg border border-dark-700 hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
               <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color}`}></div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-dark-400 uppercase tracking-widest mb-1">{stat.title}</p>
                    <p className="text-4xl font-display font-bold text-white">{stat.value}</p>
                  </div>
                  <div className={`${stat.iconBg} p-3 rounded-lg border border-dark-700/50 group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`h-8 w-8 ${stat.iconColor}`} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Impact Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700 border-l-4 border-l-accent-green hover:translate-y-[-2px] transition-all duration-300">
            <div className="flex items-center mb-4">
              <Package className="h-6 w-6 text-accent-green mr-3" />
              <h3 className="text-lg font-semibold text-white">Waste Prevented</h3>
            </div>
            <p className="text-4xl font-display font-bold text-accent-green mb-1">{dashboardStats.impact.waste_prevented_kg.toFixed(2)}</p>
            <p className="text-sm text-dark-400">kilograms saved from landfills</p>
          </div>
          <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700 border-l-4 border-l-brand-500 hover:translate-y-[-2px] transition-all duration-300">
            <div className="flex items-center mb-4">
              <Leaf className="h-6 w-6 text-brand-500 mr-3" />
              <h3 className="text-lg font-semibold text-white">CO2 Emissions Saved</h3>
            </div>
            <p className="text-4xl font-display font-bold text-brand-500 mb-1">{dashboardStats.impact.co2_saved_kg.toFixed(2)}</p>
            <p className="text-sm text-dark-400">kilograms of carbon dioxide</p>
          </div>
          <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700 border-l-4 border-l-accent-orange hover:translate-y-[-2px] transition-all duration-300">
            <div className="flex items-center mb-4">
              <Users className="h-6 w-6 text-accent-orange mr-3" />
              <h3 className="text-lg font-semibold text-white">Meals Provided</h3>
            </div>
            <p className="text-4xl font-display font-bold text-accent-orange mb-1">{dashboardStats.impact.meals_provided}</p>
            <p className="text-sm text-dark-400">people fed through our network</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donation Trends */}
          <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center">
              <TrendingUp className="h-5 w-5 text-brand-500 mr-2" />
              Donation Trends (Last 30 Days)
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={donationTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" stroke="#94A3B8" style={{ fontSize: '12px', fontFamily: 'Inter' }} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94A3B8" style={{ fontSize: '12px', fontFamily: 'Inter' }} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#151F32', border: '1px solid #334155', borderRadius: '8px', color: '#E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#E2E8F0' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={3} name="Donations" dot={{ fill: '#3B82F6', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Urgency Breakdown */}
          <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center">
              <AlertCircle className="h-5 w-5 text-accent-red mr-2" />
              Food Urgency Levels
            </h3>
            <div className="h-[300px] w-full relative">
              {urgencyBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={urgencyBreakdown}
                      dataKey="count"
                      nameKey="urgency_display"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={60}
                      paddingAngle={5}
                    >
                      {urgencyBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#151F32', border: '1px solid #334155', borderRadius: '8px', color: '#E2E8F0' }}
                      itemStyle={{ color: '#E2E8F0' }}
                    />
                    <Legend 
                       verticalAlign="bottom" 
                       height={36} 
                       iconType="circle"
                       formatter={(value) => <span className="text-dark-400 text-sm ml-1">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                 <div className="flex flex-col items-center justify-center h-full text-dark-400">
                    <Package className="h-12 w-12 mb-2 opacity-50" />
                    <p>No data available</p>
                 </div>
              )}
               {/* Center Text for Donut Chart */}
               {urgencyBreakdown.length > 0 && (
                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-8">
                   <p className="text-xs text-dark-400 uppercase tracking-wider">Total</p>
                   <p className="text-2xl font-bold text-white">
                     {urgencyBreakdown.reduce((acc, curr) => acc + curr.count, 0)}
                   </p>
                 </div>
               )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;