import { useState, useEffect } from 'react';
import { recipientsAPI } from '../services/api';
import { Heart, Users, MapPin, Search } from 'lucide-react';

const Recipients = () => {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipients();
  }, []);

  const fetchRecipients = async () => {
    try {
      const response = await recipientsAPI.getAll();
      setRecipients(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching recipients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculates occupancy percentage.
  const calculateOccupancy = (capacity, availableCapacity) => {
    if (!capacity || capacity === 0) return 0;
    const occupied = capacity - availableCapacity;
    return ((occupied / capacity) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-dark-400">Loading recipients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-dark-800 shadow-sm border-b border-dark-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Heart className="h-40 w-40 text-accent-red transform rotate-6 translate-x-5" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                 <div className="h-1 w-10 bg-accent-red rounded-full"></div>
                 <span className="text-accent-red font-semibold tracking-wider text-sm uppercase">Community Reach</span>
              </div>
              <h2 className="text-4xl font-display font-bold text-white tracking-tight">Impact Points</h2>
              <p className="text-dark-400 mt-2 text-lg max-w-2xl font-light">
                Frontline organizations delivering nutrition where it matters most.
              </p>
            </div>
             <div className="w-full md:w-auto">
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="Find organizations..." 
                  className="bg-dark-900/50 border border-dark-600 text-dark-200 rounded-xl pl-12 pr-6 py-3 focus:outline-none focus:ring-2 focus:ring-accent-red focus:border-transparent w-full md:w-80 transition-all shadow-inner"
                />
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-dark-400 group-focus-within:text-accent-red transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipients.map((recipient) => {
            const occupancyPercentage = calculateOccupancy(
              recipient.capacity, 
              recipient.available_capacity
            );

            return (
              <div key={recipient.id} className="bg-dark-800 rounded-xl shadow-lg border border-dark-700 hover:shadow-xl hover:border-accent-red/50 transition-all duration-300 p-6 group flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-accent-red/10 p-3 rounded-lg border border-accent-red/20 group-hover:bg-accent-red/20 transition-colors">
                      <Heart className="h-6 w-6 text-accent-red" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-white group-hover:text-accent-red transition-colors">{recipient.organization_name}</h3>
                      <p className="text-sm text-dark-400">{recipient.recipient_type_display}</p>
                    </div>
                  </div>
                  {recipient.is_verified && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-green/10 text-accent-green border border-accent-green/20">
                      Verified
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-dark-300 bg-dark-900/50 p-2 rounded-lg">
                    <Users className="h-4 w-4 text-dark-500 mr-2" />
                    <span>Capacity: <span className="text-white font-medium">{recipient.capacity}</span> people</span>
                  </div>
                  <div className="flex items-center text-sm text-dark-400">
                    <MapPin className="h-4 w-4 text-dark-500 mr-2" />
                    <span className="truncate">{recipient.location || 'Location not specified'}</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-dark-700">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-dark-400">Occupancy</span>
                    <span className="font-semibold text-white">{occupancyPercentage}%</span>
                  </div>
                  <div className="w-full bg-dark-900 rounded-full h-2 overflow-hidden border border-dark-700">
                    <div
                      className="bg-gradient-to-r from-brand-500 to-brand-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${occupancyPercentage}%` }}
                    />
                  </div>
                   <div className="flex justify-between text-xs mt-2 text-dark-500">
                    <span>{recipient.capacity - recipient.available_capacity} occupied</span>
                    <span>{recipient.available_capacity} available</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
         {recipients.length === 0 && (
          <div className="text-center py-20 bg-dark-800 rounded-xl border border-dark-700 border-dashed">
            <Heart className="h-16 w-16 text-dark-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white">No recipients found</h3>
            <p className="text-dark-400 mt-2">Check back later for new recipient organizations.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Recipients;