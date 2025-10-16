import { useState, useEffect, useRef } from "react";
import { Plus, X, Trash2, Upload, MapPin, User, Home, Camera } from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { propertyService } from "../../services";
import ErrorDialog from "../../components/ErrorDialog";

// SuccessDialog Component
const SuccessDialog = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/40 bg-opacity-50 z-[60]" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-6 mx-4">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                Success
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {message}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// MultiSelect Component
const MultiSelect = ({ options, selected, onChange, placeholder, onAddNew, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = options.filter((o) =>
    (o.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleOption = (option) => {
    const isSelected = selected.some((item) => item.id === option.id);
    onChange(
      isSelected
        ? selected.filter((item) => item.id !== option.id)
        : [...selected, option]
    );
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div
        className="border border-gray-300 rounded p-2 min-h-[40px] cursor-pointer bg-white"
        onClick={() => setIsOpen((s) => !s)}
      >
        {selected.length === 0 ? (
          <span className="text-gray-400 text-sm">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {selected.map((item) => (
              <span
                key={item.id}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs flex items-center gap-1"
              >
                {item.name}
                <X
                  size={12}
                  className="cursor-pointer hover:text-blue-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(selected.filter((s) => s.id !== item.id));
                  }}
                />
              </span>
            ))}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded mt-1 z-10 max-h-56 overflow-y-auto">
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Search..."
              className="w-full p-1 text-sm border border-gray-300 rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="max-h-40 overflow-y-auto">
            {filteredOptions.map((option) => {
              const checked = selected.some((s) => s.id === option.id);
              return (
                <div
                  key={option.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                  onClick={() => handleToggleOption(option)}
                >
                  <input type="checkbox" checked={checked} readOnly />
                  <span className="text-sm">{option.name}</span>
                </div>
              );
            })}
          </div>

          {onAddNew && (
            <div className="border-t p-2">
              <button
                type="button"
                onClick={() => {
                  onAddNew();
                  setIsOpen(false);
                }}
                className="w-full text-left text-sm text-blue-600 hover:text-blue-800"
              >
                + Add New {label}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Add Item Modal
const AddItemModal = ({ isOpen, onClose, onAdd, title, needsIcon = true }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [iconFile, setIconFile] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let submitData;
      
      if (needsIcon) {
        // Create FormData for file upload (amenities, facilities, safety)
        submitData = new FormData();
        submitData.append('name', formData.name);
        if (iconFile) {
          submitData.append('icon', iconFile);
        }
      } else {
        // Simple object for room types (no icon needed)
        submitData = { name: formData.name };
      }
      
      await onAdd(submitData);
      setFormData({});
      setIconFile(null);
      onClose();
    } catch (err) {
      console.error(`Error adding ${title}:`, err);
      toast.error(`Failed to add ${title}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate SVG file
      if (file.type !== 'image/svg+xml') {
        toast.error('Please select an SVG file for the icon');
        return;
      }
      setIconFile(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Add {title}</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {title} Name
            </label>
            <input
              type="text"
              value={formData.name || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={`e.g., ${title} Name`}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          {needsIcon && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon (SVG File)
              </label>
              <input
                type="file"
                accept=".svg,image/svg+xml"
                onChange={handleFileChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              {iconFile && (
                <p className="text-sm text-green-600 mt-1">
                  Selected: {iconFile.name}
                </p>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Room Type Modal with Amenities
const AddRoomTypeModal = ({ isOpen, onClose, onAdd, amenities, onAddAmenity }) => {
  const [formData, setFormData] = useState({ name: '', amenityIds: [] });
  const [loading, setLoading] = useState(false);
  const [showAddAmenity, setShowAddAmenity] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = {
        name: formData.name,
        amenityIds: formData.amenityIds.map(item => item.id)
      };
      
      await onAdd(submitData);
      setFormData({ name: '', amenityIds: [] });
      onClose();
    } catch (err) {
      console.error('Error adding room type:', err);
      toast.error('Failed to add room type.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAmenity = (amenity) => {
    const isSelected = formData.amenityIds.some(item => item.id === amenity.id);
    setFormData(prev => ({
      ...prev,
      amenityIds: isSelected
        ? prev.amenityIds.filter(item => item.id !== amenity.id)
        : [...prev.amenityIds, amenity]
    }));
  };

  const handleAddAmenityFromModal = async (data) => {
    try {
      await onAddAmenity(data);
      setShowAddAmenity(false);
    } catch (error) {
      console.error("Error adding amenity:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h3 className="text-lg font-semibold mb-4">Add Room Type</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Type Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Deluxe Suite"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Amenities
              </label>
              <button
                type="button"
                onClick={() => setShowAddAmenity(true)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Add New Amenity
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded p-2">
              {amenities.map((amenity) => {
                const isSelected = formData.amenityIds.some(item => item.id === amenity.id);
                return (
                  <div
                    key={amenity.id}
                    className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleToggleAmenity(amenity)}
                  >
                    <input type="checkbox" checked={isSelected} readOnly />
                    <span className="text-sm">{amenity.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Room Type"}
            </button>
          </div>
        </form>

        {/* Add Amenity Modal */}
        <AddItemModal
          isOpen={showAddAmenity}
          onClose={() => setShowAddAmenity(false)}
          onAdd={handleAddAmenityFromModal}
          title="Amenity"
          needsIcon={true}
        />
      </div>
    </div>
  );
};

const AddProperty = () => {
  const navigate = useNavigate();
  
  // Refs for auto-focus
  const titleRef = useRef(null);
  const ownerHostIdRef = useRef(null);
  const propertyTypeRef = useRef(null);
  const streetRef = useRef(null);
  const cityRef = useRef(null);
  const stateRef = useRef(null);
  const zipCodeRef = useRef(null);
  const mediaRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    rulesAndPolicies: "",
    status: "active",
    ownerHostId: "",
    propertyTypeId: "",
    location: {
      address: {
        street: "",
        city: "",
        state: "",
        country: "India",
        zipCode: ""
      },
      coordinates: {
        latitude: null,
        longitude: null
      }
    },
    amenityIds: [],
    facilityIds: [],
    safetyIds: [],
    roomTypes: []
  });


  

  // Media state
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaErrors, setMediaErrors] = useState([]);

  // Dropdown data
  const [amenities, setAmenities] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [safetyHygiene, setSafetyHygiene] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);

  // Modal states
  const [showAddAmenity, setShowAddAmenity] = useState(false);
  const [showAddFacility, setShowAddFacility] = useState(false);
  const [showAddSafety, setShowAddSafety] = useState(false);
  const [showAddPropertyType, setShowAddPropertyType] = useState(false);
  const [showAddRoomType, setShowAddRoomType] = useState(false);

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Dialog states
  const [errorDialog, setErrorDialog] = useState({ isOpen: false, message: '' });
  const [successDialog, setSuccessDialog] = useState({ isOpen: false, message: '' });

  // Fetch dropdown data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await propertyService.getCreationFormData();
        const data = response.data.data;
        setAmenities(data.amenities || []);
        setFacilities(data.facilities || []);
        setSafetyHygiene(data.safetyHygiene || []);
        setRoomTypes(data.roomTypes || []);
        setPropertyTypes(data.propertyTypes || []);
      } catch (error) {
        console.error("Error fetching form data:", error);
        toast.error("Failed to load form data");
      }
    };
    fetchData();
  }, []);

  // Clear error when user starts typing
  const clearError = (fieldName) => {
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Clear all errors
  const clearAllErrors = () => {
    setErrors({});
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error for this field
    clearError(name);
    
    if (name.startsWith('location.')) {
      const [_, parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [parent]: {
            ...prev.location[parent],
            [child]: value
          }
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle media upload
  const handleMediaChange = (e) => {
    // Clear media error when user selects files
    clearError('media');
    
    const files = Array.from(e.target.files || []);
    const errors = [];
    const validFiles = [];

    // Check number of files
    if (files.length > 12) {
      errors.push("Maximum 12 images allowed");
    }

    files.forEach((file, index) => {
      // Check file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`File ${file.name} is too large (max 5MB)`);
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        errors.push(`File ${file.name} must be an image`);
        return;
      }

      // Check aspect ratio (9:16)
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const targetRatio = 16/ 9;
        const tolerance = 0.1;
        
        if (Math.abs(aspectRatio - targetRatio) > tolerance) {
          errors.push(`File ${file.name} must have 16:9 aspect ratio`);
        }
      };
      img.src = URL.createObjectURL(file);

      validFiles.push(file);
    });

    setMediaErrors(errors);
    setMediaFiles(validFiles);
  };

  // Add room type
  const addRoomType = () => {
    setFormData(prev => ({
      ...prev,
      roomTypes: [...prev.roomTypes, {
        roomTypeId: "",
        minOccupancy: 1,
        Occupancy: 2,
        extraBedCapacity: 0
      }]
    }));
  };

  // Remove room type
  const removeRoomType = (index) => {
    setFormData(prev => ({
      ...prev,
      roomTypes: prev.roomTypes.filter((_, i) => i !== index)
    }));
  };

  // Update room type
  const updateRoomType = (index, field, value) => {
    // Clear room type errors when user makes changes
    clearError(`roomType_${index}`);
    clearError(`minOccupancy_${index}`);
    clearError(`occupancy_${index}`);
    clearError(`extraBed_${index}`);
    
    setFormData(prev => {
      const updatedRoomTypes = prev.roomTypes.map((rt, i) => 
        i === index ? { ...rt, [field]: value } : rt
      );
      
      // Real-time validation: if user fixes the min/max relationship, clear the error
      const updatedRoomType = updatedRoomTypes[index];
      if (updatedRoomType.minOccupancy && updatedRoomType.Occupancy && 
          updatedRoomType.minOccupancy <= updatedRoomType.Occupancy) {
        clearError(`minOccupancy_${index}`);
      }
      
      return {
        ...prev,
        roomTypes: updatedRoomTypes
      };
    });
  };

  // Add new items with API calls
  const handleAddAmenity = async (data) => {
    // Clear all errors when adding new item
    clearAllErrors();
    
    try {
      await propertyService.createAmenity(data);
      setSuccessDialog({ isOpen: true, message: "Amenity added successfully" });
      
      // Refresh amenities list
      const response = await propertyService.getCreationFormData();
      const formData = response.data.data;
      setAmenities(formData.amenities || []);
    } catch (error) {
      console.error("Error adding amenity:", error);
      setErrorDialog({ isOpen: true, message: "Failed to add amenity. Please try again." });
    }
  };

  const handleAddFacility = async (data) => {
    clearAllErrors();
    
    try {
      await propertyService.createFacility(data);
      setSuccessDialog({ isOpen: true, message: "Facility added successfully" });
      
      // Refresh facilities list
      const response = await propertyService.getCreationFormData();
      const formData = response.data.data;
      setFacilities(formData.facilities || []);
    } catch (error) {
      console.error("Error adding facility:", error);
      setErrorDialog({ isOpen: true, message: "Failed to add facility. Please try again." });
    }
  };

  const handleAddSafety = async (data) => {
    clearAllErrors();
    
    try {
      await propertyService.createSafety(data);
      setSuccessDialog({ isOpen: true, message: "Safety feature added successfully" });
      
      // Refresh safety list
      const response = await propertyService.getCreationFormData();
      const formData = response.data.data;
      setSafetyHygiene(formData.safetyHygiene || []);
    } catch (error) {
      console.error("Error adding safety feature:", error);
      setErrorDialog({ isOpen: true, message: "Failed to add safety feature. Please try again." });
    }
  };

  const handleAddPropertyType = async (data) => {
    clearAllErrors();
    
    try {
      await propertyService.createPropertyType(data);
      setSuccessDialog({ isOpen: true, message: "Property type added successfully" });
      
      // Refresh property types list
      const response = await propertyService.getCreationFormData();
      const formData = response.data.data;
      setPropertyTypes(formData.propertyTypes || []);
    } catch (error) {
      console.error("Error adding property type:", error);
      setErrorDialog({ isOpen: true, message: "Failed to add property type. Please try again." });
    }
  };

  const handleAddRoomType = async (data) => {
    clearAllErrors();
    
    try {
      await propertyService.createRoomType(data);
      setSuccessDialog({ isOpen: true, message: "Room type added successfully" });
      
      // Refresh room types list
      const response = await propertyService.getCreationFormData();
      const formData = response.data.data;
      setRoomTypes(formData.roomTypes || []);
    } catch (error) {
      console.error("Error adding room type:", error);
      setErrorDialog({ isOpen: true, message: "Failed to add room type. Please try again." });
    }
  };


  // Auto-focus to first error field
  const focusFirstError = (errorKeys) => {
    const focusOrder = [
      'title', 'ownerHostId', 'propertyTypeId', 'street', 'city', 'state', 'zipCode', 'media', 'roomTypes'
    ];
    
    for (const field of focusOrder) {
      if (errorKeys.includes(field)) {
        const refMap = {
          'title': titleRef,
          'ownerHostId': ownerHostIdRef,
          'propertyTypeId': propertyTypeRef,
          'street': streetRef,
          'city': cityRef,
          'state': stateRef,
          'zipCode': zipCodeRef,
          'media': mediaRef
        };
        
        if (refMap[field]?.current) {
          refMap[field].current.focus();
          break;
        }
      }
    }
  };

  // Client-side validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.ownerHostId.trim()) newErrors.ownerHostId = "Owner Host ID is required";
    if (!formData.propertyTypeId) newErrors.propertyTypeId = "Property type is required";
    if (!formData.location.address.street.trim()) newErrors.street = "Street is required";
    if (!formData.location.address.city.trim()) newErrors.city = "City is required";
    if (!formData.location.address.state.trim()) newErrors.state = "State is required";
    if (!formData.location.address.zipCode.trim()) newErrors.zipCode = "ZIP code is required";
    if (mediaFiles.length === 0) newErrors.media = "At least one image is required";
    if (formData.roomTypes.length === 0) newErrors.roomTypes = "At least one room type is required";

    // Validate room types
    formData.roomTypes.forEach((rt, index) => {
      if (!rt.roomTypeId) newErrors[`roomType_${index}`] = "Room type is required";
      
      // Validate minOccupancy
      if (rt.minOccupancy < 1 || rt.minOccupancy > 10) {
        newErrors[`minOccupancy_${index}`] = "Min occupancy must be between 1 and 10";
      }
      
      // Validate maxOccupancy (Occupancy)
      if (rt.Occupancy < 1 || rt.Occupancy > 10) {
        newErrors[`occupancy_${index}`] = "Max occupancy must be between 1 and 10";
      }
      
      // Validate that minOccupancy <= maxOccupancy
      if (rt.minOccupancy && rt.Occupancy && rt.minOccupancy > rt.Occupancy) {
        newErrors[`minOccupancy_${index}`] = "Min occupancy cannot be greater than max occupancy";
      }
      
      if (rt.extraBedCapacity < 0 || rt.extraBedCapacity > 5) {
        newErrors[`extraBed_${index}`] = "Extra bed capacity must be between 0 and 5";
      }
    });

    setErrors(newErrors);
    
    // Auto-focus to first error
    if (Object.keys(newErrors).length > 0) {
      setTimeout(() => focusFirstError(Object.keys(newErrors)), 100);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  // Backend validation
  const validateWithBackend = async () => {
    try {
      const validationData = {
        title: formData.title,
        propertyTypeId: formData.propertyTypeId,
        ownerHostId: formData.ownerHostId,
        amenityIds: formData.amenityIds.map(item => item.id),
        facilityIds: formData.facilityIds.map(item => item.id),
        safetyIds: formData.safetyIds.map(item => item.id),
        roomtypes: formData.roomTypes
      };

      const response = await propertyService.validatePropertyData(validationData);
      
      if (!response.data.success) {
        // Show backend validation errors
        const backendErrors = response.data.errors || [];
        console.log('Backend validation errors:', backendErrors);
        setErrorDialog({ isOpen: true, message: `Validation failed: ${backendErrors.join(', ')}` });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Backend validation error:', error);
      console.log('Error details:', error.response?.data);
      
      // Check for specific unique constraint error
      if (error.response?.data?.message?.includes('Property_ownerHostId_isDeleted_key')) {
        setErrorDialog({ isOpen: true, message: 'This host already has a property. Each host can only have one property.' });
        return false;
      }
      
      setErrorDialog({ isOpen: true, message: 'Validation failed. Please check your data.' });
      return false;
    }
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // First, do client-side validation
    if (!validateForm()) {
      setErrorDialog({ isOpen: true, message: "Please fix the errors before submitting" });
      return;
    }

    setIsSubmitting(true);
    try {
      // Backend validation
      const isValid = await validateWithBackend();
      if (!isValid) {
        setIsSubmitting(false);
        return;
      }

      const submitData = {
        ...formData,
        rulesAndPolicies: formData.rulesAndPolicies.split(',').map(rule => rule.trim()).filter(Boolean)
      };

      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add basic fields
      Object.keys(submitData).forEach(key => {
        if (key !== 'mediaFiles' && key !== 'amenityIds' && key !== 'facilityIds' && key !== 'safetyIds' && key !== 'roomTypes') {
          if (typeof submitData[key] === 'object') {
            formDataToSend.append(key, JSON.stringify(submitData[key]));
          } else {
            formDataToSend.append(key, submitData[key]);
          }
        }
      });

      // Add arrays - extract IDs from objects
      submitData.amenityIds.forEach(item => formDataToSend.append('amenityIds', item.id));
      submitData.facilityIds.forEach(item => formDataToSend.append('facilityIds', item.id));
      submitData.safetyIds.forEach(item => formDataToSend.append('safetyIds', item.id));
      
      // Add room types as array
      formDataToSend.append('roomtypes', JSON.stringify(submitData.roomTypes));

      // Add media files
      mediaFiles.forEach(file => {
        formDataToSend.append('media', file);
      });

      await propertyService.createProperty(formDataToSend);
      setSuccessDialog({ isOpen: true, message: "Property created successfully" });
      
      // Navigate to properties page after successful creation
      setTimeout(() => {
        navigate('/admin/base/properties');
      }, 2000);
      
    } catch (error) {
      console.error("Error creating property:", error);
      
      // Check for specific unique constraint error
      if (error.response?.data?.message?.includes('Property_ownerHostId_isDeleted_key')) {
        setErrorDialog({ isOpen: true, message: 'This host already has a property. Each host can only have one property.' });
      } else {
        setErrorDialog({ isOpen: true, message: "Failed to create property" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New Property</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <Home className="h-5 w-5 mr-2" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Title *
                </label>
                <input
                  ref={titleRef}
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type *
                </label>
                <div className="flex gap-2">
                  <select
                    ref={propertyTypeRef}
                    name="propertyTypeId"
                    value={formData.propertyTypeId}
                    onChange={handleInputChange}
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Property Type</option>
                    {propertyTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddPropertyType(true)}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                    title="Add New Property Type"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {errors.propertyTypeId && <p className="text-red-500 text-xs mt-1">{errors.propertyTypeId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner Host ID (Email) *
                </label>
                <input
                  ref={ownerHostIdRef}
                  type="email"
                  name="ownerHostId"
                  value={formData.ownerHostId}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {errors.ownerHostId && <p className="text-red-500 text-xs mt-1">{errors.ownerHostId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rules and Policies (comma-separated)
              </label>
              <textarea
                name="rulesAndPolicies"
                value={formData.rulesAndPolicies}
                onChange={handleInputChange}
                rows={2}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="No smoking, No pets, Check-in after 2 PM..."
              />
            </div>
          </div>

          {/* Location */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Location Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street *
                </label>
                <input
                  ref={streetRef}
                  type="text"
                  name="location.address.street"
                  value={formData.location.address.street}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  ref={cityRef}
                  type="text"
                  name="location.address.city"
                  value={formData.location.address.city}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  ref={stateRef}
                  type="text"
                  name="location.address.state"
                  value={formData.location.address.state}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code *
                </label>
                <input
                  ref={zipCodeRef}
                  type="text"
                  name="location.address.zipCode"
                  value={formData.location.address.zipCode}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  name="location.address.country"
                  value={formData.location.address.country}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  readOnly
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="location.coordinates.latitude"
                  value={formData.location.coordinates.latitude || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="location.coordinates.longitude"
                  value={formData.location.coordinates.longitude || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Property Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MultiSelect
                options={amenities}
                selected={formData.amenityIds}
                onChange={(selected) => setFormData(prev => ({ ...prev, amenityIds: selected }))}
                placeholder="Select amenities"
                onAddNew={() => setShowAddAmenity(true)}
                label="Amenities"
              />

              <MultiSelect
                options={facilities}
                selected={formData.facilityIds}
                onChange={(selected) => setFormData(prev => ({ ...prev, facilityIds: selected }))}
                placeholder="Select facilities"
                onAddNew={() => setShowAddFacility(true)}
                label="Facilities"
              />

              <MultiSelect
                options={safetyHygiene}
                selected={formData.safetyIds}
                onChange={(selected) => setFormData(prev => ({ ...prev, safetyIds: selected }))}
                placeholder="Select safety features"
                onAddNew={() => setShowAddSafety(true)}
                label="Safety & Hygiene"
              />
            </div>
          </div>

          {/* Room Types */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Room Types</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoomType(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Create Room Type
                </button>
                <button
                  type="button"
                  onClick={addRoomType}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Room Type
                </button>
              </div>
            </div>

            {formData.roomTypes.length === 0 ? (
              <p className="text-gray-500 text-sm">No room types added yet. Click "Add Room Type" to get started.</p>
            ) : (
              <div className="space-y-4">
                {formData.roomTypes.map((roomType, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-800">Room Type {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeRoomType(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Room Type *
                        </label>
                        <select
                          value={roomType.roomTypeId}
                          onChange={(e) => updateRoomType(index, 'roomTypeId', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Select Room Type</option>
                          {roomTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                        {errors[`roomType_${index}`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`roomType_${index}`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Min Occupancy (1-10) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={roomType.minOccupancy}
                          onChange={(e) => updateRoomType(index, 'minOccupancy', parseInt(e.target.value))}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                        {errors[`minOccupancy_${index}`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`minOccupancy_${index}`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Occupancy (1-10) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={roomType.Occupancy}
                          onChange={(e) => updateRoomType(index, 'Occupancy', parseInt(e.target.value))}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                        {errors[`occupancy_${index}`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`occupancy_${index}`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Extra Bed Capacity (0-5)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="5"
                          value={roomType.extraBedCapacity}
                          onChange={(e) => updateRoomType(index, 'extraBedCapacity', parseInt(e.target.value))}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors[`extraBed_${index}`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`extraBed_${index}`]}</p>
                        )}
                      </div>
                      
                    </div>
                  </div>
                ))}
              </div>
            )}
            {errors.roomTypes && <p className="text-red-500 text-xs mt-1">{errors.roomTypes}</p>}
          </div>

          {/* Media Upload */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              Property Images (16:9 aspect ratio, max 5MB each, up to 12 images)
            </h2>
            
            <div className="mb-4">
              <input
                ref={mediaRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleMediaChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>

            {mediaErrors.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <ul className="text-red-600 text-sm">
                  {mediaErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {mediaFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded border"
                    />
                    <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1">
                      <X className="h-3 w-3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {errors.media && <p className="text-red-500 text-xs mt-1">{errors.media}</p>}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={async () => {
                if (!validateForm()) {
                  setErrorDialog({ isOpen: true, message: "Please fix the errors before validating" });
                  return;
                }
                const isValid = await validateWithBackend();
                if (isValid) {
                  setSuccessDialog({ isOpen: true, message: "Validation passed! You can now submit the form." });
                }
              }}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              Validate Data
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Property...
                </>
              ) : (
                "Create Property"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modals */}
      <AddItemModal
        isOpen={showAddAmenity}
        onClose={() => setShowAddAmenity(false)}
        onAdd={handleAddAmenity}
        title="Amenity"
        needsIcon={true}
      />

      <AddItemModal
        isOpen={showAddFacility}
        onClose={() => setShowAddFacility(false)}
        onAdd={handleAddFacility}
        title="Facility"
        needsIcon={true}
      />

      <AddItemModal
        isOpen={showAddSafety}
        onClose={() => setShowAddSafety(false)}
        onAdd={handleAddSafety}
        title="Safety Feature"
        needsIcon={true}
      />

      <AddItemModal
        isOpen={showAddPropertyType}
        onClose={() => setShowAddPropertyType(false)}
        onAdd={handleAddPropertyType}
        title="Property Type"
        needsIcon={false}
      />

      <AddRoomTypeModal
        isOpen={showAddRoomType}
        onClose={() => setShowAddRoomType(false)}
        onAdd={handleAddRoomType}
        amenities={amenities}
        onAddAmenity={handleAddAmenity}
      />

      {/* Error Dialog */}
      <ErrorDialog
        isOpen={errorDialog.isOpen}
        message={errorDialog.message}
        onClose={() => setErrorDialog({ isOpen: false, message: '' })}
      />

      {/* Success Dialog */}
      <SuccessDialog
        isOpen={successDialog.isOpen}
        message={successDialog.message}
        onClose={() => setSuccessDialog({ isOpen: false, message: '' })}
      />
    </div>
  );
};

export default AddProperty;