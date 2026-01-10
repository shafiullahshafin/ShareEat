import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { foodItemsAPI, foodCategoriesAPI } from '../services/api';
import { AlertCircle, ArrowLeft, Save } from 'lucide-react';

const CreateFoodItem = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    quantity: '',
    unit: 'kg',
    condition: 'good',
    expiry_date: '',
    pickup_before: '',
  });

  const units = ['kg', 'lbs', 'items', 'boxes', 'cans', 'meals', 'liters'];
  const conditions = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' },
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await foodCategoriesAPI.getAll();
      setCategories(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load food categories');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await foodItemsAPI.create(formData);
      navigate('/food-items');
    } catch (err) {
      console.error('Error creating food item:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to create food item');
      // If validation errors, display them?
      if (err.response?.data) {
         // simplified error handling for now
         const errors = Object.values(err.response.data).flat().join(', ');
         if (errors) setError(errors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate('/food-items')}
          className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Food Items
        </button>

        <div className="bg-dark-800 rounded-xl shadow-xl border border-dark-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-dark-700">
            <h1 className="text-2xl font-bold text-white">Donate Food Item</h1>
            <p className="text-gray-400 text-sm mt-1">Fill in the details to list your food donation</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-6 bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-gray-500"
                    placeholder="e.g., Fresh Apples"
                  />
                </div>

                <div className="col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-gray-500"
                    placeholder="Provide details about the food item..."
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="condition" className="block text-sm font-medium text-gray-300 mb-1">
                    Condition *
                  </label>
                  <select
                    id="condition"
                    name="condition"
                    required
                    value={formData.condition}
                    onChange={handleChange}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {conditions.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    required
                    min="0.01"
                    step="0.01"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label htmlFor="unit" className="block text-sm font-medium text-gray-300 mb-1">
                    Unit *
                  </label>
                  <select
                    id="unit"
                    name="unit"
                    required
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {units.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-300 mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="datetime-local"
                    id="expiry_date"
                    name="expiry_date"
                    required
                    value={formData.expiry_date}
                    onChange={handleChange}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label htmlFor="pickup_before" className="block text-sm font-medium text-gray-300 mb-1">
                    Pickup Before *
                  </label>
                  <input
                    type="datetime-local"
                    id="pickup_before"
                    name="pickup_before"
                    required
                    value={formData.pickup_before}
                    onChange={handleChange}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be before expiry date</p>
                </div>
              </div>

              <div className="pt-4 border-t border-dark-700 flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/food-items')}
                  className="mr-4 px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg font-medium flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Donation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateFoodItem;
