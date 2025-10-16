import React, { useState, useEffect } from 'react';
import { X, Home, Calendar, MapPin, Camera, Trash2, Image as ImageIcon } from 'lucide-react';
import {propertyService} from '../services';
const AddRoomModal = ({ isOpen, onClose, roomTypesMap, propertyId, onSave }) => {
  const [formData, setFormData] = useState({
    propertyRoomTypeId: '',
    name: '',
    code: '',
    spaceSqft: '',
    fromDate: '',
    toDate: '',
    images: []
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [imagePreviews, setImagePreviews] = useState([]);
  const [propertyRoomTypes, setPropertyRoomTypes] = useState([]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        propertyRoomTypeId: '',
        name: '',
        code: '',
        spaceSqft: '',
        fromDate: '',
        toDate: '',
        images: []
      });
      setErrors({});
      setImagePreviews([]);
    } else {
      // Clean up preview URLs when modal closes
      imagePreviews.forEach(preview => {
        if (preview.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
      setImagePreviews([]);
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(preview => {
        if (preview.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, []);

  // Fetch property room types when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPropertyRoomTypes();
    }
  }, [isOpen]);

  const fetchPropertyRoomTypes = async () => {
    try{
      const response = await propertyService.getPropertyRoomTypes(propertyId);
      if(response.data.success){
        console.log('Property room types data:', response.data.data);
        setPropertyRoomTypes(response.data.data);
      }
    }catch(error){
      console.error('Error fetching property room types:', error);
    }
  }

  // Set default date range (next 365 days)
  useEffect(() => {
    if (isOpen && !formData.fromDate && !formData.toDate) {
      const today = new Date();
      const nextYear = new Date(today.getTime() + (365 * 24 * 60 * 60 * 1000));
      
      setFormData(prev => ({
        ...prev,
        fromDate: today.toISOString().split('T')[0],
        toDate: nextYear.toISOString().split('T')[0]
      }));
    }
  }, [isOpen, formData.fromDate, formData.toDate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };


  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;
    
    // Validate files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        console.warn(`Skipping non-image file: ${file.name}`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        console.warn(`Skipping large file: ${file.name} (${file.size} bytes)`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length === 0) {
      console.error('No valid image files selected');
      return;
    }
    
    // Create preview URLs and store file names
    const newImageNames = validFiles.map(file => file.name);
    const newPreviews = validFiles.map(file => {
      const url = URL.createObjectURL(file);
      console.log('Created preview URL for:', file.name, 'URL:', url);
      return {
        name: file.name,
        url: url,
        file: file
      };
    });
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImageNames]
    }));
    
    setImagePreviews(prev => [...prev, ...newPreviews]);
    
    // Clear the input so the same file can be selected again
    event.target.value = '';
  };

  const handleRemoveImage = (imageToRemove) => {
    // Clean up preview URL
    const previewToRemove = imagePreviews.find(p => p.name === imageToRemove);
    if (previewToRemove) {
      URL.revokeObjectURL(previewToRemove.url);
    }
    
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(image => image !== imageToRemove)
    }));
    
    setImagePreviews(prev => prev.filter(p => p.name !== imageToRemove));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.propertyRoomTypeId) {
      newErrors.propertyRoomTypeId = 'Please select a room type';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Room name is required';
    }
    if (!formData.code.trim()) {
      newErrors.code = 'Room code is required';
    }
    if (!formData.fromDate) {
      newErrors.fromDate = 'From date is required';
    }
    if (!formData.toDate) {
      newErrors.toDate = 'To date is required';
    }
    if (formData.fromDate && formData.toDate && new Date(formData.fromDate) > new Date(formData.toDate)) {
      newErrors.toDate = 'To date must be after from date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Prepare data for API call
      const roomData = {
        ...formData,
        spaceSqft: formData.spaceSqft ? parseInt(formData.spaceSqft) : null,
        propertyId: propertyId,
        amenities: [] // Send empty array since we removed amenities functionality
      };

      console.log('Form data:', formData);
      console.log('Room data to save:', roomData);
      
      // Call onSave callback (you'll implement the actual API call in parent component)
      await onSave(roomData);
      
      // Close modal on success
      onClose();
    } catch (error) {
      console.error('Error saving room:', error);
    } finally {
      setLoading(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-500 px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Home className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Add New Room</h2>
                <p className="text-xs text-gray-500">Create a new room and set availability dates</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Room Type Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                <Home className="inline h-3 w-3 mr-1" />
                Room Type *
              </label>
              <select
                value={formData.propertyRoomTypeId}
                onChange={(e) => handleInputChange('propertyRoomTypeId', e.target.value)}
                className={`block w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.propertyRoomTypeId ? 'border-red-500' : 'border-gray-500'
                }`}
              >
                <option value="">Select room type</option>
                {propertyRoomTypes.map((roomType) => (
                  <option key={roomType.propertyRoomTypeId} value={roomType.propertyRoomTypeId}>
                    {roomType.name} 
                  </option>
                ))}
              </select>
              {errors.propertyRoomTypeId && (
                <p className="mt-1 text-xs text-red-600">{errors.propertyRoomTypeId}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                <MapPin className="inline h-3 w-3 mr-1" />
                Room Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Deluxe Suite 101"
                className={`block w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-500'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>
          </div>

          {/* Room Code and Space */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Room Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="e.g., DS101, ST201"
                className={`block w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.code ? 'border-red-500' : 'border-gray-500'
                }`}
              />
              {errors.code && (
                <p className="mt-1 text-xs text-red-600">{errors.code}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Space (sq ft)
              </label>
              <input
                type="number"
                value={formData.spaceSqft}
                onChange={(e) => handleInputChange('spaceSqft', e.target.value)}
                placeholder="e.g., 500"
                min="0"
                className="block w-full px-3 py-2 text-xs border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                <Calendar className="inline h-3 w-3 mr-1" />
                Available From *
              </label>
              <input
                type="date"
                value={formData.fromDate}
                onChange={(e) => handleInputChange('fromDate', e.target.value)}
                className={`block w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.fromDate ? 'border-red-500' : 'border-gray-500'
                }`}
              />
              {errors.fromDate && (
                <p className="mt-1 text-xs text-red-600">{errors.fromDate}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                <Calendar className="inline h-3 w-3 mr-1" />
                Available Until *
              </label>
              <input
                type="date"
                value={formData.toDate}
                onChange={(e) => handleInputChange('toDate', e.target.value)}
                min={formData.fromDate}
                className={`block w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.toDate ? 'border-red-500' : 'border-gray-500'
                }`}
              />
              {errors.toDate && (
                <p className="mt-1 text-xs text-red-600">{errors.toDate}</p>
              )}
            </div>
          </div>


          {/* Images Section */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              <Camera className="inline h-3 w-3 mr-1" />
              Room Images
            </label>
            <div className="border-2 border-dashed border-gray-500 rounded-lg p-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center justify-center text-center"
              >
                <Camera className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-xs text-gray-500 mb-1">Click to upload images</p>
                <p className="text-xs text-gray-400">PNG, JPG up to 10MB each</p>
              </label>
            </div>

             {/* Image Previews */}
             {imagePreviews.length > 0 && (
               <div className="mt-3">
                 <p className="text-xs text-gray-500 mb-2">Image previews:</p>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                   {imagePreviews.map((preview, index) => (
                     <div key={index} className="relative group">
                       <div className="w-full h-20 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center">
                         <img
                           src={preview.url}
                           alt={preview.name}
                           className="w-full h-full object-cover"
                           onLoad={() => console.log('Image loaded successfully:', preview.name)}
                           onError={(e) => {
                             console.error('Image failed to load:', preview.name, preview.url);
                             e.target.style.display = 'none';
                             e.target.parentElement.innerHTML = `
                               <div class="flex flex-col items-center justify-center text-gray-400">
                                 <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                 </svg>
                                 <span class="text-xs">Failed to load</span>
                               </div>
                             `;
                           }}
                         />
                       </div>
                       <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all duration-200 flex items-center justify-center">
                         <button
                           type="button"
                           onClick={() => handleRemoveImage(preview.name)}
                           className="opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-all duration-200"
                         >
                           <X className="h-3 w-3" />
                         </button>
                       </div>
                       <p className="text-xs text-gray-500 mt-1 truncate" title={preview.name}>
                         {preview.name}
                       </p>
                     </div>
                   ))}
                 </div>
               </div>
             )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-500">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-500 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
          </div>
         </form>
       </div>
     </div>
   );
 };

 export default AddRoomModal;
