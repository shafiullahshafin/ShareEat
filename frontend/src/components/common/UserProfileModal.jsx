import { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, Mail, Briefcase, Truck, Users, Activity, Edit2, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

const UserProfileModal = ({ isOpen, onClose, user }) => {
  const { updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        address: user.address || '',
        
        // Donor fields
        business_name: user.business_name || '',
        donor_type: user.donor_type || '',
        license_number: user.license_number || '',
        
        // Recipient fields
        organization_name: user.organization_name || '',
        recipient_type: user.recipient_type || '',
        capacity: user.capacity || '',
        current_occupancy: user.current_occupancy || '',
        description: user.description || '',
        
        // Initializes volunteer fields.
        vehicle_type: user.vehicle_type || '',
        vehicle_capacity: user.vehicle_capacity || '',
        is_available: user.is_available || false,
      });
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const cleanData = { ...formData };
      
      // Convert empty strings to null for numeric fields to avoid validation errors
      if (cleanData.vehicle_capacity === '') cleanData.vehicle_capacity = null;
      if (cleanData.capacity === '') cleanData.capacity = null;
      if (cleanData.current_occupancy === '') cleanData.current_occupancy = null;

      const response = await authAPI.updateProfile(cleanData);
      updateUser(response.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      let errorMessage = 'Failed to update profile. Please try again.';
      
      if (err.response?.data) {
        if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (typeof err.response.data === 'object') {
          // Get the first error message from the validation errors object
          const entries = Object.entries(err.response.data);
          if (entries.length > 0) {
            const [field, errors] = entries[0];
            const errorText = Array.isArray(errors) ? errors[0] : errors;
            errorMessage = `${field.replace(/_/g, ' ').charAt(0).toUpperCase() + field.replace(/_/g, ' ').slice(1)}: ${errorText}`;
          }
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const DONOR_TYPES = [
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'grocery', label: 'Grocery Store' },
    { value: 'bakery', label: 'Bakery' },
    { value: 'catering', label: 'Catering' },
    { value: 'other', label: 'Other' }
  ];

  const RECIPIENT_TYPES = [
    { value: 'ngo', label: 'NGO' },
    { value: 'shelter', label: 'Shelter' },
    { value: 'individual', label: 'Individual' },
    { value: 'community', label: 'Community Center' }
  ];

  const VEHICLE_TYPES = [
    { value: '', label: 'No Vehicle' },
    { value: 'bicycle', label: 'Bicycle' },
    { value: 'motorcycle', label: 'Motorcycle' },
    { value: 'car', label: 'Car' },
    { value: 'van', label: 'Van' },
    { value: 'truck', label: 'Truck' }
  ];

  const renderField = (label, name, icon, type = 'text', options = null) => {
    const value = formData[name];
    const displayValue = user[name];

    if (!isEditing) {
      if (type === 'checkbox') {
        return (
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-dark-800/50 border border-dark-700/50">
            <div className="mt-1 text-brand-500">{icon}</div>
            <div>
              <p className="text-xs font-medium text-dark-400 uppercase tracking-wider">{label}</p>
              <div className="flex items-center mt-1">
                <div className={`w-2 h-2 rounded-full mr-2 ${displayValue ? 'bg-green-500' : 'bg-red-500'}`} />
                <p className="text-sm text-dark-100 font-medium">{displayValue ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        );
      }
      if (!displayValue && displayValue !== 0) return null;
      return (
        <div className="flex items-start space-x-3 p-3 rounded-lg bg-dark-800/50 border border-dark-700/50">
          <div className="mt-1 text-brand-500">{icon}</div>
          <div>
            <p className="text-xs font-medium text-dark-400 uppercase tracking-wider">{label}</p>
            <p className="text-sm text-dark-100 font-medium mt-0.5">{displayValue}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-start space-x-3 p-3 rounded-lg bg-dark-800 border border-dark-600">
        <div className="mt-3 text-brand-500">{icon}</div>
        <div className="w-full">
          <label className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-1 block">{label}</label>
          {type === 'select' ? (
            <select
              name={name}
              value={value}
              onChange={handleChange}
              className="w-full bg-dark-900 border border-dark-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            >
              {options && options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : type === 'textarea' ? (
            <textarea
              name={name}
              value={value}
              onChange={handleChange}
              className="w-full bg-dark-900 border border-dark-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              rows="3"
            />
          ) : type === 'checkbox' ? (
             <label className="flex items-center space-x-2 mt-1 cursor-pointer">
                <input
                  type="checkbox"
                  name={name}
                  checked={value}
                  onChange={handleChange}
                  className="form-checkbox h-4 w-4 text-brand-600 rounded border-dark-600 bg-dark-900 focus:ring-brand-500"
                />
                <span className="text-sm text-dark-200">Available</span>
             </label>
          ) : (
            <input
              type={type}
              name={name}
              value={value}
              onChange={handleChange}
              className="w-full bg-dark-900 border border-dark-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          )}
        </div>
      </div>
    );
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'donor': return <Briefcase className="w-5 h-5" />;
      case 'recipient': return <Users className="w-5 h-5" />;
      case 'volunteer': return <Truck className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={() => !loading && onClose()}
      />
      
      <div className="relative w-full max-w-2xl bg-dark-900 rounded-2xl shadow-2xl ring-1 ring-dark-700 overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative px-6 py-6 bg-gradient-to-r from-brand-900/20 to-dark-800 border-b border-dark-700 flex-shrink-0">
          <button 
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 p-2 text-dark-400 hover:text-white bg-dark-800/50 hover:bg-dark-700 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-brand-500/20 ring-4 ring-dark-800">
                {user.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <input 
                        name="first_name" 
                        value={formData.first_name || ''} 
                        onChange={handleChange}
                        placeholder="First Name"
                        className="bg-dark-900 border border-dark-600 rounded px-2 py-1 text-lg w-32 focus:outline-none focus:border-brand-500 text-white"
                      />
                      <input 
                        name="last_name" 
                        value={formData.last_name || ''} 
                        onChange={handleChange}
                        placeholder="Last Name"
                        className="bg-dark-900 border border-dark-600 rounded px-2 py-1 text-lg w-32 focus:outline-none focus:border-brand-500 text-white"
                      />
                    </div>
                  ) : (
                    <>
                      {user.first_name} {user.last_name}
                    </>
                  )}
                  <span className="px-2 py-0.5 text-xs font-medium bg-dark-700 text-brand-400 rounded-full border border-dark-600 uppercase tracking-wide">
                    {user.role}
                  </span>
                </h2>
                <p className="text-dark-300 flex items-center gap-1.5 mt-1">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </p>
              </div>
            </div>
            
            {/* Edit button moved to footer */}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 overflow-y-auto custom-scrollbar flex-grow">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center text-red-400">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Common Info */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-brand-500" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderField('Username', 'username', <User className="w-4 h-4" />)}
                {renderField('Phone', 'phone', <Phone className="w-4 h-4" />)}
                {renderField('Address', 'address', <MapPin className="w-4 h-4" />)}
              </div>
            </div>

            {/* Role Specific Info */}
            {user.role !== 'admin' && (
              <div className="col-span-1 md:col-span-2 mt-2">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  {getRoleIcon(user.role)}
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  
                  {/* Donor Fields */}
                  {user.role === 'donor' && (
                    <>
                      {renderField('Business Name', 'business_name', <Briefcase className="w-4 h-4" />)}
                      {renderField('Donor Type', 'donor_type', <Activity className="w-4 h-4" />, 'select', DONOR_TYPES)}
                      {renderField('License Number', 'license_number', <Activity className="w-4 h-4" />)}
                    </>
                  )}

                  {/* Recipient Fields */}
                  {user.role === 'recipient' && (
                    <>
                      {renderField('Organization', 'organization_name', <Briefcase className="w-4 h-4" />)}
                      {renderField('Type', 'recipient_type', <Users className="w-4 h-4" />, 'select', RECIPIENT_TYPES)}
                      {renderField('Capacity', 'capacity', <Users className="w-4 h-4" />, 'number')}
                      {renderField('Current Occupancy', 'current_occupancy', <Users className="w-4 h-4" />, 'number')}
                      <div className="col-span-1 md:col-span-2">
                        {renderField('Description', 'description', <Activity className="w-4 h-4" />, 'textarea')}
                      </div>
                    </>
                  )}

                  {/* Volunteer Fields */}
                  {user.role === 'volunteer' && (
                    <>
                      {renderField('Vehicle Type', 'vehicle_type', <Truck className="w-4 h-4" />, 'select', VEHICLE_TYPES)}
                      {renderField('Vehicle Capacity (kg)', 'vehicle_capacity', <Activity className="w-4 h-4" />, 'number')}
                      {renderField('Availability', 'is_available', <Activity className="w-4 h-4" />, 'checkbox')}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-dark-800/50 border-t border-dark-700 flex justify-end gap-3 flex-shrink-0">
          {isEditing ? (
            <>
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setFormData({ ...user }); // Reset form
                }}
                disabled={loading}
                className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;