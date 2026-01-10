import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { foodItemsAPI } from '../services/api';
import { Package, AlertCircle, Clock, Plus, Filter, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from './common/ConfirmationModal';

const FoodItems = () => {
  const { user } = useAuth();
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [confirmingItem, setConfirmingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [requestingMap, setRequestingMap] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchFoodItems = async () => {
      try {
        setLoading(true);
        let response;
        if (filter === 'urgent') {
          response = await foodItemsAPI.getUrgent();
        } else if (filter === 'prioritized') {
          response = await foodItemsAPI.getPrioritized();
        } else {
          response = await foodItemsAPI.getAll({ available: true });
        }
        setFoodItems(response.data.results || response.data);
      } catch (error) {
        console.error('Error fetching food items:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFoodItems();
  }, [filter]);

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical':
        return 'bg-accent-red/10 text-accent-red border border-accent-red/20';
      case 'high':
        return 'bg-accent-orange/10 text-accent-orange border border-accent-orange/20';
      case 'medium':
        return 'bg-brand-500/10 text-brand-400 border border-brand-500/20';
      case 'low':
        return 'bg-accent-green/10 text-accent-green border border-accent-green/20';
      default:
        return 'bg-dark-700/50 text-dark-400 border border-dark-600';
    }
  };

  // Retrieves condition display text by checking multiple field names.
  const getConditionDisplay = (item) => {
    // Checks condition_display first (from serializer).
    if (item.condition_display) {
      return item.condition_display;
    }
    // Falls back to condition field with formatting.
    if (item.condition) {
      return item.condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    // Default fallback
    return 'Not specified';
  };

  const handleRequestItem = (item) => {
    setConfirmingItem(item);
  };

  const handleConfirmRequest = async () => {
    if (!confirmingItem) return;
    
    const itemId = confirmingItem.id;
    console.log('Requesting item:', itemId);

    try {
      setRequestingMap(prev => ({ ...prev, [itemId]: true }));
      console.log('Sending API request...');
      const response = await foodItemsAPI.request(itemId);
      console.log('API request successful:', response);
      // Removed alert to keep it clean with the modal flow, or we can show a toast later
      // alert('Request submitted successfully! The donor has been notified.');
      
      // Update local state to remove the item or mark as requested
      setFoodItems(prevItems => prevItems.filter(item => item.id !== itemId));
      setConfirmingItem(null); // Close modal
      
    } catch (error) {
      console.error('Error requesting item:', error);
      alert(error.response?.data?.error || 'Failed to request item. Please try again.');
    } finally {
      setRequestingMap(prev => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
    }
  };

  // Handles item deletion by donor/admin.
  const handleDeleteClick = (item) => {
    setDeletingItem(item);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    
    try {
      setIsDeleting(true);
      await foodItemsAPI.delete(deletingItem.id);
      
      // Update local state
      setFoodItems(prevItems => prevItems.filter(item => item.id !== deletingItem.id));
      setDeletingItem(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert(error.response?.data?.error || 'Failed to delete item. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-dark-400">Loading food items...</p>
        </div>
      </div>
    );
  }

  // Debugging user role and id
  console.log('Current User:', user);

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-dark-800 shadow-sm border-b border-dark-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Package className="h-40 w-40 text-accent-orange transform -rotate-6" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <div className="flex justify-between items-center">
             <div>
               <div className="flex items-center gap-3 mb-2">
                  <div className="h-1 w-10 bg-accent-orange rounded-full"></div>
                  <span className="text-accent-orange font-semibold tracking-wider text-sm uppercase">Available Now</span>
               </div>
              <h2 className="text-4xl font-display font-bold text-white tracking-tight">Rescue Inventory</h2>
              <p className="text-dark-400 mt-2 text-lg font-light">Live surplus tracking for immediate redistribution</p>
            </div>
            {/* Action button if needed, e.g. for donors */}
            {user?.role === 'donor' && (
              <Link 
                to="/food-items/new"
                className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl flex items-center transition-all shadow-lg hover:shadow-brand-500/25 border border-brand-500/20"
              >
                <Plus className="h-5 w-5 mr-2" />
                <span className="font-semibold">Add New Item</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4 items-center bg-dark-800 p-2 rounded-xl border border-dark-700 w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
              filter === 'all'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                : 'text-dark-400 hover:text-white hover:bg-dark-700'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setFilter('urgent')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm flex items-center ${
              filter === 'urgent'
                ? 'bg-accent-red text-white shadow-lg shadow-accent-red/20'
                : 'text-dark-400 hover:text-white hover:bg-dark-700'
            }`}
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Urgent Only
          </button>
          <button
            onClick={() => setFilter('prioritized')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm flex items-center ${
              filter === 'prioritized'
                ? 'bg-accent-orange text-white shadow-lg shadow-accent-orange/20'
                : 'text-dark-400 hover:text-white hover:bg-dark-700'
            }`}
          >
             <Clock className="h-4 w-4 mr-2" />
            Expiring Soon
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {foodItems.map((item) => (
            <div key={item.id} className="bg-dark-800 rounded-xl shadow-lg border border-dark-700 hover:shadow-xl hover:border-brand-500/50 transition-all duration-300 overflow-hidden group flex flex-col">
              {/* Image Placeholder or Image */}
              <div className="h-32 bg-dark-900 w-full relative overflow-hidden">
                 {/* Gradient Overlay */}
                 <div className="absolute inset-0 bg-gradient-to-t from-dark-800 to-transparent opacity-60"></div>
                 
                 {/* Delete Button for Donor (Own items only) or Admin */}
                 {((user?.role === 'donor' && user?.profile_id === item.donor) || user?.role === 'admin') && (
                   <button
                     onClick={(e) => {
                       e.preventDefault(); 
                       e.stopPropagation();
                       handleDeleteClick(item);
                     }}
                     className="absolute top-2 left-2 z-10 p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/20"
                     title="Delete Item"
                   >
                     <Trash2 className="h-4 w-4" />
                   </button>
                 )}

                 <div className="absolute top-2 right-2 z-10">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${getUrgencyColor(item.urgency_level || item.urgency)}`}>
                      {item.urgency_level || item.urgency} Priority
                    </span>
                 </div>
                 <div className="flex items-center justify-center h-full">
                    <Package className="h-10 w-10 text-dark-600 group-hover:scale-110 transition-transform duration-500" />
                 </div>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors line-clamp-1">{item.name}</h3>
                </div>
                {item.donor_name && (
                  <div className="flex items-center -mt-1 mb-3 text-sm text-brand-400 font-medium">
                    {item.donor_name}
                  </div>
                )}
                
                <div className="space-y-2 flex-1">
                   <div className="flex items-center justify-between text-xs">
                      <span className="text-dark-400">Quantity</span>
                      <span className="font-semibold text-white bg-dark-900 px-1.5 py-0.5 rounded border border-dark-600">{item.quantity} {item.unit}</span>
                   </div>
                   <div className="flex items-center justify-between text-xs">
                      <span className="text-dark-400">Expiry Date</span>
                      <span className="text-accent-orange font-medium flex items-center">
                         <Clock className="h-3 w-3 mr-1" />
                         {new Date(item.expiry_date).toLocaleDateString()}
                      </span>
                   </div>
                   <div className="flex items-center justify-between text-xs">
                      <span className="text-dark-400">Condition</span>
                      <span className="text-dark-300">{getConditionDisplay(item)}</span>
                   </div>
                </div>

                <div className="mt-4 pt-3 border-t border-dark-700">
                  {user?.role === 'recipient' && (
                    <button 
                      onClick={() => handleRequestItem(item)}
                      disabled={requestingMap[item.id]}
                      className={`w-full font-medium py-2 px-4 rounded-lg transition-colors shadow-lg shadow-brand-500/20 ${
                        requestingMap[item.id]
                          ? 'bg-brand-600/50 cursor-not-allowed text-white/50' 
                          : 'bg-brand-600 hover:bg-brand-700 text-white'
                      }`}
                    >
                      {requestingMap[item.id] ? 'Requesting...' : 'Request Item'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {foodItems.length === 0 && (
          <div className="text-center py-20 bg-dark-800 rounded-xl border border-dark-700 border-dashed">
            <Package className="h-16 w-16 text-dark-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white">No food items found</h3>
            <p className="text-dark-400 mt-2">Try adjusting your filters or check back later.</p>
          </div>
        )}
      </main>

      <ConfirmationModal 
        isOpen={!!confirmingItem}
        onClose={() => setConfirmingItem(null)}
        onConfirm={handleConfirmRequest}
        title="Confirm Request"
        message={`Are you sure you want to request "${confirmingItem?.name}"? The donor will be notified of your request.`}
        confirmText="Request Item"
        isProcessing={confirmingItem && requestingMap[confirmingItem.id]}
      />

      <ConfirmationModal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Item"
        message={`Are you sure you want to delete "${deletingItem?.name}"? This action cannot be undone.`}
        confirmText="Delete Item"
        isProcessing={isDeleting}
        confirmButtonClass={isDeleting ? 'bg-red-600/50 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'}
      />
    </div>
  );
};

export default FoodItems;