import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Truck, Map, Star, Activity, CheckCircle, XCircle, MapPin, Power, Clock } from 'lucide-react';
import { volunteersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import ConfirmationModal from '../common/ConfirmationModal';

const VolunteerDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [requests, setRequests] = useState([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_distance: 0,
    rating: 5.0,
    completed_deliveries: 0
  });

  // Manages modal state.
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedRequestToReject, setSelectedRequestToReject] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Manages active tab state.
  const [activeTab, setActiveTab] = useState('dashboard');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, requestsRes] = await Promise.all([
        volunteersAPI.getById(user.profile_id),
        volunteersAPI.getDeliveryRequests()
      ]);

      setIsAvailable(profileRes.data?.is_available || false);
      const requestsData = requestsRes.data?.results || requestsRes.data;
      setRequests(Array.isArray(requestsData) ? requestsData : []);
      setStats({
        total_distance: profileRes.data?.total_distance || 0,
        rating: profileRes.data?.rating || 5.0,
        completed_deliveries: profileRes.data?.total_deliveries || 0
      });
    } catch (error) {
      console.error('Error fetching volunteer data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'deliveries') {
      setActiveTab('deliveries');
    } else {
      setActiveTab('dashboard');
    }
  }, [location.search]);

  useEffect(() => {
    if (user?.profile_id) {
      fetchData();
    } else if (user) {
      setLoading(false);
    }
  }, [user, fetchData]);

  const handleToggleAvailability = async () => {
    try {
      const res = await volunteersAPI.toggleAvailability(user.profile_id);
      setIsAvailable(res.data.is_available);
      toast.success(res.data.is_available ? 'You are now available' : 'You are now unavailable');
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error('Failed to update availability');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await volunteersAPI.acceptRequest(requestId);
      toast.success('Delivery request accepted!');
      fetchData(); // Refreshes the request list.
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request. It might have been taken or expired.');
    }
  };

  const openRejectModal = (request) => {
    setSelectedRequestToReject(request);
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedRequestToReject) return;
    
    setIsProcessing(true);
    try {
      await volunteersAPI.rejectRequest(selectedRequestToReject.id);
      toast.success('Request rejected');
      setIsRejectModalOpen(false);
      fetchData(); // Refreshes the request list.
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setIsProcessing(false);
      setSelectedRequestToReject(null);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const activeDeliveries = requests.filter(r => r.status === 'accepted');
  const completedDeliveries = requests.filter(r => r.status === 'completed' || r.status === 'delivered');

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Volunteer Dashboard</h1>
            <p className="text-gray-400 text-sm mt-0.5">Help deliver food and track your community impact.</p>
          </div>
          
          {/* Toggles availability status. */}
          <button 
            onClick={handleToggleAvailability}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              isAvailable 
                ? 'bg-accent-green/10 text-accent-green border border-accent-green/20 hover:bg-accent-green/20' 
                : 'bg-dark-700 text-dark-400 border border-dark-600 hover:bg-dark-600'
            }`}
          >
            <Power className="mr-2 h-5 w-5" />
            {isAvailable ? 'Available' : 'Not Available'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Navigates to pending requests section. */}
              <div className="bg-dark-800 p-6 rounded-xl border border-dark-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Truck className="mr-2 h-5 w-5 text-brand-500" />
                  Incoming Requests
                </h2>
                <a 
                  href="#requests-section" 
                  className="flex items-center justify-center w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors font-medium shadow-md hover:shadow-brand-500/20"
                >
                  <Truck className="mr-2 h-5 w-5" />
                  View {pendingRequests.length} Pending
                </a>
              </div>

              <div className="bg-dark-800 p-6 rounded-xl border border-dark-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                   <h2 className="text-lg font-semibold text-white">Completed</h2>
                   <div className="bg-dark-700 p-2 rounded-lg">
                     <Map className="h-6 w-6 text-brand-500" />
                   </div>
                </div>
                <p className="text-4xl font-bold text-white group-hover:text-brand-400 transition-colors">{stats.completed_deliveries}</p>
                <p className="text-sm text-gray-400 mt-2">Total deliveries</p>
              </div>
              
               <div className="bg-dark-800 p-6 rounded-xl border border-dark-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                   <h2 className="text-lg font-semibold text-white">Rating</h2>
                   <div className="bg-amber-900/30 p-2 rounded-lg">
                     <Star className="h-6 w-6 text-amber-500" />
                   </div>
                </div>
                <p className="text-4xl font-bold text-white group-hover:text-amber-400 transition-colors">{Number(stats?.rating || 0).toFixed(1)}</p>
                <p className="text-sm text-gray-400 mt-2">Average rating</p>
              </div>
            </div>

            {/* Displays pending requests. */}
            <div id="requests-section" className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                 <Activity className="mr-2 h-6 w-6 text-brand-500" />
                 Delivery Requests ({pendingRequests.length})
              </h2>
              
              {pendingRequests.length === 0 ? (
                <div className="bg-dark-800 rounded-xl border border-dark-700 p-8 text-center">
                   <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dark-700 mb-4">
                      <Truck className="h-8 w-8 text-gray-500" />
                   </div>
                   <h3 className="text-lg font-medium text-white mb-1">No pending requests</h3>
                   <p className="text-gray-400">
                     Stay available to receive delivery requests nearby.
                   </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="bg-dark-800 rounded-xl border border-dark-700 shadow-lg overflow-hidden">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-2">
                              New Request
                            </span>
                            <h3 className="text-lg font-bold text-white">Donation #{req.donation.id}</h3>
                            <p className="text-sm text-dark-400">Created {new Date(req.created_at).toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                             <div className="text-xl font-bold text-white">{req.donation.total_weight} kg</div>
                             <div className="text-sm text-dark-400">Capacity</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div className="bg-dark-900/50 p-4 rounded-lg border border-dark-700">
                            <h4 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-2">Pickup From</h4>
                            <div className="flex items-start">
                              <MapPin className="h-5 w-5 text-accent-orange mt-0.5 mr-2" />
                              <div>
                                <p className="font-medium text-white">{req.donation.donor_name}</p>
                                <p className="text-sm text-dark-400">{req.donation.donor_details?.address || 'Address not available'}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-dark-900/50 p-4 rounded-lg border border-dark-700">
                            <h4 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-2">Deliver To</h4>
                            <div className="flex items-start">
                               <MapPin className="h-5 w-5 text-accent-green mt-0.5 mr-2" />
                               <div>
                                 <p className="font-medium text-white">{req.donation.recipient_details?.organization_name}</p>
                                 <p className="text-sm text-dark-400">{req.donation.recipient_details?.address || 'Address not available'}</p>
                               </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-4">
                          <button
                            onClick={() => handleAcceptRequest(req.id)}
                            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                          >
                            <CheckCircle className="mr-2 h-5 w-5" />
                            Accept Delivery
                          </button>
                          <button
                            onClick={() => openRejectModal(req)}
                            className="flex-1 bg-dark-700 hover:bg-dark-600 text-dark-200 font-bold py-3 px-4 rounded-lg transition-colors border border-dark-600 flex items-center justify-center"
                          >
                            <XCircle className="mr-2 h-5 w-5" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-8">
            {/* Displays active deliveries. */}
            <div className="bg-dark-800 rounded-xl border border-dark-700 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-dark-700 flex items-center">
                <Activity className="h-5 w-5 text-brand-500 mr-2" />
                <h3 className="text-lg font-semibold text-white">Active Deliveries</h3>
              </div>
              
              {activeDeliveries.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dark-700 mb-4">
                    <Truck className="h-8 w-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-1">No active deliveries</h3>
                  <p className="text-gray-400 max-w-sm mx-auto">
                    Accepted deliveries will appear here.
                  </p>
                </div>
              ) : (
                 <div className="divide-y divide-dark-700">
                   {activeDeliveries.map((req) => (
                     <div key={req.id} className="p-6 hover:bg-dark-700/50 transition-colors">
                        <div className="flex justify-between items-center">
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                 <h4 className="font-medium text-white">Donation #{req.donation.id}</h4>
                                 <span className="text-xs px-2 py-0.5 rounded-full border bg-brand-500/10 text-brand-400 border-brand-500/20">
                                   In Progress
                                 </span>
                              </div>
                              <p className="text-sm text-dark-400">
                                {req.donation.recipient_details?.organization_name}
                              </p>
                           </div>
                           <Link 
                             to={`/donations/${req.donation.id}`}
                             className="text-sm text-brand-400 hover:text-brand-300 font-medium"
                           >
                             View Details
                           </Link>
                        </div>
                     </div>
                   ))}
                 </div>
              )}
            </div>

            {/* Displays delivery history. */}
            <div className="bg-dark-800 rounded-xl border border-dark-700 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-dark-700 flex items-center">
                <Clock className="h-5 w-5 text-brand-500 mr-2" />
                <h3 className="text-lg font-semibold text-white">Delivery History</h3>
              </div>
              
              {completedDeliveries.length === 0 ? (
                <div className="p-12 text-center">
                   <p className="text-gray-400">No completed deliveries yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-dark-700">
                  {completedDeliveries.map((req) => (
                    <div key={req.id} className="p-6 hover:bg-dark-700/50 transition-colors">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-white">Donation #{req.donation.id}</h4>
                        <span className="text-xs px-2 py-0.5 rounded-full border bg-green-500/10 text-green-400 border-green-500/20">
                          Completed
                        </span>
                      </div>
                      <p className="text-sm text-dark-400 mt-1">Delivered on {new Date(req.updated_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <ConfirmationModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleConfirmReject}
        title="Reject Delivery Request"
        message="Are you sure you want to reject this request? It will be assigned to the next available volunteer."
        confirmText="Reject Request"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default VolunteerDashboard;