import { useState, useEffect, useCallback } from 'react';
import { donationsAPI, foodItemsAPI, analyticsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HandHeart, TrendingUp, CheckCircle, Package, Search, Truck, Clock, XCircle } from 'lucide-react';

const Donations = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [activeItemsCount, setActiveItemsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounces search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchDonations = useCallback(async () => {
    try {
      const params = {};
      if (debouncedQuery) {
        params.search = debouncedQuery;
      }
      
      // Filters by user role
      if (user && user.profile_id) {
        if (user.role === 'donor') {
          params.donor = user.profile_id;
        } else if (user.role === 'recipient') {
          params.recipient = user.profile_id;
        }
      }

      const promises = [
        donationsAPI.getAll(params),
        analyticsAPI.getDashboardStats(),
      ];

      // Fetches active food items count
      if (user) {
        const itemParams = { available: 'true' };
        if (user.role === 'donor' && user.profile_id) {
          itemParams.donor = user.profile_id;
        }
        promises.push(foodItemsAPI.getAll(itemParams));
      }

      const results = await Promise.all(promises);
      const donationsRes = results[0];
      const statsRes = results[1];
      const itemsRes = results[2]; 

      setDonations(donationsRes.data.results || donationsRes.data);
      
      // Maps dashboard stats
      const dashboardStats = statsRes.data;
      setStatistics({
        in_progress: dashboardStats.donations.active,
        completed: dashboardStats.donations.completed,
        total_weight: dashboardStats.impact.waste_prevented_kg
      });
      
      if (itemsRes && itemsRes.data) {
        // Uses count directly
        setActiveItemsCount(itemsRes.data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoading(false);
    }
  }, [user, debouncedQuery]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const formatStatus = (donation) => {
    if (!donation || !donation.status) return '';
    const { status } = donation;

    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getStatusIcon = (donation) => {
    const { status } = donation;
    
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <CheckCircle className="w-3 h-3 mr-1" />;
      case 'in_transit':
      case 'picked_up':
        return <Truck className="w-3 h-3 mr-1" />;
      case 'pending':
      case 'pending_manual_assignment':
        return <Clock className="w-3 h-3 mr-1" />;
      case 'cancelled':
        return <XCircle className="w-3 h-3 mr-1" />;
      default:
        return <Clock className="w-3 h-3 mr-1" />;
    }
  };

  // Returns status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-accent-green/10 text-accent-green border border-accent-green/20';
      case 'in_transit':
      case 'picked_up':
        return 'bg-brand-500/10 text-brand-400 border border-brand-500/20';
      case 'pending':
        return 'bg-dark-700/50 text-dark-400 border border-dark-600';
      case 'cancelled':
        return 'bg-accent-red/10 text-accent-red border border-accent-red/20';
      default:
        return 'bg-dark-700/50 text-dark-400 border border-dark-600';
    }
  };

  const getDeliveryStatusIcon = (status) => {
    if (status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-accent-green" />;
    } else if (status === 'cancelled' || status === 'rejected') {
      return <XCircle className="w-5 h-5 text-accent-red" />;
    } else {
      // Handles intermediate status
      return <Clock className="w-5 h-5 text-accent-orange" />;
    }
  };

  const getVolunteerStatus = (donation) => {
    if (donation.status === 'cancelled') return 'Cancelled';
    if (donation.status === 'pending_manual_assignment') return 'Pending Manual Assignment';
    if (!donation.volunteer_name || donation.volunteer_name === 'Not Assigned') return 'Pending';
    if (donation.status === 'confirmed') return 'Assigned';
    if (donation.status === 'picked_up') return 'Picked Up';
    if (donation.status === 'in_transit') return 'In Transit';
    if (donation.status === 'delivered') return 'Delivered';
    if (donation.status === 'completed') return 'Completed';
    return 'Pending';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-dark-400">Loading donations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-dark-800 shadow-sm border-b border-dark-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <HandHeart className="h-40 w-40 text-accent-green transform rotate-12" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                 <div className="h-1 w-10 bg-accent-green rounded-full"></div>
                 <span className="text-accent-green font-semibold tracking-wider text-sm uppercase">Chain of Custody</span>
              </div>
              <h2 className="text-4xl font-display font-bold text-white tracking-tight">Logistics & Tracking</h2>
              <p className="text-dark-400 mt-2 text-lg font-light">End-to-end visibility of the rescue chain.</p>
            </div>
             <div className="w-full md:w-auto">
              <div className="relative group">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Track ID or status..." 
                  className="bg-dark-900/50 border border-dark-600 text-dark-200 rounded-xl pl-12 pr-6 py-3 focus:outline-none focus:ring-2 focus:ring-accent-green focus:border-transparent w-full md:w-80 transition-all shadow-inner"
                />
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-dark-400 group-focus-within:text-accent-green transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-dark-800 rounded-xl shadow-lg border border-dark-700 p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-dark-400 uppercase tracking-widest">Active Listings</p>
                  <p className="text-3xl font-display font-bold text-white mt-2">{activeItemsCount}</p>
                </div>
                <div className="bg-brand-500/10 p-3 rounded-lg border border-brand-500/20">
                  <Package className="h-8 w-8 text-brand-500" />
                </div>
              </div>
            </div>
            <div className="bg-dark-800 rounded-xl shadow-lg border border-dark-700 p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-dark-400 uppercase tracking-widest">In Progress</p>
                  <p className="text-3xl font-display font-bold text-white mt-2">{statistics.in_progress}</p>
                </div>
                <div className="bg-accent-orange/10 p-3 rounded-lg border border-accent-orange/20">
                  <TrendingUp className="h-8 w-8 text-accent-orange" />
                </div>
              </div>
            </div>
            <div className="bg-dark-800 rounded-xl shadow-lg border border-dark-700 p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-dark-400 uppercase tracking-widest">Completed</p>
                  <p className="text-3xl font-display font-bold text-white mt-2">{statistics.completed}</p>
                </div>
                <div className="bg-accent-green/10 p-3 rounded-lg border border-accent-green/20">
                  <CheckCircle className="h-8 w-8 text-accent-green" />
                </div>
              </div>
            </div>
             <div className="bg-dark-800 rounded-xl shadow-lg border border-dark-700 p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-dark-400 uppercase tracking-widest">Total Quantity</p>
                  <p className="text-3xl font-display font-bold text-white mt-2">{statistics.total_weight || 0} kg</p>
                </div>
                <div className="bg-accent-purple/10 p-3 rounded-lg border border-accent-purple/20">
                  <Package className="h-8 w-8 text-accent-purple" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Donations List/Table */}
        <div className="bg-dark-800 rounded-xl shadow-lg border border-dark-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-700">
              <thead className="bg-dark-900/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                    Item
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-dark-400 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-dark-400 uppercase tracking-wider">
                    Food Request
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                    Volunteer
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-dark-400 uppercase tracking-wider">
                    Volunteer Status
                  </th>
                   <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-dark-400 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {donations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-dark-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <div className="flex items-center">
                        <div className="mr-3">
                          {getDeliveryStatusIcon(donation.status)}
                        </div>
                        <div className="text-left ml-4">
                          <div className="text-sm font-medium text-white">{donation.item_summary || 'Unknown Item'}</div>
                          <div className="text-xs text-dark-400">ID: #{donation.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-dark-200">{donation.total_weight} kg</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border w-fit ${getStatusColor(donation)}`}>
                          {getStatusIcon(donation)}
                          {formatStatus(donation)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <div className="text-sm text-dark-200">{donation.recipient_details?.organization_name || 'Not Assigned'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <div className="text-sm text-dark-200">{donation.volunteer_name || 'Not Assigned'}</div>
                      {donation.volunteer_phone && (
                        <div className="text-xs text-dark-400">{donation.volunteer_phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        donation.status === 'pending_manual_assignment'
                          ? 'bg-accent-red/20 text-accent-red border-accent-red/40 animate-pulse'
                          : donation.status === 'cancelled'
                            ? 'bg-accent-red/10 text-accent-red border-accent-red/20'
                            : (donation.status === 'delivered' || donation.status === 'completed')
                              ? 'bg-brand-500/10 text-brand-400 border-brand-500/20'
                              : donation.volunteer_name && donation.volunteer_name !== 'Not Assigned' 
                                ? 'bg-brand-500/10 text-brand-400 border-brand-500/20'
                                : 'bg-dark-700/50 text-dark-400 border-dark-600'
                      }`}>
                        {getVolunteerStatus(donation)}
                      </span>
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-400 text-center">
                      {new Date(donation.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {donations.length === 0 && (
            <div className="text-center py-12">
              <HandHeart className="h-12 w-12 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400">No donations found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Donations;
