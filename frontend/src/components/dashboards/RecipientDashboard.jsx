import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingBag, MapPin, Activity, CheckCircle, Clock, Truck, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { donationsAPI } from '../../services/api';
import ReviewModal from '../common/ReviewModal';
import toast from 'react-hot-toast';

const RecipientDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCount, setActiveCount] = useState(0);
  
  // Manages review modal state.
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedDonationId, setSelectedDonationId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await donationsAPI.getAll({ 
        recipient: user.profile_id 
      });
      const data = response.data?.results || response.data;
      const safeData = Array.isArray(data) ? data : [];
      setRequests(safeData);
      
      // Calculates count of active requests.
      const active = safeData.filter(r => 
        ['pending', 'confirmed', 'picked_up', 'in_transit'].includes(r.status)
      ).length;
      setActiveCount(active);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load your requests');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.profile_id) {
      fetchRequests();
    } else if (user) {
      setLoading(false);
    }
  }, [user, fetchRequests]);

  const handleConfirmDeliveryClick = (donationId) => {
    setSelectedDonationId(donationId);
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async (rating) => {
    if (!selectedDonationId) return;
    
    setIsProcessing(true);
    try {
      await donationsAPI.confirmReceipt(selectedDonationId, rating);
      toast.success('Delivery confirmed and review submitted!');
      setReviewModalOpen(false);
      fetchRequests(); // Refreshes the request list.
    } catch (error) {
      console.error('Error confirming delivery:', error);
      toast.error(error.response?.data?.error || 'Failed to confirm delivery');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      confirmed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      picked_up: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      in_transit: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      delivered: 'bg-green-500/10 text-green-500 border-green-500/20',
      completed: 'bg-green-500/10 text-green-500 border-green-500/20',
      cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
    };

    const labels = {
      pending: 'Requested',
      confirmed: 'Approved',
      picked_up: 'On the Way',
      in_transit: 'On the Way',
      delivered: 'Delivered',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-dark-900 font-sans">
      <header className="bg-dark-800 shadow-sm border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-white">Recipient Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Find food donations and manage your requests.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Quick action to find food. */}
          <div className="bg-dark-800 p-6 rounded-xl border border-dark-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Search className="mr-2 h-5 w-5 text-brand-500" />
              Find Food
            </h2>
            <Link 
              to="/food-items" 
              className="flex items-center justify-center w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors font-medium shadow-md hover:shadow-brand-500/20"
            >
              <Search className="mr-2 h-5 w-5" />
              Browse Available Items
            </Link>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl border border-dark-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-semibold text-white">My Requests</h2>
               <div className="bg-dark-700 p-2 rounded-lg">
                 <ShoppingBag className="h-6 w-6 text-brand-500" />
               </div>
            </div>
            <p className="text-4xl font-bold text-white group-hover:text-brand-400 transition-colors">
              {loading ? '-' : activeCount}
            </p>
            <p className="text-sm text-gray-400 mt-2">Active requests</p>
          </div>
          
           <div className="bg-dark-800 p-6 rounded-xl border border-dark-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-semibold text-white">Nearby Donors</h2>
               <div className="bg-red-900/30 p-2 rounded-lg">
                 <MapPin className="h-6 w-6 text-red-500" />
               </div>
            </div>
            <p className="text-4xl font-bold text-white group-hover:text-red-400 transition-colors">--</p>
            <p className="text-sm text-gray-400 mt-2">Within 5km radius</p>
          </div>
        </div>

        <div className="bg-dark-800 rounded-xl border border-dark-700 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-dark-700 flex items-center">
            <Activity className="h-5 w-5 text-brand-500 mr-2" />
            <h3 className="text-lg font-semibold text-white">Recent Requests</h3>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading requests...</p>
            </div>
          ) : requests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-dark-700">
                <thead className="bg-dark-800">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-1/4">
                      Item Details
                    </th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Donor
                    </th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700 bg-dark-900/20">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-dark-800/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-dark-700 flex items-center justify-center text-brand-500">
                            <ShoppingBag className="h-5 w-5" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white group-hover:text-brand-400 transition-colors">
                              {request.item_summary || 'Food Donation'}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {request.total_weight} kg
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center text-sm text-gray-400">
                          <Clock className="h-4 w-4 mr-2 text-gray-600" />
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300 font-medium">
                          {request.donor_details?.business_name || 'Unknown Donor'}
                        </div>
                        {request.donor_details?.address && (
                          <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[150px]">
                            {request.donor_details.address}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        {(request.status === 'picked_up' || request.status === 'in_transit') ? (
                          <button
                            onClick={() => handleConfirmDeliveryClick(request.id)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-semibold rounded-lg text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 shadow-lg hover:shadow-brand-500/30 transition-all duration-200"
                          >
                            <CheckCircle className="h-4 w-4 mr-1.5" />
                            Confirm Delivery
                          </button>
                        ) : request.status === 'completed' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                            Confirmed
                          </span>
                        ) : (
                          <span className="text-gray-600 text-xs italic">
                            No actions
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dark-700 mb-4">
                <ShoppingBag className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">No requests yet</h3>
              <p className="text-gray-400 max-w-sm mx-auto">
                Start browsing available items to make your first request.
              </p>
            </div>
          )}
        </div>
      </main>

      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onConfirm={handleReviewSubmit}
        title="Confirm Delivery & Rate"
        message="Please confirm that you have received the donation and rate the volunteer's service."
        confirmText="Confirm & Submit"
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default RecipientDashboard;
