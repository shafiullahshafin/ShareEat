import { X } from 'lucide-react';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  isProcessing = false,
  confirmButtonClass = ''
}) => {
  if (!isOpen) return null;

  const defaultButtonClass = isProcessing 
    ? 'bg-brand-600/50 cursor-not-allowed' 
    : 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/20';
  
  const buttonClass = confirmButtonClass 
    ? (isProcessing ? 'bg-gray-600 cursor-not-allowed' : confirmButtonClass)
    : defaultButtonClass;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-dark-800 rounded-2xl border border-dark-700 shadow-2xl w-full max-w-md transform transition-all scale-100">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-gray-400 mb-6 leading-relaxed">
            {message}
          </p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-dark-700 transition-colors border border-transparent hover:border-dark-600"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className={`px-5 py-2 rounded-lg font-bold text-white shadow-lg transition-all ${buttonClass}`}
            >
              {isProcessing ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
