import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Package, AlertCircle, Leaf, Award, Heart, HandHeart, Zap, AlertTriangle, Phone, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { analyticsAPI, donationsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

const AdminDashboard = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [donationTrends, setDonationTrends] = useState([]);
  const [urgencyBreakdown, setUrgencyBreakdown] = useState([]);
  const [pendingDonations, setPendingDonations] = useState([]);
  const [resolvingId, setResolvingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, donationId: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all dashboard data in parallel
        const [statsRes, trendsRes, urgencyRes, pendingRes] = await Promise.all([
          analyticsAPI.getDashboardStats(),
          analyticsAPI.getDonationTrends(30),
          analyticsAPI.getUrgencyBreakdown(),
          donationsAPI.getAll({ status: 'pending_manual_assignment' }),
        ]);

        setDashboardStats(statsRes.data);
        setDonationTrends(trendsRes.data);
        setUrgencyBreakdown(urgencyRes.data);
        setPendingDonations(pendingRes.data.results || pendingRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const initiateResolution = (id, resolution) => {
    setConfirmModal({ isOpen: true, action: resolution, donationId: id });
  };

  const handleConfirmResolution = async () => {
    const { action: resolution, donationId: id } = confirmModal;
    if (!id || !resolution) return;

    setResolvingId(id);
    setConfirmModal({ isOpen: false, action: null, donationId: null }); // Close modal

    try {
      await donationsAPI.resolveException(id, resolution);
      toast.success(`Donation marked as ${resolution}`);
      
      // Refresh pending donations and stats
      const [pendingRes, statsRes] = await Promise.all([
        donationsAPI.getAll({ status: 'pending_manual_assignment' }),
        analyticsAPI.getDashboardStats()
      ]);
      
      setPendingDonations(pendingRes.data.results || pendingRes.data);
      setDashboardStats(statsRes.data);
    } catch (error) {
      console.error('Error resolving donation:', error);
      toast.error('Failed to update status');
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardStats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-900">
        <div className="text-center bg-dark-800 p-8 rounded-lg shadow-lg border border-dark-700">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-white">Error loading dashboard data</p>
          <p className="text-sm text-gray-400 mt-2">{error || 'Please try refreshing the page'}</p>
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
      iconColor: 'text-brand-400',
    },
    {
      title: 'Active Donations',
      value: dashboardStats.donations.active,
      icon: Zap,
      color: 'from-accent-green-600 to-accent-green-700',
      iconBg: 'bg-accent-green/10',
      iconColor: 'text-accent-green',
    },
    {
      title: 'Available Items',
      value: dashboardStats.food_items.available,
      icon: Package,
      color: 'from-accent-orange-600 to-accent-orange-700',
      iconBg: 'bg-accent-orange/10',
      iconColor: 'text-accent-orange',
    },
    {
      title: 'Urgent Items',
      value: dashboardStats.food_items.urgent,
      icon: AlertCircle,
      color: 'from-accent-red-600 to-accent-red-700',
      iconBg: 'bg-accent-red/10',
      iconColor: 'text-accent-red',
    },
  ];

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-dark-800 shadow-sm border-b border-dark-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="h-32 w-32 text-brand-500 transform rotate-12" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="flex items-center">
            <div className="bg-brand-500/10 p-3 rounded-2xl border border-brand-500/20 mr-5">
              <Leaf className="h-8 w-8 text-brand-500" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-white tracking-tight">Network Intelligence Center</h1>
              <p className="text-dark-400 text-lg mt-1 font-light">Real-time insights driving our zero-waste mission</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-dark-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-dark-700 group">
              <div className={`h-1 bg-gradient-to-r ${stat.color}`}></div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-dark-400 uppercase tracking-widest">{stat.title}</p>
                    <p className="text-3xl font-bold text-white mt-2 group-hover:text-brand-400 transition-colors">{stat.value}</p>
                  </div>
                  <div className={`${stat.iconBg} p-3 rounded-lg border border-dark-700/50 group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Manual Intervention Required */}
        {pendingDonations.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-accent-red mr-2" />
              <h2 className="text-xl font-bold text-white">Manual Intervention Required</h2>
              <span className="ml-3 bg-accent-red/20 text-accent-red text-xs font-bold px-2.5 py-0.5 rounded-full border border-accent-red/20 animate-pulse">
                {pendingDonations.length} Pending
              </span>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {pendingDonations.map((donation) => (
                <div key={donation.id} className="bg-dark-800 rounded-xl shadow-lg border border-accent-red/30 p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-accent-red"></div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Donation Info */}
                    <div className="lg:col-span-1">
                      <h3 className="text-lg font-semibold text-white mb-2">Donation #{donation.id}</h3>
                      <p className="text-sm text-dark-400 mb-4">{new Date(donation.created_at).toLocaleString()}</p>
                      
                      <div className="space-y-3">
                        <div className="flex items-start">
                           <Package className="h-5 w-5 text-brand-500 mt-0.5 mr-2" />
                           <div>
                             <p className="text-sm font-medium text-white">{donation.item_summary || 'Unknown Item'}</p>
                             <p className="text-xs text-dark-400">{donation.total_weight} kg</p>
                           </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Donor Details */}
                    <div className="lg:col-span-1 bg-dark-900/50 rounded-lg p-4 border border-dark-700">
                      <h4 className="text-xs font-bold text-dark-400 uppercase tracking-widest mb-3">Donor Details</h4>
                      <p className="text-sm font-semibold text-white mb-1">{donation.donor_name}</p>
                      {donation.donor_details && (
                        <div className="space-y-1 text-sm text-dark-300">
                          <p className="flex items-center"><Users className="h-3 w-3 mr-2" /> {donation.donor_details.contact_person || 'N/A'}</p>
                          <p className="flex items-center"><Phone className="h-3 w-3 mr-2" /> {donation.donor_details.phone || 'N/A'}</p>
                          <p className="flex items-center"><MapPin className="h-3 w-3 mr-2" /> {donation.donor_details.address || 'N/A'}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Recipient Details */}
                    <div className="lg:col-span-1 bg-dark-900/50 rounded-lg p-4 border border-dark-700">
                      <h4 className="text-xs font-bold text-dark-400 uppercase tracking-widest mb-3">Recipient Details</h4>
                      <p className="text-sm font-semibold text-white mb-1">{donation.recipient_name || 'Not Assigned'}</p>
                      {donation.recipient_details && (
                        <div className="space-y-1 text-sm text-dark-300">
                          <p className="flex items-center"><Users className="h-3 w-3 mr-2" /> {donation.recipient_details.contact_person || 'N/A'}</p>
                          <p className="flex items-center"><Phone className="h-3 w-3 mr-2" /> {donation.recipient_details.phone || 'N/A'}</p>
                          <p className="flex items-center"><MapPin className="h-3 w-3 mr-2" /> {donation.recipient_details.address || 'N/A'}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="lg:col-span-1 flex flex-col justify-center gap-3 border-t lg:border-t-0 lg:border-l border-dark-700 pt-4 lg:pt-0 lg:pl-6">
                      <p className="text-xs text-center text-dark-400 mb-2">Resolve Exception</p>
                      <button
                        onClick={() => initiateResolution(donation.id, 'completed')}
                        disabled={resolvingId === donation.id}
                        className="flex items-center justify-center w-full bg-accent-green hover:bg-accent-green-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 font-medium text-sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Delivered
                      </button>
                      <button
                        onClick={() => initiateResolution(donation.id, 'cancelled')}
                        disabled={resolvingId === donation.id}
                        className="flex items-center justify-center w-full bg-dark-700 hover:bg-dark-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 border border-dark-600 font-medium text-sm"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Donation
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Impact Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700 border-l-4 border-l-accent-green hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-3">
              <Package className="h-5 w-5 text-accent-green mr-2" />
              <h3 className="text-lg font-semibold text-white">Waste Prevented</h3>
            </div>
            <p className="text-3xl font-bold text-accent-green">{dashboardStats.impact.waste_prevented_kg.toFixed(2)}</p>
            <p className="text-sm text-dark-400 mt-1">kilograms saved from landfills</p>
          </div>
          <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700 border-l-4 border-l-brand-500 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-3">
              <Leaf className="h-5 w-5 text-brand-400 mr-2" />
              <h3 className="text-lg font-semibold text-white">CO2 Emissions Saved</h3>
            </div>
            <p className="text-3xl font-bold text-brand-400">{dashboardStats.impact.co2_saved_kg.toFixed(2)}</p>
            <p className="text-sm text-dark-400 mt-1">kilograms of carbon dioxide</p>
          </div>
          <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700 border-l-4 border-l-accent-orange hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-3">
              <Users className="h-5 w-5 text-accent-orange mr-2" />
              <h3 className="text-lg font-semibold text-white">Meals Provided</h3>
            </div>
            <p className="text-3xl font-bold text-accent-orange">{dashboardStats.impact.meals_provided}</p>
            <p className="text-sm text-dark-400 mt-1">people fed through our network</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donation Trends */}
          <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700 hover:shadow-xl transition-all duration-300">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center">
              <TrendingUp className="h-5 w-5 text-brand-400 mr-2" />
              Donation Trends (Last 30 Days)
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={donationTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF" 
                    style={{ fontSize: '12px' }} 
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#9CA3AF" 
                    style={{ fontSize: '12px' }} 
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F3F4F6' }}
                    itemStyle={{ color: '#F3F4F6' }}
                    labelStyle={{ color: '#9CA3AF' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#0EA5E9" 
                    strokeWidth={3} 
                    name="Donations" 
                    dot={{ fill: '#0EA5E9', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Urgency Breakdown */}
          <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700 hover:shadow-xl transition-all duration-300">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center">
              <AlertCircle className="h-5 w-5 text-accent-red mr-2" />
              Food Urgency Levels
            </h3>
            {urgencyBreakdown.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={urgencyBreakdown}
                      dataKey="count"
                      nameKey="urgency_display"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      label={({ name, percent }) => {
                        const match = name.match(/\([^)]+\)/);
                        const shortLabel = match ? match[0] : name;
                        return `${shortLabel}: ${(percent * 100).toFixed(0)}%`;
                      }}
                      labelLine={false}
                    >
                      {urgencyBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F3F4F6' }} />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      formatter={(value) => <span className="text-dark-300">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-dark-500">
                No urgency data available
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-dark-800 border-t border-dark-700 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-dark-500 text-sm">© 2026 ShareEat. All rights reserved.</p>
        </div>
      </footer>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-dark-800 rounded-2xl shadow-2xl border border-dark-700 max-w-md w-full p-6 transform transition-all scale-100">
            <div className="flex items-center justify-center mb-6">
              <div className={`p-4 rounded-full ${confirmModal.action === 'completed' ? 'bg-accent-green/10' : 'bg-accent-red/10'}`}>
                {confirmModal.action === 'completed' ? (
                  <CheckCircle className="h-10 w-10 text-accent-green" />
                ) : (
                  <AlertTriangle className="h-10 w-10 text-accent-red" />
                )}
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-white text-center mb-2">
              {confirmModal.action === 'completed' ? 'Confirm Delivery' : 'Cancel Donation'}
            </h3>
            
            <p className="text-dark-300 text-center mb-8">
              Are you sure you want to mark Donation #{confirmModal.donationId} as 
              <span className={`font-bold ${confirmModal.action === 'completed' ? 'text-accent-green' : 'text-accent-red'}`}>
                {' '}{confirmModal.action === 'completed' ? 'Delivered' : 'Cancelled'}
              </span>?
              {confirmModal.action === 'cancelled' && " This action cannot be undone."}
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setConfirmModal({ isOpen: false, action: null, donationId: null })}
                className="px-4 py-3 rounded-xl bg-dark-700 text-white font-semibold hover:bg-dark-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolution}
                className={`px-4 py-3 rounded-xl text-white font-bold shadow-lg transition-all transform hover:-translate-y-0.5 ${
                  confirmModal.action === 'completed' 
                    ? 'bg-accent-green hover:bg-accent-green-600 hover:shadow-accent-green/20' 
                    : 'bg-accent-red hover:bg-accent-red-600 hover:shadow-accent-red/20'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
