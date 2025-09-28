import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Edit, Trash2, X, MapPin, Star, Users, Square, Calendar, Shield, Coffee, Wifi, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { useSelector } from "react-redux";
import {propertyService} from "../../services";

/* ---------- utils ---------- */
const nfINR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const formatINR = (v) => nfINR.format(Number(v || 0));

/* ---------- helpers ---------- */
const formatDate = (d) => {
  const dt = d ? new Date(d) : null;
  return dt && !isNaN(dt) ? dt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" }) : "—";
};

const formatFullDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatAddress = (address) => {
  if (!address) return "Address not available";
  return `${address.line1 || ''}, ${address.line2 || ''}, ${address.area || ''}, ${address.city || ''}, ${address.state || ''} - ${address.postalCode || ''}, ${address.country || ''}`;
};

const coverOf = (p) =>
  p?.coverImage ||
  p?.media?.find((m) => m.isFeatured)?.url ||
  (p?.media?.length ? p.media[0].url : null);

/* ---------- Property Details Modal Component ---------- */
const PropertyDetailsModal = ({ property, isOpen, onClose,onEdit }) => {
  if (!isOpen || !property) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center rounded-t-2xl">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
            <div className="flex items-center mt-2 text-gray-600">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="text-sm">{property.location?.address?.city || 'N/A'}, {property.location?.address?.state || 'N/A'}</span>
              <span className="mx-2">•</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                {property.propertyType?.name || 'N/A'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-8">
          {/* Hero Image */}
          <div className="mb-8">
            <img
              src={coverOf(property) || '/api/placeholder/800/400'}
              alt={property.title}
              className="w-full h-96 object-cover rounded-xl shadow-lg"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Property Overview */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Property Overview</h2>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{property._count?.rooms || property.rooms?.length || 0}</p>
                      <p className="text-sm text-gray-600">Rooms Available</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Star className="w-6 h-6 text-yellow-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{property.avgRating ? Number(property.avgRating).toFixed(1) : 'N/A'}</p>
                      <p className="text-sm text-gray-600">Rating</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Calendar className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{property._count?.reviews || property.reviews?.length || 0}</p>
                      <p className="text-sm text-gray-600">Reviews</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Shield className="w-6 h-6 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 capitalize">{property.status || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Status</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700">{property.description || 'No description available'}</p>
                  </div>
                </div>
              </section>

              {/* Location Details */}
              {property.location?.address && (
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Location</h2>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-gray-900 font-medium">{formatAddress(property.location.address)}</p>
                        {property.location.coordinates && (
                          <p className="text-gray-600 text-sm mt-1">
                            Coordinates: {property.location.coordinates.lat}°N, {property.location.coordinates.lng}°E
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Rooms */}
              {property.rooms && property.rooms.length > 0 && (
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Available Rooms</h2>
                  <div className="space-y-4">
                    {property.rooms.map((room) => (
                      <div key={room.id} className="border border-gray-200 rounded-xl p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">{room.name}</h3>
                            <p className="text-gray-600">{room.roomType?.name || 'Standard Room'}</p>
                            <p className="text-sm text-gray-500">Room Code: {room.code}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">₹{parseInt(room.price || 0).toLocaleString()}</p>
                            <p className="text-sm text-gray-600">per night</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                          {room.spaceSqft && (
                            <div className="flex items-center space-x-2">
                              <Square className="w-4 h-4 text-gray-600" />
                              <span className="text-sm text-gray-700">{room.spaceSqft} sq ft</span>
                            </div>
                          )}
                          {room.maxOccupancy && (
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-gray-600" />
                              <span className="text-sm text-gray-700">Max {room.maxOccupancy} guests</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${room.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-sm text-gray-700 capitalize">{room.status || 'unknown'}</span>
                          </div>
                        </div>

                        {room.images && room.images.length > 0 && (
                          <div className="mt-4">
                            <img
                              src={room.images[0].url}
                              alt={room.images[0].caption || 'Room image'}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Rules & Policies */}
              {property.rulesAndPolicies && (
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Rules & Policies</h2>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <p className="text-gray-700">{property.rulesAndPolicies}</p>
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h3>
                  <div className="space-y-3">
                    {property.amenities.map((amenity) => (
                      <div key={amenity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Coffee className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-800">{amenity.amenity?.name || 'Amenity'}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Facilities */}
              {property.facilities && property.facilities.length > 0 && (
                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Facilities</h3>
                  <div className="space-y-3">
                    {property.facilities.map((facility) => (
                      <div key={facility.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Wifi className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-800">{facility.facility?.name || 'Facility'}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Safety Features */}
              {property.safeties && property.safeties.length > 0 && (
                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Safety Features</h3>
                  <div className="space-y-3">
                    {property.safeties.map((safety) => (
                      <div key={safety.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Shield className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-800">{safety.safety?.name || 'Safety Feature'}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Property Metadata */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Property Information</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Property ID</p>
                    <p className="text-sm font-mono text-gray-800">{property.id?.slice(0, 8)}...</p>
                  </div>
                  {property.createdAt && (
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="text-sm text-gray-800">{formatFullDate(property.createdAt)}</p>
                    </div>
                  )}
                  {property.updatedAt && (
                    <div>
                      <p className="text-sm text-gray-600">Last Updated</p>
                      <p className="text-sm text-gray-800">{formatFullDate(property.updatedAt)}</p>
                    </div>
                  )}
                  {property.ownerHostId && (
                    <div>
                      <p className="text-sm text-gray-600">Owner ID</p>
                      <p className="text-sm font-mono text-gray-800">{property.ownerHostId.slice(0, 8)}...</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button onClick={()=> onEdit(property)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Edit Property
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const PropertyEditModal = ({ property, isOpenEdit, onClose, onSave, propertyTypes, amenities, facilities, safeties, roomTypes, onAddAmenity, onAddFacility, onAddSafety, onAddRoomType, onAddPropertyType }) => {
  const [editFormData, setEditFormData] = useState(null);
  const [editMediaFiles, setEditMediaFiles] = useState([]);
  const [editCoverIndex, setEditCoverIndex] = useState(0);
  const [editSelectedAmenities, setEditSelectedAmenities] = useState([]);
  const [editSelectedFacilities, setEditSelectedFacilities] = useState([]);
  const [editSelectedSafeties, setEditSelectedSafeties] = useState([]);
  const [editSelectedRoomTypes, setEditSelectedRoomTypes] = useState([]);
  const [editIsSubmitting, setEditIsSubmitting] = useState(false);
  const [editSubmitError, setEditSubmitError] = useState("");
  
  // Add item modals
  const [showAddAmenity, setShowAddAmenity] = useState(false);
  const [showAddFacility, setShowAddFacility] = useState(false);
  const [showAddSafety, setShowAddSafety] = useState(false);
  const [showAddRoomType, setShowAddRoomType] = useState(false);
  const [showAddPropertyType, setShowAddPropertyType] = useState(false);

  // Normalize incoming shapes when modal opens (IMPORTANT)
  useEffect(() => {
    if (property && isOpenEdit) {
      setEditFormData({
        ...property,
        // Normalize each room's amenities to plain amenity objects {id, name, ...}
        rooms: (property.rooms ?? []).map(r => ({
          ...r,
          amenities: (r.amenities ?? []).map(a => a?.amenity || a) // if join shape, take a.amenity
        })),
      });

      // Property-level collections may also be join-shaped (amenity: {..})
      setEditSelectedAmenities((property.amenities ?? []).map(a => a?.amenity || a));
      setEditSelectedFacilities((property.facilities ?? []).map(f => f?.facility || f));
      setEditSelectedSafeties((property.safeties ?? []).map(s => s?.safety || s));
      setEditSelectedRoomTypes(property.roomTypes ?? []);
    }
  }, [property, isOpenEdit]);

  if (!isOpenEdit || !property || !editFormData) return null;

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

  // Media handlers
  const handleEditMediaChange = (e) => {
    const files = Array.from(e.target.files || []);
    setEditMediaFiles(files);
    setEditCoverIndex(0);
  };

  const removeEditExistingImage = (index) => {
    setEditFormData(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
    }));
    if (editCoverIndex === index) setEditCoverIndex(0);
  };

  const removeEditNewImage = (index) => {
    setEditMediaFiles(prev => prev.filter((_, i) => i !== index));
    if (editCoverIndex === index) setEditCoverIndex(0);
  };

  // Room management
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
      amenities: [] // normalized to array of {id,name}
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

  // Submit: map normalized objects back to IDs for API
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSubmitError("");
    setEditIsSubmitting(true);
    try {
      const payload = {
        ...editFormData,
        // property-level: Map to IDs if API expects ids
        amenities: (editSelectedAmenities ?? []).map(a => a.id),
        facilities: (editSelectedFacilities ?? []).map(f => f.id),
        safeties: (editSelectedSafeties ?? []).map(s => s.id),
        // rooms: Map each room amenities to ids
        rooms: (editFormData.rooms ?? []).map(r => ({
          ...r,
          amenities: (r.amenities ?? []).map(a => a.id),
        })),
      };

      console.log("payload", payload);

      const response = await propertyService.updateProperty(property.id, payload);
      console.log(response);
      
      onClose();
    } catch (err) {
      setEditSubmitError(err?.response?.data?.message || "Failed to update property");
    } finally {
      setEditIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleEditSubmit} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Edit Property</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {editSubmitError && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              <p>{editSubmitError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Basic Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Title *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={editFormData.description || ""}
                  onChange={handleEditInputChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rules and Policies</label>
                <textarea
                  name="rulesAndPolicies"
                  value={editFormData.rulesAndPolicies || ""}
                  onChange={handleEditInputChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    name="location.address.line2"
                    value={editFormData.location?.address?.line2 || ''}
                    onChange={handleEditInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area/Locality *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    name="location.address.country"
                    value={editFormData.location?.address?.country || 'India'}
                    onChange={handleEditInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    readOnly
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
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveEditRoomDown(index)}
                        disabled={index === editFormData.rooms.length - 1}
                        className="text-gray-600 hover:text-gray-800 disabled:opacity-30"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeEditRoom(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                      <select
                        value={room.roomTypeId || ''}
                        onChange={(e) => updateEditRoomField(index, 'roomTypeId', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Room Type</option>
                        {roomTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                      <input
                        type="text"
                        value={room.name || ''}
                        onChange={(e) => updateEditRoomField(index, 'name', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Deluxe Suite"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Room Code</label>
                      <input
                        type="text"
                        value={room.code || ''}
                        onChange={(e) => updateEditRoomField(index, 'code', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., R101"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Space (sq ft)</label>
                      <input
                        type="number"
                        value={room.spaceSqft || ''}
                        onChange={(e) => updateEditRoomField(index, 'spaceSqft', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 250"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Occupancy</label>
                      <input
                        type="number"
                        value={room.maxOccupancy || 1}
                        onChange={(e) => updateEditRoomField(index, 'maxOccupancy', parseInt(e.target.value) || 1)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                      <input
                        type="number"
                        value={room.price || ''}
                        onChange={(e) => updateEditRoomField(index, 'price', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 2500"
                      />
                    </div>
                  </div>

                  {/* Room Images */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Room Images</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleEditRoomImages(e, index)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    
                    {room.images && room.images.length > 0 && (
                      <div className="mt-2 grid grid-cols-4 gap-2">
                        {room.images.map((img, imgIndex) => (
                          <div key={imgIndex} className="relative group">
                            <img
                              src={img.url}
                              alt={`Room ${index + 1} Image ${imgIndex + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() => removeEditRoomImage(index, imgIndex)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Room Amenities */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Room Amenities</label>
                    <MultiSelect
                      options={amenities}
                      selected={room.amenities || []} 
                      onChange={(selected) => updateEditRoomField(index, 'amenities', selected)}
                      placeholder="Select room amenities"
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={editIsSubmitting}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
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

      {/* Add Item Modals */}
      <AddItemModal
        isOpen={showAddAmenity}
        onClose={() => setShowAddAmenity(false)}
        onAdd={onAddAmenity}
        title="Add New Amenity"
        placeholder="Enter amenity name"
      />
      
      <AddItemModal
        isOpen={showAddFacility}
        onClose={() => setShowAddFacility(false)}
        onAdd={onAddFacility}
        title="Add New Facility"
        placeholder="Enter facility name"
      />
      
      <AddItemModal
        isOpen={showAddSafety}
        onClose={() => setShowAddSafety(false)}
        onAdd={onAddSafety}
        title="Add New Safety Feature"
        placeholder="Enter safety feature name"
      />
      
      <AddItemModal
        isOpen={showAddRoomType}
        onClose={() => setShowAddRoomType(false)}
        onAdd={onAddRoomType}
        title="Add New Room Type"
        placeholder="Enter room type name"
      />
      
      <AddItemModal
        isOpen={showAddPropertyType}
        onClose={() => setShowAddPropertyType(false)}
        onAdd={onAddPropertyType}
        title="Add New Property Type"
        placeholder="Enter property type name"
      />
    </div>
  );
};

/* ---------- Main Component ---------- */
const HostProperties = () => {
  const auth = useSelector((state) => state.auth);
  const hostId = auth?.id || auth?.user?.id || auth?.hostId || auth?.user?.hostId;
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Dropdown options for edit modal
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [safeties, setSafeties] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  
  const rows = useMemo(() => properties ?? [], [properties]);

  const handleView = (property) => {
    setSelectedProperty(property);
    setShowModal(true);
  }

  const handleEdit = (property) => {
    setSelectedProperty(property);
    setShowEditModal(true);
  }
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProperty(null);
  }
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedProperty(null);
  };

  const getHostProperties = async () => {
    if (!hostId) return;
    setLoading(true);
    setErrMsg("");
    try {
      const response = await propertyService.getHostProperties(hostId);
      setProperties(response?.data?.data || []);
    } catch (error) {
      console.error(error);
      setErrMsg("Failed to load properties.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [pt, a, f, s, rt] = await Promise.all([
        propertyService.getPropertyTypes(),
        propertyService.getAmenities(),
        propertyService.getFacilities(),
        propertyService.getSafeties(),
        propertyService.getRoomTypes(),
      ]);
      setPropertyTypes(pt?.data?.data || []);
      setAmenities(a?.data?.data || []);
      setFacilities(f?.data?.data || []);
      setSafeties(s?.data?.data || []);
      setRoomTypes(rt?.data?.data || []);
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
    }
  };

  const handleSaveProperty = async () => {
    getHostProperties(); // Just refresh the list
  };

  // Add item handlers
  const handleAddAmenity = async (name) => {
    const res = await propertyService.createAmenity({ name });
    const newAmenity = res?.data?.data;
    if (newAmenity) {
      setAmenities(p => [...p, newAmenity]);
    }
  };

  const handleAddFacility = async (name) => {
    const res = await propertyService.createFacility({ name });
    const newItem = res?.data?.data;
    if (newItem) {
      setFacilities(prev => [...prev, newItem]);
    }
  };

  const handleAddSafety = async (name) => {
    const res = await propertyService.createSafety({ name });
    const newItem = res?.data?.data;
    if (newItem) {
      setSafeties(prev => [...prev, newItem]);
    }
  };

  const handleAddRoomType = async (name) => {
    const res = await propertyService.createRoomType({ name });
    const newItem = res?.data?.data;
    if (newItem) {
      setRoomTypes(p => [...p, newItem]);
    }
  };

  const handleAddPropertyType = async (name) => {
    const res = await propertyService.createPropertyType({ name });
    const newItem = res?.data?.data;
    if (newItem) {
      setPropertyTypes(p => [...p, newItem]);
    }
  };

  const findRoomType = (id) => {
    const found = roomTypes.find((roomType) => roomType.id === id);
    return found ? found.name : "";
  };

  useEffect(() => {
    getHostProperties();
    fetchDropdownData();
  }, [hostId]);

  return (
    <>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Host Properties</h1>
        </div>

        {/* Table states */}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rooms</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {rows.map((p) => {
                    const city = p?.location?.address?.city || "—"
                    const roomsCount = p?._count?.rooms ?? p?.rooms?.length ?? 0
                    const cover = coverOf(p)
                    const rating = p?.avgRating ? Number(p.avgRating).toFixed(1) : "not yet"
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-16 bg-gray-100 rounded overflow-hidden border">
                              {cover ? (
                                <img src={cover} alt={p.title} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full grid place-items-center text-xs text-gray-400">No image</div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{p.title || "—"}</div>
                              <div className="text-xs text-gray-500 truncate max-w-xs">{p.description || "—"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                            {p?.propertyType?.name || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{roomsCount}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              p.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {p.status || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{rating}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(p.createdAt)}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="View details"
                              onClick={() => handleView(p)}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className="text-green-600 hover:text-green-800 p-1"
                              title="Edit"
                              onClick={() => handleEdit(p)}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      <PropertyDetailsModal
        property={selectedProperty}
        isOpen={showModal}
        onClose={handleCloseModal}
        onEdit={handleEdit}
      />

      <PropertyEditModal
        property={selectedProperty}
        isOpenEdit={showEditModal}
        onClose={handleCloseEditModal}
        onSave={handleSaveProperty}
        propertyTypes={propertyTypes}
        amenities={amenities}
        facilities={facilities}
        safeties={safeties}
        roomTypes={roomTypes}
        onAddAmenity={handleAddAmenity}
        onAddFacility={handleAddFacility}
        onAddSafety={handleAddSafety}
        onAddRoomType={handleAddRoomType}
        onAddPropertyType={handleAddPropertyType}
        findRoomType={findRoomType}
      />
    </>
  )
}

const MultiSelect = ({ options, selected, onChange, placeholder, onAddNew }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option) => {
    const isSelected = selected.some(item => 
      (typeof item === 'object' ? item.id : item) === (typeof option === 'object' ? option.id : option)
    );
    
    if (isSelected) {
      onChange(selected.filter(item => 
        (typeof item === 'object' ? item.id : item) !== (typeof option === 'object' ? option.id : option)
      ));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="relative">
      <div
        className="border border-gray-300 rounded-md p-2 min-h-[40px] cursor-pointer bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {selected.map((item, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
              >
                {typeof item === 'object' ? item.name : item}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
      </div>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {options.map((option) => {
            const isSelected = selected.some(item => 
              (typeof item === 'object' ? item.id : item) === (typeof option === 'object' ? option.id : option)
            );
            return (
              <div
                key={typeof option === 'object' ? option.id : option}
                className={`p-2 cursor-pointer hover:bg-gray-100 ${
                  isSelected ? 'bg-blue-50 text-blue-600' : ''
                }`}
                onClick={() => handleSelect(option)}
              >
                {typeof option === 'object' ? option.name : option}
              </div>
            );
          })}
          {onAddNew && (
            <div
              className="p-2 cursor-pointer hover:bg-gray-100 border-t border-gray-200 text-blue-600"
              onClick={() => {
                onAddNew();
                setIsOpen(false);
              }}
            >
              + Add New
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AddItemModal = ({ isOpen, onClose, onAdd, title, placeholder }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      setName('');
      onClose?.();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={placeholder}
            className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HostProperties;
