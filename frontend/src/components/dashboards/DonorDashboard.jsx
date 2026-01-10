import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Package, Clock, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { foodItemsAPI, donationsAPI } from '../../services/api';

const DonorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeDonations: 0,
    pendingPickups: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);

        if (!user.profile_id) {
          console.warn('User has no profile_id in DonorDashboard', user);
          // Keep default stats
          setLoading(false);
          // Don't return here, render the component with default empty state
        } else {
          // Fetch active food items count
          const itemsRes = await foodItemsAPI.getAll({
            donor: user.profile_id,
            available: 'true'
          });

          // Fetch pending pickups (pending and confirmed donations)
          const pendingRes = await donationsAPI.getAll({
            donor: user.profile_id,
            status: 'pending'
          });
          
          const confirmedRes = await donationsAPI.getAll({
            donor: user.profile_id,
            status: 'confirmed'
          });

          // Fetch recent items for activity feed
          // Using the same items response since it returns recent items by default pagination
          setRecentActivity(itemsRes.data.results ? itemsRes.data.results.slice(0, 3) : []);
          setPendingRequests(pendingRes.data.results || []);

          setStats({
            activeDonations: itemsRes.data.count || 0,
            pendingPickups: (pendingRes.data.count || 0) + (confirmedRes.data.count || 0)
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

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

  return (
    <div className="min-h-screen bg-dark-900 font-sans">
      <header className="bg-dark-800 shadow-sm border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-white">Donor Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage your donations and track your impact.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Quick action to donate food. */}
          <div className="bg-dark-800 p-6 rounded-xl border border-dark-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Plus className="mr-2 h-5 w-5 text-brand-500" />
              Quick Action
            </h2>
            <Link 
              to="/food-items/new" 
              className="flex items-center justify-center w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors font-medium shadow-md hover:shadow-brand-500/20"
            >
              <Plus className="mr-2 h-5 w-5" />
              Donate Food
            </Link>
          </div>

          {/* Stats Placeholder */}
          <div className="bg-dark-800 p-6 rounded-xl border border-dark-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-semibold text-white">Active Listings</h2>
               <div className="bg-dark-700 p-2 rounded-lg">
                 <Package className="h-6 w-6 text-brand-500" />
               </div>
            </div>
            <p className="text-4xl font-bold text-white group-hover:text-brand-400 transition-colors">{stats.activeDonations}</p>
            <p className="text-sm text-gray-400 mt-2">Items currently listed</p>
          </div>
          
           <div className="bg-dark-800 p-6 rounded-xl border border-dark-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-semibold text-white">Pending Pickups</h2>
               <div className="bg-amber-900/30 p-2 rounded-lg">
                 <Clock className="h-6 w-6 text-amber-500" />
               </div>
            </div>
            <p className="text-4xl font-bold text-white group-hover:text-amber-400 transition-colors">{stats.pendingPickups}</p>
            <p className="text-sm text-gray-400 mt-2">Awaiting volunteer pickup</p>
          </div>
        </div>

        <div className="bg-dark-800 rounded-xl border border-dark-700 shadow-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-dark-700 flex items-center justify-between">
            <div className="flex items-center">
               <div className="bg-brand-500/20 p-2 rounded-lg mr-3">
                  <Activity className="h-5 w-5 text-brand-500" />
               </div>
               <h3 className="text-lg font-semibold text-white">Incoming Requests</h3>
            </div>
            {pendingRequests.length > 0 && (
               <span className="bg-brand-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                 {pendingRequests.length} New
               </span>
            )}
          </div>
          
          {pendingRequests.length > 0 ? (
            <div className="divide-y divide-dark-700">
              {pendingRequests.map((request) => (
                <div key={request.id} className="p-6 flex flex-col sm:flex-row items-center justify-between hover:bg-dark-750 transition-colors">
                  <div className="flex items-center mb-4 sm:mb-0 w-full sm:w-auto">
                    <div className="bg-dark-700 p-3 rounded-lg mr-4 hidden sm:block">
                      <Package className="h-6 w-6 text-brand-500" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-lg">{request.recipient_name || 'Unknown Recipient'}</h4>
                      <p className="text-brand-400 font-medium">{request.item_summary}</p>
                      <p className="text-sm text-gray-400 mt-1 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Requested {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">

                    <Link 
                      to={`/donations/${request.id}`}
                      className="flex-1 sm:flex-none text-center bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-lg shadow-brand-500/20"
                    >
                      Review Request
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="p-8 text-center">
                <p className="text-gray-400">No pending requests at the moment.</p>
             </div>
          )}
        </div>

        <div className="bg-dark-800 rounded-xl border border-dark-700 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-dark-700 flex items-center">
            <Activity className="h-5 w-5 text-brand-500 mr-2" />
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          </div>
          {recentActivity.length > 0 ? (
            <div className="divide-y divide-dark-700">
              {recentActivity.map((item) => (
                <div key={item.id} className="p-6 flex items-center justify-between hover:bg-dark-750 transition-colors">
                  <div className="flex items-center">
                    <div className="bg-dark-700 p-3 rounded-lg mr-4">
                      <Package className="h-6 w-6 text-brand-500" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-400">
                        {item.quantity} {item.unit} • Expires {new Date(item.expiry_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.is_available ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                  }`}>
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              ))}
              <div className="p-4 text-center border-t border-dark-700">
                <Link to="/food-items" className="text-brand-500 hover:text-brand-400 text-sm font-medium">
                  View all activity
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dark-700 mb-4">
                <Package className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">No recent activity</h3>
              <p className="text-gray-400 max-w-sm mx-auto">
                Your recent donation activities will appear here once you start donating.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DonorDashboard;
