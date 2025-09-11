import { Eye, Edit, Trash2, Plus, X, ArrowUp, ArrowDown } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {toast} from "react-toastify";
import services from "../../services";

/* ---------- utils ---------- */
const nfINR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const formatINR = (v) => nfINR.format(Number(v || 0));
const formatDate = (d) => {
  const dt = d ? new Date(d) : null;
  return dt && !isNaN(dt) ? dt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" }) : "—";
};

/* ---------- MultiSelect ---------- */
const MultiSelect = ({ options, selected, onChange, placeholder, onAddNew }) => {
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
                + Add New Item
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ---------- AddItemModal ---------- */
const AddItemModal = ({ isOpen, onClose, onAdd, title, placeholder }) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onAdd(name.trim());
      setName("");
      onClose();
    } catch (err) {
      console.error(`Error adding ${title}:`, err);
      alert(`Failed to add ${title}.`);
    } finally {
      setLoading(false);
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={placeholder}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
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
              disabled={loading || !name.trim()}
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

/* ---------- Page ---------- */
const Properties = () => {
  // --- Edit Modal State ---
  const [editModal, setEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState(null); // property data for edit
  const [editMediaFiles, setEditMediaFiles] = useState([]); // newly added files
  const [editCoverIndex, setEditCoverIndex] = useState(0);
  const [editSelectedAmenities, setEditSelectedAmenities] = useState([]);
  const [editSelectedFacilities, setEditSelectedFacilities] = useState([]);
  const [editSelectedSafeties, setEditSelectedSafeties] = useState([]);
  const [editSelectedRoomTypes, setEditSelectedRoomTypes] = useState([]);
  const [editIsSubmitting, setEditIsSubmitting] = useState(false);
  const [editSubmitError, setEditSubmitError] = useState("");

  // Helper to open edit modal with property data
  const openEditModal = (property) => {
    // Process rooms to handle existing images properly
    const processedRooms = (property.rooms || []).map(room => ({
      ...room,
      images: (room.images || []).map(img => ({
        ...img,
        url: img.url || services.mediaService.getMedia(img.url)
      })),
      amenities: room.amenities || []
    }));

    setEditFormData({ 
      ...property, 
      rooms: processedRooms
    });
    setEditMediaFiles([]); // no new files by default
    setEditCoverIndex(
      property.media?.findIndex((m) => m.isFeatured) !== -1
        ? property.media.findIndex((m) => m.isFeatured)
        : 0
    );
    setEditSelectedAmenities((property.amenities ?? []).map(a => a.amenity || a));
    setEditSelectedFacilities((property.facilities ?? []).map(f => f.facility || f));
    setEditSelectedSafeties((property.safeties ?? []).map(s => s.safety || s));
    setEditSelectedRoomTypes(property.roomTypes ?? []);
    setEditModal(true);
  };

  // Edit Modal input handlers (similar to add modal, but for editFormData)
  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('location.')) {
      const [_, parent, child] = name.split('.');
      setEditFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [parent]: {
            ...(prev.location?.[parent] || {}),
            [child]: type === 'checkbox' ? checked : value
          }
        }
      }));
      return;
    }
    setEditFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Edit Modal media handlers
  const handleEditMediaChange = (e) => {
    const files = Array.from(e.target.files || []);
    setEditMediaFiles(files);
    setEditCoverIndex(0);
  };

  // Remove existing image from editFormData.media
  const removeEditExistingImage = (index) => {
    setEditFormData(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
    }));
    if (editCoverIndex === index) setEditCoverIndex(0);
  };

  // Remove newly added image
  const removeEditNewImage = (index) => {
    setEditMediaFiles(prev => prev.filter((_, i) => i !== index));
    if (editCoverIndex === index) setEditCoverIndex(0);
  };

  // --- Edit Modal Room Management ---
  const addEditRoom = () => {
    const newRoom = {
      roomTypeId: '',
      name: '',
      code: '',
      spaceSqft: '',
      maxOccupancy: 1,
      price: '',
      status: 'active',
      images: [],
      amenities: []
    };
    setEditFormData(prev => ({
      ...prev,
      rooms: [...(prev.rooms || []), newRoom]
    }));
  };

  const removeEditRoom = (index) => {
    setEditFormData(prev => ({
      ...prev,
      rooms: prev.rooms.filter((_, i) => i !== index)
    }));
  };

  const updateEditRoomField = (roomIndex, field, value) => {
    setEditFormData(prev => ({
      ...prev,
      rooms: prev.rooms.map((room, index) => 
        index === roomIndex ? { ...room, [field]: value } : room
      )
    }));
  };

  const handleEditRoomImages = (e, roomIndex) => {
    const files = Array.from(e.target.files || []);
    const imageObjects = files.map(file => ({ file, url: URL.createObjectURL(file) }));
    
    setEditFormData(prev => ({
      ...prev,
      rooms: prev.rooms.map((room, index) => 
        index === roomIndex 
          ? { ...room, images: [...(room.images || []), ...imageObjects] }
          : room
      )
    }));
  };

  const removeEditRoomImage = (roomIndex, imageIndex) => {
    setEditFormData(prev => ({
      ...prev,
      rooms: prev.rooms.map((room, index) => 
        index === roomIndex 
          ? { ...room, images: room.images.filter((_, i) => i !== imageIndex) }
          : room
      )
    }));
  };

  const moveEditRoomUp = (index) => {
    if (index === 0) return;
    setEditFormData(prev => {
      const newRooms = [...prev.rooms];
      [newRooms[index - 1], newRooms[index]] = [newRooms[index], newRooms[index - 1]];
      return { ...prev, rooms: newRooms };
    });
  };

  const moveEditRoomDown = (index) => {
    setEditFormData(prev => {
      if (index === prev.rooms.length - 1) return prev;
      const newRooms = [...prev.rooms];
      [newRooms[index], newRooms[index + 1]] = [newRooms[index + 1], newRooms[index]];
      return { ...prev, rooms: newRooms };
    });
  };

  // --- Edit Modal submit handler ---
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSubmitError("");
    setEditIsSubmitting(true);
    try {
      const fd = new FormData();
      // Basic fields
      fd.append("title", editFormData.title);
      fd.append("description", editFormData.description || "");
      fd.append("rulesAndPolicies", editFormData.rulesAndPolicies || "");
      fd.append("status", editFormData.status || "active");
      fd.append("propertyTypeId", editFormData.propertyTypeId);
      fd.append("ownerHostId", editFormData.ownerHostId);
      // Features
      editSelectedAmenities.forEach((a) => fd.append("amenityIds", a.id));
      editSelectedFacilities.forEach((f) => fd.append("facilityIds", f.id));
      editSelectedSafeties.forEach((s) => fd.append("safetyIds", s.id));
      // Room types
      editSelectedRoomTypes.forEach((rt, i) => fd.append(`roomTypeIds[${i}]`, rt.id));
      // Location
      fd.append("location", JSON.stringify(editFormData.location));
      // Media: existing
      (editFormData.media || []).forEach((m, idx) => {
        fd.append("existingMedia", m.url);
        if (idx === editCoverIndex && editMediaFiles.length === 0) {
          fd.append("coverImageIndex", idx);
        }
      });
      // Media: new
      editMediaFiles.forEach((file, idx) => {
        fd.append("media", file);
        if (editFormData.media?.length === 0 && idx === editCoverIndex) {
          fd.append("coverImageIndex", idx);
        }
      });
      // Rooms - handle room data and images
      (editFormData.rooms || []).forEach((room, roomIndex) => {
        // Room basic data
        fd.append(`rooms[${roomIndex}][id]`, room.id || '');
        fd.append(`rooms[${roomIndex}][roomTypeId]`, room.roomTypeId || '');
        fd.append(`rooms[${roomIndex}][name]`, room.name || '');
        fd.append(`rooms[${roomIndex}][code]`, room.code || '');
        fd.append(`rooms[${roomIndex}][spaceSqft]`, room.spaceSqft || '');
        fd.append(`rooms[${roomIndex}][maxOccupancy]`, room.maxOccupancy || '');
        fd.append(`rooms[${roomIndex}][price]`, room.price || '');
        fd.append(`rooms[${roomIndex}][status]`, room.status || 'active');
        
        // Room amenities
        (room.amenities || []).forEach((amenity, amenityIndex) => {
          fd.append(`rooms[${roomIndex}][amenityIds][${amenityIndex}]`, amenity.id);
        });
        
        // Room images - separate existing and new
        const existingImages = (room.images || []).filter(img => !img.file);
        const newImages = (room.images || []).filter(img => img.file);
        
        // Existing room images
        existingImages.forEach((img, imgIndex) => {
          fd.append(`rooms[${roomIndex}][existingImages][${imgIndex}]`, img.url);
        });
        
        // New room images
        newImages.forEach((img) => {
          fd.append(`rooms[${roomIndex}][newImages]`, img.file);
        });
      });
      await services.propertyService.updateProperty(editFormData.id, fd);
      toast.success("Property updated");
      setEditModal(false);
      setEditFormData(null);
      setEditMediaFiles([]);
      fetchProperties();
    } catch (err) {
      setEditSubmitError(err?.response?.data?.message || "Failed to update property");
    } finally {
      setEditIsSubmitting(false);
    }
  };

  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [propertyList, setPropertyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  // Form data matching Prisma schema
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    rulesAndPolicies: "",
    status: "active",
    location: {
      address: {
        line1: "",
        line2: "",
        area: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India"
      },
      coordinates: {
        lat: null,
        lng: null
      }
    },
    propertyTypeId: "",
    ownerHostId: "",
    rooms: [
      {
        roomTypeId: "",
        name: "",
        code: "",
        spaceSqft: 0,
        maxOccupancy: 2,
        price: "",
        status: "active",
        amenities: []
      }
    ]
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Media selection
  const [mediaFiles, setMediaFiles] = useState([]); // File[]
  const [coverIndex, setCoverIndex] = useState(0);

  // Dropdown options
  const [amenities, setAmenities] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [safeties, setSafeties] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);

  // Selected items
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [selectedSafeties, setSelectedSafeties] = useState([]);
  const [selectedRoomTypes, setSelectedRoomTypes] = useState([]);

  // Add item modals
  const [showAddAmenity, setShowAddAmenity] = useState(false);
  const [showAddFacility, setShowAddFacility] = useState(false);
  const [showAddSafety, setShowAddSafety] = useState(false);
  const [showAddRoomType, setShowAddRoomType] = useState(false);
  const [showAddPropertyType, setShowAddPropertyType] = useState(false);

  /* ----- data ----- */
  const fetchProperties = async () => {
    setLoading(true);
    setErrMsg("");
    try {
      const res = await services.propertyService.getProperties();
      setPropertyList(res?.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch properties", err);
      setErrMsg("Could not load properties. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [a, f, s, rt, pt] = await Promise.all([
        services.propertyService.getAmenities(),
        services.propertyService.getFacilities(),
        services.propertyService.getSafeties(),
        services.propertyService.getRoomTypes(),
        services.propertyService.getPropertyTypes(),
      ]);
      setAmenities(a?.data?.data || []);
      setFacilities(f?.data?.data || []);
      setSafeties(s?.data?.data || []);
      setRoomTypes(rt?.data?.data || []);
      setPropertyTypes(pt?.data?.data || []);
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
    }
  };

  const findRoomType = (id) => {
    const found = roomTypes.find((roomType) => roomType.id === id);
    return found ? found.name : "";
  };

  useEffect(() => {
    fetchProperties();
    fetchDropdownData();
  }, []);

  /* ----- handlers ----- */
  const handleView = (property) => {
    setSelectedProperty(property);
    setViewModal(true);
  };

  const handleEdit = (property) => {
    openEditModal(property);
  };
// --- END: Edit Modal trigger ---


  const handleDelete = async (property) => {
    if (!property?.id) return;
    const ok = window.confirm(`Delete "${property.title}"?`);
    if (!ok) return;

    const prev = propertyList;
    setPropertyList((list) => list.filter((p) => p.id !== property.id));
    try {
      await services.propertyService.deleteProperty(encodeURIComponent(property.id));
    } catch (err) {
      console.error("Delete failed", err);
      setPropertyList(prev);
      alert("Delete failed. Please try again.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle location fields
    if (name.startsWith('location.')) {
      const [_, parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [parent]: {
            ...(prev.location[parent] || {}),
            [child]: type === 'checkbox' ? checked : value
          }
        }
      }));
      return;
    }

    // Handle room fields
    if (name.startsWith("room-")) {
      const [_, roomIndex, field] = name.split("-");
      setFormData(prev => ({
        ...prev,
        rooms: prev.rooms.map((room, idx) =>
          idx === parseInt(roomIndex)
            ? { ...room, [field]: type === 'checkbox' ? checked : value }
            : room
        )
      }));
      return;
    }

    // Handle all other fields
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRoomAmenityChange = (roomIndex, selectedAmenities) => {
    setFormData(prev => {
      const updatedRooms = [...prev.rooms];
      updatedRooms[roomIndex] = {
        ...updatedRooms[roomIndex],
        amenities: selectedAmenities
      };
      return { ...prev, rooms: updatedRooms };
    });
  };

  const updateRoomField = (index, field, value) => {
    const updatedRooms = [...formData.rooms];
    updatedRooms[index] = { ...updatedRooms[index], [field]: value };
    setFormData(prev => ({ ...prev, rooms: updatedRooms }));
  };

  const handleRoomImages = (e, roomIndex) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const updatedRooms = [...formData.rooms];
    if (!updatedRooms[roomIndex].images) {
      updatedRooms[roomIndex].images = [];
    }

    const newImages = files.map(file => file);
    updatedRooms[roomIndex].images = [
      ...(updatedRooms[roomIndex].images || []),
      ...newImages
    ];

    setFormData(prev => ({
      ...prev,
      rooms: updatedRooms
    }));
  };

  const removeRoomImage = (roomIndex, imageIndex) => {
    const updatedRooms = [...formData.rooms];
    updatedRooms[roomIndex].images.splice(imageIndex, 1);
    setFormData(prev => ({
      ...prev,
      rooms: updatedRooms
    }));
  };

  const moveRoomUp = (index) => {
    if (index === 0) return;
    const updatedRooms = [...formData.rooms];
    [updatedRooms[index - 1], updatedRooms[index]] = [updatedRooms[index], updatedRooms[index - 1]];
    setFormData(prev => ({
      ...prev,
      rooms: updatedRooms
    }));
  };

  const moveRoomDown = (index) => {
    if (index === formData.rooms.length - 1) return;
    const updatedRooms = [...formData.rooms];
    [updatedRooms[index], updatedRooms[index + 1]] = [updatedRooms[index + 1], updatedRooms[index]];
    setFormData(prev => ({
      ...prev,
      rooms: updatedRooms
    }));
  };

  const addRoom = () => {
    setFormData(prev => ({
      ...prev,
      rooms: [
        ...prev.rooms,
        {
          roomTypeId: "",
          roomNumber: "",
          floor: "",
          pricePerNight: "",
          maxOccupancy: 2,
          isAvailable: true,
          amenities: []
        }
      ]
    }));
  };

  const removeRoom = (index) => {
    if (formData.rooms.length <= 1) {
      toast.error('At least one room is required');
      return;
    }
    setFormData(prev => ({
      ...prev,
      rooms: prev.rooms.filter((_, i) => i !== index)
    }));
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files || []);
    setMediaFiles(files);
    setCoverIndex(0);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      propertyTypeId: "",
      ownerHostId: "fd3f5efd-3af6-4bfc-b6e3-603166839dbb",
      status: "active",
      rulesAndPolicies: "",
      location: {
        address: {
          line1: "",
          line2: "",
          area: "",
          city: "",
          state: "",
          country: "IN",
          postalCode: "",
        },
        coordinates: { lat: 0, lng: 0 },
      },
      rooms: [
        {
          roomTypeId: "",
          roomNumber: "",
          floor: "",
          pricePerNight: "",
          maxOccupancy: 2,
          isAvailable: true,
          amenities: []
        }
      ]
    });
    setSelectedAmenities([]);
    setSelectedFacilities([]);
    setSelectedSafeties([]);
    setSelectedRoomTypes([]);
    setMediaFiles([]);
    setCoverIndex(0);
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.title?.trim()) newErrors.title = 'Title is required';
    if (!formData.ownerHostId) newErrors.ownerHostId = 'Owner is required';
    if (!formData.propertyTypeId) newErrors.propertyTypeId = 'Property type is required';

    // Location validation
    if (!formData.location?.address?.line1?.trim()) newErrors['location.address'] = 'Address line 1 is required';
    if (!formData.location?.address?.city?.trim()) newErrors['location.city'] = 'City is required';
    if (!formData.location?.address?.postalCode?.trim()) newErrors['location.postalCode'] = 'Postal code is required';

    // Media validation
    if (mediaFiles.length === 0) {
      newErrors.media = 'At least one image is required';
    } else {
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      mediaFiles.forEach((file, index) => {
        if (file.size > MAX_FILE_SIZE) {
          newErrors[`media_${index}`] = `File ${file.name} is too large (max 5MB)`;
        }
        if (!file.type.match('image/(jpeg|png|jpg|gif)')) {
          newErrors[`media_${index}`] = `File ${file.name} must be an image (JPEG, PNG, JPG, GIF)`;
        }
      });
    }

    // Rooms validation
    if (formData.rooms.length === 0) {
      newErrors.rooms = 'At least one room is required';
    } else {
      formData.rooms.forEach((room, index) => {
        if (!room.roomTypeId) newErrors[`room_${index}_type`] = 'Room type is required';
        if (!room.roomNumber?.trim()) newErrors[`room_${index}_number`] = 'Room number is required';
        if (!room.pricePerNight || isNaN(room.pricePerNight) || room.pricePerNight <= 0) {
          newErrors[`room_${index}_price`] = 'Valid price is required';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {

    console.log("hit")
    e.preventDefault();
    setSubmitError('');

    // if (!validateForm()) {
    //   window.scrollTo(0, 0);
    //   return;
    // }

    setIsSubmitting(true);

    try {
      const fd = new FormData();
      console.log("hit")

      // Prepare property data according to Prisma schema
      const propertyData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        rulesAndPolicies: formData.rulesAndPolicies?.trim() || '',
        status: formData.status || 'active',
        propertyTypeId: formData.propertyTypeId,
        ownerHostId: formData.ownerHostId,
      };

      // Add basic fields to form data
      Object.entries(propertyData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          fd.append(key, value);
        }
      });

      // Add amenities, facilities, and safeties from selected arrays
      selectedAmenities.forEach((amenity) => {
        fd.append('amenityIds', amenity.id);
      });

      selectedFacilities.forEach((facility) => {
        fd.append('facilityIds', facility.id);
      });

      selectedSafeties.forEach((safety) => {
        fd.append('safetyIds', safety.id);
      });

      // Prepare location
      const locationData = {
        address: {
          line1: formData.location?.address?.line1?.trim() || '',
          line2: formData.location?.address?.line2?.trim() || '',
          area: formData.location?.address?.area?.trim() || '',
          city: formData.location?.address?.city?.trim() || '',
          state: formData.location?.address?.state?.trim() || '',
          country: formData.location?.address?.country?.trim() || 'India',
          postalCode: formData.location?.address?.postalCode?.trim() || '',
        },
        coordinates: formData.location?.coordinates || null
      };
      fd.append('location', JSON.stringify(locationData));

      // Process property media files
      mediaFiles.forEach((file, index) => {
        fd.append('media', file);
        if (index === coverIndex) {
          fd.append('coverImageIndex', index);
        }
      });

      // Rooms
      formData.rooms.forEach((room, roomIndex) => {
        const roomData = {
          roomTypeId: room.roomTypeId,
          name: room.name?.trim() || `Room ${room.roomNumber || ''}`.trim(),
          code: room.code?.trim() || '',
          spaceSqft: parseInt(room.spaceSqft) || 0,
          maxOccupancy: parseInt(room.maxOccupancy) || 2,
          price: parseFloat(room.price) || 0, // backend expects price; adjust if needed
          status: room.status || 'active',
          amenityIds: Array.isArray(room.amenities) ? room.amenities.map((a) => a.id) : [],
        };

        fd.append('rooms', JSON.stringify(roomData));

        if (room.images && room.images.length > 0) {
          room.images.forEach((image) => {
            if (image instanceof File) {
              fd.append(`roomImages_${roomIndex}`, image);
            } else if (image.url) {
              fd.append(`existingRoomImages_${roomIndex}`, image.url);
            }
          });
        }
      });

      // Room types (selected list)
      selectedRoomTypes.forEach((roomType, index) => {
        fd.append(`roomTypeIds[${index}]`, roomType.id);
      });

      // Actually submit
      await services.propertyService.createProperty(fd);

      toast.success("Property created");
      resetForm();
      setModal(false);
      fetchProperties();
    } catch (err) {
      console.error("create property failed", err);
      setSubmitError(err?.response?.data?.message || "Failed to create property");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add-item handlers (kept at component scope, not inside handleSubmit)
  const handleAddAmenity = async (name) => {
    const res = await services.propertyService.createAmenity({ name });
    const newAmenity = res?.data?.data;
    if (newAmenity) {
      setAmenities((p) => [...p, newAmenity]);
      setSelectedAmenities((p) => [...p, newAmenity]);
      setShowAddAmenity(false);
    }
  };

  const handleAddFacility = async (name) => {
    const res = await services.propertyService.createFacility({ name });
    const newItem = res?.data?.data;
    if (newItem) {
      setFacilities(prev => [...prev, newItem]);
      setSelectedFacilities(prev => [...prev, newItem]);
      setShowAddFacility(false);
    }
  };

  const handleAddSafety = async (name) => {
    const res = await services.propertyService.createSafety({ name });
    const newItem = res?.data?.data;
    if (newItem) {
      setSafeties(prev => [...prev, newItem]);
      setSelectedSafeties(prev => [...prev, newItem]);
      setShowAddSafety(false);
    }
  };

  const handleAddRoomType = async (name) => {
    const res = await services.propertyService.createRoomType({ name });
    const newItem = res?.data?.data;
    if (newItem) {
      setRoomTypes((p) => [...p, newItem]);
      setSelectedRoomTypes((p) => [...p, newItem]);
    }
  };

  const handleAddPropertyType = async (name) => {
    const res = await services.propertyService.createPropertyType({ name });
    const newItem = res?.data?.data;
    if (newItem) {
      setPropertyTypes((p) => [...p, newItem]);
      setFormData((prev) => ({ ...prev, propertyTypeId: newItem.id }));
    }
  };

  const rows = useMemo(() => propertyList ?? [], [propertyList]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">All Properties</h1>
        <button
          type="button"
          onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={16} />
          Add Property
        </button>
      </div>

      {/* Table / states */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading properties…</div>
        ) : errMsg ? (
          <div className="p-8 text-center text-red-600">{errMsg}</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No properties found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rooms</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{property.title || "—"}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{property.description || "—"}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                        {property.propertyType?.name || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {property.location?.address.city || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {(property.rooms?.length ?? 0)} room{(property.rooms?.length ?? 0) !== 1 ? "s" : ""}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          property.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {property.status || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(property.createdAt)}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleView(property)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(property)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(property)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {viewModal && selectedProperty && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewModal(false);
          }}
        >
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Property Details</h2>
              <button
                type="button"
                onClick={() => setViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* ==== Property Details (expanded) ==== */}
            <div className="space-y-6">
              {/* Cover image */}
              {(selectedProperty.coverImage || selectedProperty.media?.length) && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Cover</h3>
                  <div className="w-full rounded overflow-hidden border">
                    <img
                      src={services.mediaService.getMedia(selectedProperty.coverImage)}
                      alt="Cover"
                      className="w-full max-h-72 object-cover bg-gray-100"
                    />
                  </div>
                </div>
              )}

              {/* Basic Information */}
              <div>
                <h3 className="font-semibold text-gray-700">Basic Information</h3>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Title:</span>
                    <p className="font-medium">{selectedProperty.title || "—"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Type:</span>
                    <p className="font-medium">{selectedProperty.propertyType?.name || "—"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Status:</span>
                    <p className="font-medium capitalize">{selectedProperty.status || "—"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Created:</span>
                    <p className="font-medium">{formatDate(selectedProperty.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <span className="text-sm text-gray-500">Description:</span>
                <p className="font-medium whitespace-pre-wrap">
                  {selectedProperty.description || "—"}
                </p>
              </div>

              {/* Location */}
              <div>
                <h3 className="font-semibold text-gray-700">Location</h3>
                <p className="font-medium">
                  {selectedProperty.location?.formatted ||
                    [
                      selectedProperty.location?.address?.line1,
                      selectedProperty.location?.address?.area,
                      selectedProperty.location?.address?.city,
                      selectedProperty.location?.address?.state,
                      selectedProperty.location?.address?.postalCode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"}
                </p>
                {(selectedProperty.location?.coordinates?.lat !== undefined ||
                  selectedProperty.location?.coordinates?.lng !== undefined) && (
                  <p className="text-sm text-gray-500 mt-1">
                    Lat: {selectedProperty.location?.coordinates?.lat ?? "—"} · Lng: {selectedProperty.location?.coordinates?.lng ?? "—"}
                  </p>
                )}
              </div>

              {/* Features: Amenities / Facilities / Safety */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedProperty.amenities ?? []).length ? (
                      (selectedProperty.amenities ?? []).map((a) => (
                        <span
                          key={a.id}
                          className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                        >
                          {a.amenity?.name || a.name || a.amenityId?.slice(0, 8) || "—"}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">—</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Facilities</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedProperty.facilities ?? []).length ? (
                      (selectedProperty.facilities ?? []).map((f) => (
                        <span
                          key={f.id}
                          className="px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700"
                        >
                          {f.facility?.name || f.name || f.facilityId?.slice(0, 8) || "—"}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">—</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Safety & Hygiene</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedProperty.safeties ?? []).length ? (
                      (selectedProperty.safeties ?? []).map((s) => (
                        <span
                          key={s.id}
                          className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700"
                        >
                          {s.safety?.name || s.name || s.safetyId?.slice(0, 8) || "—"}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">—</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Media Gallery */}
              {(selectedProperty.media ?? []).length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Media</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(selectedProperty.media ?? []).map((m) => {
                      const isImage = (m.type || "").startsWith("image");
                      return (
                        <div key={m.id} className="border rounded overflow-hidden">
                          {isImage ? (
                            <img
                              src={services.mediaService.getMedia(m.url)}
                              alt={m.caption || "Media"}
                              className="w-full h-32 object-cover bg-gray-100"
                            />
                          ) : (
                            <video
                              src={services.mediaService.getMedia(m.url)}
                              className="w-full h-32 bg-black"
                              controls
                            />
                          )}
                          <div className="px-2 py-1 text-xs text-gray-600 flex justify-between">
                            <span className="truncate">{m.caption || (isImage ? "Image" : "Video")}</span>
                            {m.isFeatured ? (
                              <span className="text-[10px] uppercase font-semibold text-blue-700">Cover</span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rooms */}
              <div>
                <h3 className="font-semibold text-gray-700">
                  Rooms ({selectedProperty.rooms?.length ?? 0})
                </h3>
                {(selectedProperty.rooms ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500 mt-2">—</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {(selectedProperty.rooms ?? []).map((room) => (
                      <div
                        key={room.id ?? `${room.name}-${room.code ?? Math.random()}`}
                        className="p-3 border rounded"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <span className="text-xs text-gray-500">Room Name:</span>
                            <p className="text-sm font-medium">{room.name || "—"}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Type:</span>
                            <p className="text-sm font-medium">{findRoomType(room.roomTypeId) || "—"}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Price:</span>
                            <p className="text-sm font-medium">{formatINR(room.price)}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Max Occupancy:</span>
                            <p className="text-sm font-medium">
                              {(room.maxOccupancy ?? 0)} guest{(room.maxOccupancy ?? 0) !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Code:</span>
                            <p className="text-sm font-medium">{room.code || "—"}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Status:</span>
                            <p className="text-sm font-medium capitalize">{room.status || "—"}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* End View Details Modal */}

      {/* Add Property Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModal(false);
              resetForm();
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Add New Property</h2>
                <button
                  type="button"
                  onClick={() => {
                    setModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Error message */}
              {submitError && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                  <p>{submitError}</p>
                </div>
              )}

              {/* Form content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700">Basic Information</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Type *
                    </label>
                    <div className="flex gap-2">
                      <select
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
                        className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        title="Add New Property Type"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner Host ID *</label>
                    <input
                      type="text"
                      name="ownerHostId"
                      value={formData.ownerHostId}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      (Temporary field — set from logged-in user in production.)
                    </p>
                  </div>

                  <div>
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

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rules and Policies
                    </label>
                    <textarea
                      name="rulesAndPolicies"
                      value={formData.rulesAndPolicies}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="House rules, check-in/out times, etc."
                    />
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
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Location Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 1 *
                      </label>
                      <input
                        type="text"
                        name="location.address.line1"
                        value={formData.location?.address?.line1 || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        name="location.address.line2"
                        value={formData.location?.address?.line2 || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Area/Locality *
                      </label>
                      <input
                        type="text"
                        name="location.address.area"
                        value={formData.location?.address?.area || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        name="location.address.city"
                        value={formData.location?.address?.city || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        name="location.address.state"
                        value={formData.location?.address?.state || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        name="location.address.postalCode"
                        value={formData.location?.address?.postalCode || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        name="location.address.country"
                        value={formData.location?.address?.country || 'India'}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        readOnly
                      />
                    </div>
                  </div>

                  {/* Map for coordinates */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location on Map
                    </label>
                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center relative">
                      {formData.location?.coordinates?.lat && formData.location?.coordinates?.lng ? (
                        <div className="text-center p-4">
                          <p className="text-sm text-gray-600">
                            Coordinates: {formData.location.coordinates.lat.toFixed(6)}, {formData.location.coordinates.lng.toFixed(6)}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              const lat = prompt('Enter latitude:', formData.location?.coordinates?.lat || '');
                              const lng = prompt('Enter longitude:', formData.location?.coordinates?.lng || '');
                              if (lat && lng) {
                                setFormData(prev => ({
                                  ...prev,
                                  location: {
                                    ...prev.location,
                                    coordinates: {
                                      lat: parseFloat(lat),
                                      lng: parseFloat(lng)
                                    }
                                  }
                                }));
                              }
                            }}
                            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            Set Location on Map
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const lat = prompt('Enter latitude:');
                            const lng = prompt('Enter longitude:');
                            if (lat && lng) {
                              setFormData(prev => ({
                                ...prev,
                                location: {
                                  ...prev.location,
                                  coordinates: {
                                    lat: parseFloat(lat),
                                    lng: parseFloat(lng)
                                  }
                                }
                              }));
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Set Location on Map
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Click to set the exact location on the map (latitude and longitude)
                    </p>
                  </div>

                </div>
              </div>

              {/* Features */}
              <div className="mt-8 space-y-6">
                <h3 className="text-lg font-semibold text-gray-700">Property Features</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amenities
                    </label>
                    <MultiSelect
                      options={amenities}
                      selected={selectedAmenities}
                      onChange={setSelectedAmenities}
                      placeholder="Select amenities"
                      onAddNew={() => setShowAddAmenity(true)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facilities
                    </label>
                    <MultiSelect
                      options={facilities}
                      selected={selectedFacilities}
                      onChange={setSelectedFacilities}
                      onAddNew={() => setShowAddFacility(true)}
                      placeholder="Select facilities"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Safety Features
                    </label>
                    <MultiSelect
                      options={safeties}
                      selected={selectedSafeties}
                      onChange={setSelectedSafeties}
                      placeholder="Select safety features"
                      onAddNew={() => setShowAddSafety(true)}
                    />
                  </div>
                </div>
              </div>

              {/* Rooms Section */}
              <div className="mt-8 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-700">Rooms</h3>
                  <button
                    type="button"
                    onClick={addRoom}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Room
                  </button>
                </div>

                {formData.rooms.map((room, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50 mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-800">Room {index + 1}</h4>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => moveRoomUp(index)}
                          disabled={index === 0}
                          className="text-gray-600 hover:text-gray-800 disabled:opacity-30"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveRoomDown(index)}
                          disabled={index === formData.rooms.length - 1}
                          className="text-gray-600 hover:text-gray-800 disabled:opacity-30"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        {formData.rooms.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRoom(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Room Type */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Room Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={room.roomTypeId || ''}
                          onChange={(e) => updateRoomField(index, 'roomTypeId', e.target.value)}
                          className="w-full border border-gray-300 rounded p-2"
                          required
                        >
                          <option value="">Select Room Type</option>
                          {roomTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Room Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Room Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={room.name || ''}
                          onChange={(e) => updateRoomField(index, 'name', e.target.value)}
                          className="w-full border border-gray-300 rounded p-2"
                          placeholder="e.g., Deluxe Room 101"
                          required
                        />
                      </div>

                      {/* Room Code */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Room Code
                        </label>
                        <input
                          type="text"
                          value={room.code || ''}
                          onChange={(e) => updateRoomField(index, 'code', e.target.value)}
                          className="w-full border border-gray-300 rounded p-2"
                          placeholder="e.g., DR-101"
                        />
                      </div>

                      {/* Space (sqft) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Space (sqft)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={room.spaceSqft || ''}
                          onChange={(e) => updateRoomField(index, 'spaceSqft', e.target.value)}
                          className="w-full border border-gray-300 rounded p-2"
                          placeholder="e.g., 300"
                        />
                      </div>

                      {/* Max Occupancy */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Occupancy <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={room.maxOccupancy || ''}
                          onChange={(e) => updateRoomField(index, 'maxOccupancy', e.target.value)}
                          className="w-full border border-gray-300 rounded p-2"
                          placeholder="e.g., 2"
                          required
                        />
                      </div>

                      {/* Price */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price per night <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={room.price || ''}
                            onChange={(e) => updateRoomField(index, 'price', e.target.value)}
                            className="w-full border border-gray-300 rounded p-2 pl-8"
                            placeholder="0.00"
                            required
                          />
                        </div>
                      </div>

                      {/* Room Status */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={room.status || 'active'}
                          onChange={(e) => updateRoomField(index, 'status', e.target.value)}
                          className="w-full border border-gray-300 rounded p-2"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="maintenance">Under Maintenance</option>
                        </select>
                      </div>

                      {/* Room Images */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Room Images
                        </label>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleRoomImages(e, index)}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                        />
                        <div className="mt-2 flex flex-wrap gap-2">
                          {room.images?.map((img, imgIndex) => (
                            <div key={imgIndex} className="relative group">
                              <img
                                src={img instanceof File ? URL.createObjectURL(img) : img.url}
                                alt={`Room ${index + 1} - ${imgIndex + 1}`}
                                className="h-20 w-20 object-cover rounded border"
                              />
                              <button
                                type="button"
                                onClick={() => removeRoomImage(index, imgIndex)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Room Amenities */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Room Amenities
                        </label>
                        <MultiSelect
                          options={amenities}
                          selected={room.amenities || []}
                          onChange={(selected) => {
                            const updatedRooms = [...formData.rooms];
                            updatedRooms[index].amenities = selected;
                            setFormData(prev => ({ ...prev, rooms: updatedRooms }));
                          }}
                          placeholder="Select amenities for this room"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Media Upload */}
              <div className="mt-8 space-y-3">
                <h3 className="text-lg font-semibold text-gray-700">Property Images (at least one)</h3>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleMediaChange}
                  className="block border border-gray-300 rounded p-2 text-gray-400"
                />
                {mediaFiles.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    {mediaFiles.map((file, idx) => {
                      const isImage = file.type?.startsWith("image/");
                      const url = URL.createObjectURL(file);
                      return (
                        <label
                          key={idx}
                          className={`border rounded p-2 flex flex-col items-center gap-2 cursor-pointer ${
                            coverIndex === idx ? "ring-2 ring-blue-500" : ""
                          }`}
                          title="Click to set as cover image"
                        >
                          <input
                            type="radio"
                            name="cover"
                            className="hidden"
                            checked={coverIndex === idx}
                            onChange={() => setCoverIndex(idx)}
                          />
                          {isImage ? (
                            <img src={url} alt={file.name} className="h-24 w-full object-cover rounded" />
                          ) : (
                            <div className="h-24 w-full bg-gray-100 flex items-center justify-center rounded">
                              <span className="text-xs text-gray-500">Video File</span>
                            </div>
                          )}
                          <span className="text-xs text-gray-600 truncate w-full text-center">
                            {file.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setModal(false);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center min-w-32 ${
                    isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Create Property'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add item modals */}
      <AddItemModal
        isOpen={showAddAmenity}
        onClose={() => setShowAddAmenity(false)}
        onAdd={handleAddAmenity}
        title="Amenity"
        placeholder="e.g., Pool"
      />
      <AddItemModal
        isOpen={showAddFacility}
        onClose={() => setShowAddFacility(false)}
        onAdd={handleAddFacility}
        title="Facility"
        placeholder="e.g., Gym"
      />
      <AddItemModal
        isOpen={showAddSafety}
        onClose={() => setShowAddSafety(false)}
        onAdd={handleAddSafety}
        title="Safety Feature"
        placeholder="e.g., Fire Extinguisher"
      />
      <AddItemModal
        isOpen={showAddRoomType}
        onClose={() => setShowAddRoomType(false)}
        onAdd={handleAddRoomType}
        title="Room Type"
        placeholder="e.g., Deluxe"
      />
      <AddItemModal
        isOpen={showAddPropertyType}
        onClose={() => setShowAddPropertyType(false)}
        onAdd={handleAddPropertyType}
        title="Property Type"
        placeholder="e.g., Villa"
      />

      {/* Edit Property Modal */}
      {editModal && editFormData && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditModal(false);
              setEditFormData(null);
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Edit Property</h2>
                <button
                  type="button"
                  onClick={() => {
                    setEditModal(false);
                    setEditFormData(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Error message */}
              {editSubmitError && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                  <p>{editSubmitError}</p>
                </div>
              )}

              {/* Form content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700">Basic Information</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={editFormData.title || ""}
                      onChange={handleEditInputChange}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Type *
                    </label>
                    <select
                      name="propertyTypeId"
                      value={editFormData.propertyTypeId || ""}
                      onChange={handleEditInputChange}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Property Type</option>
                      {propertyTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={editFormData.description || ""}
                      onChange={handleEditInputChange}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rules and Policies
                    </label>
                    <textarea
                      name="rulesAndPolicies"
                      value={editFormData.rulesAndPolicies || ""}
                      onChange={handleEditInputChange}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="House rules, check-in/out times, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={editFormData.status || "active"}
                      onChange={handleEditInputChange}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Location Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 1 *
                      </label>
                      <input
                        type="text"
                        name="location.address.line1"
                        value={editFormData.location?.address?.line1 || ''}
                        onChange={handleEditInputChange}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        name="location.address.line2"
                        value={editFormData.location?.address?.line2 || ''}
                        onChange={handleEditInputChange}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Area/Locality *
                      </label>
                      <input
                        type="text"
                        name="location.address.area"
                        value={editFormData.location?.address?.area || ''}
                        onChange={handleEditInputChange}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        name="location.address.city"
                        value={editFormData.location?.address?.city || ''}
                        onChange={handleEditInputChange}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        name="location.address.state"
                        value={editFormData.location?.address?.state || ''}
                        onChange={handleEditInputChange}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        name="location.address.postalCode"
                        value={editFormData.location?.address?.postalCode || ''}
                        onChange={handleEditInputChange}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        name="location.address.country"
                        value={editFormData.location?.address?.country || 'India'}
                        onChange={handleEditInputChange}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mt-8 space-y-6">
                <h3 className="text-lg font-semibold text-gray-700">Property Features</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amenities
                    </label>
                    <MultiSelect
                      options={amenities}
                      selected={editSelectedAmenities}
                      onChange={setEditSelectedAmenities}
                      placeholder="Select amenities"
                      onAddNew={() => setShowAddAmenity(true)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facilities
                    </label>
                    <MultiSelect
                      options={facilities}
                      selected={editSelectedFacilities}
                      onChange={setEditSelectedFacilities}
                      onAddNew={() => setShowAddFacility(true)}
                      placeholder="Select facilities"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Safety Features
                    </label>
                    <MultiSelect
                      options={safeties}
                      selected={editSelectedSafeties}
                      onChange={setEditSelectedSafeties}
                      placeholder="Select safety features"
                      onAddNew={() => setShowAddSafety(true)}
                    />
                  </div>
                </div>
              </div>

              {/* Media Section */}
              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">Property Images</h3>
                
                {/* Existing Images */}
                {editFormData.media && editFormData.media.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {editFormData.media.map((media, index) => (
                        <div key={media.id || index} className="relative group">
                          <img
                            src={media.url}
                            alt={`Property ${index + 1}`}
                            className="w-full h-32 object-cover rounded border"
                          />
                          <div className="absolute top-2 right-2 flex gap-1">
                            <button
                              type="button"
                              onClick={() => setEditCoverIndex(index)}
                              className={`px-2 py-1 text-xs rounded ${
                                editCoverIndex === index && editMediaFiles.length === 0
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              Cover
                            </button>
                            <button
                              type="button"
                              onClick={() => removeEditExistingImage(index)}
                              className="bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add New Images
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleEditMediaChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                  
                  {/* New Images Preview */}
                  {editMediaFiles.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">New Images Preview</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {editMediaFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`New ${index + 1}`}
                              className="w-full h-32 object-cover rounded border"
                            />
                            <div className="absolute top-2 right-2 flex gap-1">
                              <button
                                type="button"
                                onClick={() => setEditCoverIndex(index)}
                                className={`px-2 py-1 text-xs rounded ${
                                  editCoverIndex === index && editFormData.media?.length === 0
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                Cover
                              </button>
                              <button
                                type="button"
                                onClick={() => removeEditNewImage(index)}
                                className="bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rooms Section - Editable */}
              <div className="mt-8 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-700">Rooms</h3>
                  <button
                    type="button"
                    onClick={addEditRoom}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Room
                  </button>
                </div>

                {(!editFormData.rooms || editFormData.rooms.length === 0) ? (
                  <p className="text-sm text-gray-500 italic">No rooms added yet. Click "Add Room" to get started.</p>
                ) : (
                  editFormData.rooms.map((room, index) => (
                    <div key={room.id || index} className="p-4 border rounded-lg bg-gray-50 mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-800">Room {index + 1}</h4>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => moveEditRoomUp(index)}
                            disabled={index === 0}
                            className="text-gray-600 hover:text-gray-800 disabled:opacity-30"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveEditRoomDown(index)}
                            disabled={index === editFormData.rooms.length - 1}
                            className="text-gray-600 hover:text-gray-800 disabled:opacity-30"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                          {editFormData.rooms.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeEditRoom(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Room Type */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Room Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={room.roomTypeId || ''}
                            onChange={(e) => updateEditRoomField(index, 'roomTypeId', e.target.value)}
                            className="w-full border border-gray-300 rounded p-2"
                            required
                          >
                            <option value="">Select Room Type</option>
                            {roomTypes.map((type) => (
                              <option key={type.id} value={type.id}>
                                {type.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Room Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Room Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={room.name || ''}
                            onChange={(e) => updateEditRoomField(index, 'name', e.target.value)}
                            className="w-full border border-gray-300 rounded p-2"
                            placeholder="e.g., Deluxe Room 101"
                            required
                          />
                        </div>

                        {/* Room Code */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Room Code
                          </label>
                          <input
                            type="text"
                            value={room.code || ''}
                            onChange={(e) => updateEditRoomField(index, 'code', e.target.value)}
                            className="w-full border border-gray-300 rounded p-2"
                            placeholder="e.g., DR-101"
                          />
                        </div>

                        {/* Space (sqft) */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Space (sqft)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={room.spaceSqft || ''}
                            onChange={(e) => updateEditRoomField(index, 'spaceSqft', e.target.value)}
                            className="w-full border border-gray-300 rounded p-2"
                            placeholder="e.g., 300"
                          />
                        </div>

                        {/* Max Occupancy */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Occupancy <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={room.maxOccupancy || ''}
                            onChange={(e) => updateEditRoomField(index, 'maxOccupancy', e.target.value)}
                            className="w-full border border-gray-300 rounded p-2"
                            placeholder="e.g., 2"
                            required
                          />
                        </div>

                        {/* Price */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price per night <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={room.price || ''}
                              onChange={(e) => updateEditRoomField(index, 'price', e.target.value)}
                              className="w-full border border-gray-300 rounded p-2 pl-8"
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </div>

                        {/* Room Status */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <select
                            value={room.status || 'active'}
                            onChange={(e) => updateEditRoomField(index, 'status', e.target.value)}
                            className="w-full border border-gray-300 rounded p-2"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="maintenance">Under Maintenance</option>
                          </select>
                        </div>

                        {/* Room Images */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Room Images
                          </label>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => handleEditRoomImages(e, index)}
                            className="block w-full text-sm text-gray-500
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-md file:border-0
                              file:text-sm file:font-semibold
                              file:bg-blue-50 file:text-blue-700
                              hover:file:bg-blue-100"
                          />
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(room.images || []).map((img, imgIndex) => (
                              <div key={imgIndex} className="relative group">
                                <img
                                  src={img.file ? img.url : (img.url || services.mediaService.getMedia(img.url))}
                                  alt={`Room ${index + 1} - ${imgIndex + 1}`}
                                  className="h-20 w-20 object-cover rounded border"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeEditRoomImage(index, imgIndex)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Room Amenities */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Room Amenities
                          </label>
                          <MultiSelect
                            options={amenities}
                            selected={room.amenities || []}
                            onChange={(selected) => updateEditRoomField(index, 'amenities', selected)}
                            placeholder="Select room amenities"
                            onAddNew={() => setShowAddAmenity(true)}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Submit Buttons */}
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditModal(false);
                    setEditFormData(null);
                  }}
                  disabled={editIsSubmitting}
                  className="px-6 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editIsSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {editIsSubmitting ? "Updating..." : "Update Property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* End Edit Property Modal */}

    </div>
  );
};

export default Properties;
