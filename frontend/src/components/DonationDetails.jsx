import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { donationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Package, User, CheckCircle, ArrowLeft, XCircle, Star, Truck, MapPin } from 'lucide-react';
import ConfirmationModal from './common/ConfirmationModal';
import DonationMap from './DonationMap';

const DonationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        const response = await donationsAPI.getById(id);
        setDonation(response.data);
      } catch (error) {
        console.error('Error fetching donation details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDonation();
  }, [id]);

  const handleReject = async () => {
    try {
      setActionLoading(true);
      await donationsAPI.cancel(id);
      // Navigate back to dashboard after rejection
      navigate('/dashboard');
    } catch (error) {
      console.error('Error rejecting donation:', error);
      alert('Failed to reject donation');
    } finally {
      setActionLoading(false);
      setShowRejectModal(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setActionLoading(true);
      const response = await donationsAPI.confirm(id);
      setDonation(response.data);
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Error confirming donation:', error);
      alert('Failed to confirm donation: ' + (error.response?.data?.error || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    try {
      setActionLoading(true);
      await donationsAPI.confirmReceipt(id, rating);
      setDonation({ ...donation, status: 'completed' });
      setShowReceiptModal(false);
      alert('Receipt confirmed and volunteer rated successfully!');
    } catch (error) {
      console.error('Error confirming receipt:', error);
      alert('Failed to confirm receipt: ' + (error.response?.data?.error || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handlePickup = async () => {
    try {
      setActionLoading(true);
      const response = await donationsAPI.pickup(id);
      setDonation(response.data);
      alert('Donation marked as picked up!');
    } catch (error) {
      console.error('Error marking pickup:', error);
      alert('Failed to mark pickup: ' + (error.response?.data?.error || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-500"></div>
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center text-white">
        Donation not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 font-sans">
      <header className="bg-dark-800 shadow-sm border-b border-dark-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-white">Donation Request #{donation.id}</h1>
              <p className="text-gray-400 text-sm mt-1">Created on {new Date(donation.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                donation.status === 'pending' ? 'bg-brand-500/20 text-brand-400' :
                donation.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                donation.status === 'picked_up' ? 'bg-amber-500/20 text-amber-400' :
                donation.status === 'in_transit' ? 'bg-purple-500/20 text-purple-400' :
                donation.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                'bg-gray-700 text-gray-400'
              }`}>
                {donation.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
             {/* Map Section */}
             <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 shadow-lg">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-brand-500" />
                  Delivery Route
                </h2>
                <DonationMap 
                  donor={donation.donor_details} 
                  recipient={donation.recipient_details} 
                />
             </div>

            {/* Donation Items */}
            <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2 text-brand-500" />
                Requested Items
              </h2>
              <div className="space-y-4">
                {donation.items && donation.items.length > 0 ? (
                  donation.items.map((item, index) => (
                    <div key={item.id || index} className="bg-dark-700/50 p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-white">
                          {item.food_item_name || item.food_item_details?.name || 'Food Item'}
                        </h3>
                        <p className="text-sm text-gray-400">
                          Quantity: {item.quantity} {item.food_item_details?.unit || 'units'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-dark-700/50 p-4 rounded-lg flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-white">
                        {donation.food_item_details?.name || 'Food Item'}
                      </h3>
                      <p className="text-sm text-gray-400">
                         Quantity: {donation.food_item_details?.quantity || donation.quantity || 'N/A'} {donation.food_item_details?.unit || ''}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Recipient Info */}
            <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-brand-500" />
                Recipient Details
              </h2>
              <div className="space-y-3">
                <p className="text-gray-300">
                  <span className="text-gray-500 block text-xs uppercase tracking-wide">Organization</span>
                  {donation.recipient_details?.organization_name || 'N/A'}
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-500 block text-xs uppercase tracking-wide">Contact</span>
                  {donation.recipient_details?.contact_person || 'N/A'}
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-500 block text-xs uppercase tracking-wide">Address</span>
                  {donation.recipient_details?.address || 'N/A'}
                </p>
              </div>
            </div>

            {/* Donor Info */}
            <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2 text-brand-500" />
                Pickup Details
              </h2>
              <div className="space-y-3">
                <p className="text-gray-300">
                  <span className="text-gray-500 block text-xs uppercase tracking-wide">Donor</span>
                  {donation.donor_details?.business_name || donation.donor_name || 'N/A'}
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-500 block text-xs uppercase tracking-wide">Contact</span>
                  {donation.donor_details?.contact_person || 'N/A'}
                </p>
                <p className="text-gray-300">
                   <span className="text-gray-500 block text-xs uppercase tracking-wide">Address</span>
                   {donation.donor_details?.address || 'N/A'}
                </p>
              </div>
            </div>
            
            {/* Actions Section */}
            {(user?.role === 'volunteer' || user?.role === 'donor' || user?.role === 'recipient') && (
              <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 shadow-lg">
                <h2 className="text-lg font-semibold text-white mb-4">Actions</h2>
                
                {/* Donor Actions */}
                {user?.role === 'donor' && donation.status === 'pending' && (
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading}
                      className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl font-semibold text-white shadow-lg transition-all border border-red-500/30 ${
                        actionLoading 
                          ? 'bg-gray-600 cursor-not-allowed' 
                          : 'bg-red-500/10 hover:bg-red-500/20 text-red-500'
                      }`}
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      Reject
                    </button>
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={actionLoading}
                      className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl font-semibold text-white shadow-lg transition-all ${
                        actionLoading 
                          ? 'bg-gray-600 cursor-not-allowed' 
                          : 'bg-green-600 hover:bg-green-700 hover:shadow-green-500/20'
                      }`}
                    >
                      {actionLoading ? 'Processing...' : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Confirm
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Volunteer Actions */}
                {user?.role === 'volunteer' && (
                  <div className="flex flex-col gap-3">
                    {donation.status === 'confirmed' && (
                      <button
                        onClick={handlePickup}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-white shadow-lg transition-all bg-brand-600 hover:bg-brand-700 hover:shadow-brand-500/20"
                      >
                        {actionLoading ? 'Processing...' : (
                          <>
                            <Truck className="h-5 w-5 mr-2" />
                            Mark as Picked Up
                          </>
                        )}
                      </button>
                    )}
                    
                    {(donation.status === 'picked_up' || donation.status === 'in_transit') && (
                      <p className="text-center text-gray-400 italic bg-dark-700/30 p-3 rounded-lg border border-dark-600">
                         Delivery in progress. Waiting for recipient confirmation.
                      </p>
                    )}
                    
                    {['pending', 'completed', 'cancelled', 'rejected'].includes(donation.status) && (
                       <p className="text-center text-gray-400 italic">No actions available at this stage.</p>
                    )}
                  </div>
                )}

                {/* Recipient Actions */}
                {user?.role === 'recipient' && (donation.status === 'picked_up' || donation.status === 'in_transit' || donation.status === 'delivered') && (
                  <button
                    onClick={() => setShowReceiptModal(true)}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-white shadow-lg transition-all bg-green-600 hover:bg-green-700 hover:shadow-green-500/20"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Mark as Delivered
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Rating Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
            onClick={() => setShowReceiptModal(false)}
          ></div>
          <div className="relative bg-dark-800 rounded-2xl border border-dark-700 shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-white mb-2">Confirm Receipt & Rate Volunteer</h3>
            <p className="text-gray-400 mb-6">
              Please confirm you have received the donation and rate the volunteer's service.
            </p>
            
            <div className="flex justify-center space-x-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none transition-transform hover:scale-110"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <Star 
                    className={`h-10 w-10 ${
                      star <= (hoverRating || rating) 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-600'
                    }`} 
                  />
                </button>
              ))}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-dark-700 border border-transparent hover:border-dark-600"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReceipt}
                disabled={actionLoading}
                className="px-5 py-2 rounded-lg font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/20"
              >
                {actionLoading ? 'Processing...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirm}
        title="Confirm Donation Request"
        message="Are you sure you want to confirm this donation request? This action cannot be undone."
        confirmText="Confirm Request"
        isProcessing={actionLoading}
      />
      
      <ConfirmationModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleReject}
        title="Reject Donation Request"
        message="Are you sure you want to reject this request? The food item will be made available for other recipients."
        confirmText="Reject Request"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        isProcessing={actionLoading}
      />
    </div>
  );
};

export default DonationDetails;
