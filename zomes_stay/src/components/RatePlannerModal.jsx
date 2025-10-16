import React, { useState, useEffect } from 'react';
import { X, Target, Home, Utensils, Users, Baby, User, Save, CheckCircle, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { roomtypeMealPlanService } from '../services';

const RatePlannerModal = ({ isOpen, onClose, roomTypesMap = [], mealPlans = [], onSave, propertyId }) => {
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [rateMatrix, setRateMatrix] = useState({});
  const [mealPlanKeyMapping, setMealPlanKeyMapping] = useState({}); // Maps unique keys to actual meal plan IDs
  const [existingDataMap, setExistingDataMap] = useState({}); // Stores existing PropertyRoomTypeMealPlan data
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
console.log("mealPlans",mealPlans)
console.log("roomTypesMap", roomTypesMap)
console.log("roomTypesMap structure check:", roomTypesMap.map(rt => ({
  id: rt.id,
  Occupancy: rt.Occupancy,
  maxOccupancy: rt.maxOccupancy,
  minOccupancy: rt.minOccupancy,
  extraBedCapacity: rt.extraBedCapacity,
  roomType: rt.roomType
})))
  // Initialize rate matrix when modal opens
  useEffect(() => {
    if (isOpen && roomTypesMap.length > 0 && mealPlans.length > 0) {
      const initialMatrix = {};
      const keyMapping = {};
      
      roomTypesMap.forEach(roomType => {
        initialMatrix[roomType.id] = {};
        mealPlans.forEach((mealPlan, index) => {
          // Use a unique key for each meal plan to avoid conflicts
          const mealPlanKey = mealPlan.value || `mealPlan_${index}`;
          const actualMealPlanId = mealPlan.value || mealPlan.id || `mealPlan_${index}`;
          
          console.log('Initializing for roomType:', roomType.id, 'mealPlanKey:', mealPlanKey, 'actualId:', actualMealPlanId, mealPlan);
          
          // Store the mapping from unique key to actual meal plan ID
          keyMapping[mealPlanKey] = actualMealPlanId;
          
          // Check if we have existing data for this combination
          const existingData = existingDataMap[roomType.id]?.[actualMealPlanId];
          
          initialMatrix[roomType.id][mealPlanKey] = {
            // Use existing data if available, otherwise use empty defaults
            groupOccupancyPrice: existingData?.groupOccupancyPrice || '',
            doubleOccupancyPrice: existingData?.doubleOccupancyPrice || '',
            singleOccupancyPrice: existingData?.singleOccupancyPrice || '',
            extraBedPriceAdult: existingData?.extraBedPriceAdult || '',
            extraBedPriceChild: existingData?.extraBedPriceChild || '',
            extraBedPriceInfant: existingData?.extraBedPriceInfant || '0',
            // Store the existing record ID if it exists
            existingRecordId: existingData?.id || null
          };
        });
      });
      
      console.log('Initial matrix created with existing data:', initialMatrix);
      console.log('Key mapping created:', keyMapping);
      setRateMatrix(initialMatrix);
      setMealPlanKeyMapping(keyMapping);
      setSelectedRoomType(roomTypesMap[0].id);
    }
  }, [isOpen, roomTypesMap, mealPlans, existingDataMap]);

  const handleInputChange = (roomTypeId, mealPlan, field, value) => {
    console.log('handleInputChange called with:', { roomTypeId, mealPlan, field, value });
    console.log('Current rateMatrix before update:', rateMatrix);
    
    setRateMatrix(prev => {
      // Create a completely new object to avoid any reference issues
      const newMatrix = JSON.parse(JSON.stringify(prev));
      
      // Ensure roomTypeId exists in the matrix
      if (!newMatrix[roomTypeId]) {
        newMatrix[roomTypeId] = {};
      }
      
      // Ensure mealPlan exists for this roomType
      if (!newMatrix[roomTypeId][mealPlan]) {
        newMatrix[roomTypeId][mealPlan] = {
          groupOccupancyPrice: '',
            doubleOccupancyPrice: '',
            singleOccupancyPrice: '',
            extraBedPriceAdult: '',
            extraBedPriceChild: '',
            extraBedPriceInfant: '0'
          };
      }
      
      // Update the specific field while preserving existing record ID
      newMatrix[roomTypeId][mealPlan] = {
        ...newMatrix[roomTypeId][mealPlan],
          [field]: value
      };
      
      console.log('Updated matrix:', newMatrix);
      console.log('Specific update for', roomTypeId, mealPlan, field, '=', value);
      return newMatrix;
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Convert matrix to flat array format
      const ratePlans = [];
      Object.keys(rateMatrix).forEach(roomTypeId => {
        Object.keys(rateMatrix[roomTypeId]).forEach(mealPlanKey => {
          const plan = rateMatrix[roomTypeId][mealPlanKey];
          // Only include plans that have at least one price filled
          if (plan.groupOccupancyPrice || plan.doubleOccupancyPrice || plan.singleOccupancyPrice || 
              plan.extraBedPriceAdult || plan.extraBedPriceChild) {
            
            // Get the actual meal plan ID from the mapping
            const actualMealPlanId = mealPlanKeyMapping[mealPlanKey] || mealPlanKey;
            
            console.log('Saving rate plan - roomType:', roomTypeId, 'mealPlanKey:', mealPlanKey, 'actualId:', actualMealPlanId);
            
            ratePlans.push({
              propertyRoomTypeId: roomTypeId,
              mealPlan: actualMealPlanId, // Use the actual meal plan ID, not the unique key
              groupOccupancyPrice: plan.groupOccupancyPrice || 0,
              doubleOccupancyPrice: plan.doubleOccupancyPrice || 0,
              singleOccupancyPrice: plan.singleOccupancyPrice || 0,
              extraBedPriceAdult: plan.extraBedPriceAdult || 0,
              extraBedPriceChild: plan.extraBedPriceChild || 0,
              extraBedPriceInfant: plan.extraBedPriceInfant || 0
            });
          }
        });
      });

      if (ratePlans.length === 0) {
        setErrorMessage('Please configure at least one rate plan before saving.');
        setShowErrorModal(true);
        return;
      }

      // Call the API
      const response = await roomtypeMealPlanService.savePropertyRoomTypeMealPlans({
        propertyId,
        ratePlans
      });

      if (response.data.success) {
        setSuccessMessage(`Successfully saved ${response.data.data.savedCount} rate plan(s)!`);
        setShowSuccessModal(true);
        
        // Call the onSave callback if provided
        if (onSave) {
          await onSave(ratePlans);
        }
        
        // Close modal after a short delay
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to save rate plans');
      }
    } catch (error) {
      console.error('Error saving rate plans:', error);
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to save rate plans. Please try again.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (roomTypeId, mealPlanKey) => {
    setLoading(true);
    try {
      const plan = rateMatrix[roomTypeId][mealPlanKey];
      const actualMealPlanId = mealPlanKeyMapping[mealPlanKey];
      
      if (!plan.existingRecordId) {
        setErrorMessage('No existing record found to update.');
        setShowErrorModal(true);
        return;
      }

      // Validate that at least one price is provided
      if (!plan.groupOccupancyPrice && !plan.doubleOccupancyPrice && !plan.singleOccupancyPrice && 
          !plan.extraBedPriceAdult && !plan.extraBedPriceChild) {
        setErrorMessage('At least one price must be provided for the rate plan.');
        setShowErrorModal(true);
        return;
      }

      // Use the existing save logic for this single combination
      const ratePlans = [{
        propertyRoomTypeId: roomTypeId,
        mealPlan: actualMealPlanId,
        groupOccupancyPrice: plan.groupOccupancyPrice || 0,
        doubleOccupancyPrice: plan.doubleOccupancyPrice || 0,
        singleOccupancyPrice: plan.singleOccupancyPrice || 0,
        extraBedPriceAdult: plan.extraBedPriceAdult || 0,
        extraBedPriceChild: plan.extraBedPriceChild || 0,
        extraBedPriceInfant: plan.extraBedPriceInfant || 0
      }];

      console.log('Updating single rate plan:', ratePlans);

      // Call the existing save API (which uses upsert, so it will update)
      const response = await roomtypeMealPlanService.savePropertyRoomTypeMealPlans({
        propertyId,
        ratePlans
      });

      if (response.data.success) {
        setSuccessMessage('Rate plan updated successfully!');
        setShowSuccessModal(true);
        // Refresh the data
        await fetchPropertyRoomTypeMealPlans();
      } else {
        throw new Error(response.data.message || 'Failed to update rate plan');
      }
    } catch (error) {
      console.error('Error updating rate plan:', error);
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to update rate plan. Please try again.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roomTypeId, mealPlanKey) => {
    try {
      const plan = rateMatrix[roomTypeId][mealPlanKey];
      
      if (!plan.existingRecordId) {
        setErrorMessage('No existing record found to delete.');
        setShowErrorModal(true);
        return;
      }

      console.log('Deleting record:', plan.existingRecordId);
      
      // Call the existing delete function
      const response = await deletePropertyRoomTypeMealPlan(plan.existingRecordId);
      
      if (response.data.success) {
        setSuccessMessage('Rate plan deleted successfully!');
        setShowSuccessModal(true);
        
        // Clear the form data for this combination
        setRateMatrix(prev => ({
          ...prev,
          [roomTypeId]: {
            ...prev[roomTypeId],
            [mealPlanKey]: {
              groupOccupancyPrice: '',
              doubleOccupancyPrice: '',
              singleOccupancyPrice: '',
              extraBedPriceAdult: '',
              extraBedPriceChild: '',
              extraBedPriceInfant: '0',
              existingRecordId: null
            }
          }
        }));
        
        // Refresh the data
        await fetchPropertyRoomTypeMealPlans();
      } else {
        throw new Error(response.data.message || 'Failed to delete rate plan');
      }
    } catch (error) {
      console.error('Error deleting rate plan:', error);
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to delete rate plan. Please try again.');
      setShowErrorModal(true);
    }
  };

  const fetchPropertyRoomTypeMealPlans = async () => {
    try{
      const response = await roomtypeMealPlanService.getPropertyRoomTypeMealPlans(propertyId);
      const data = response.data; 
      console.log("Fetched existing data:", data);
      
      // Create a mapping of existing data
      const existingDataMap = {};
      data.data.forEach(item => {
        const roomTypeId = item.propertyRoomTypeId;
        const mealPlanId = item.mealPlanId;
        
        if (!existingDataMap[roomTypeId]) {
          existingDataMap[roomTypeId] = {};
        }
        
        existingDataMap[roomTypeId][mealPlanId] = {
          id: item.id, // Store the PropertyRoomTypeMealPlan ID for updates/deletes
          groupOccupancyPrice: item.groupOccupancyPrice || '',
          doubleOccupancyPrice: item.doubleOccupancyPrice || '',
          singleOccupancyPrice: item.singleOccupancyPrice || '',
          extraBedPriceAdult: item.extraBedPriceAdult || '',
          extraBedPriceChild: item.extraBedPriceChild || '',
          extraBedPriceInfant: item.extraBedPriceInfant || '0'
        };
      });
      
      console.log("Existing data map:", existingDataMap);
      setExistingDataMap(existingDataMap);
      
    }catch(error){
      console.error('Error fetching property room type meal plans:', error);
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to fetch property room type meal plans. Please try again.');
      setShowErrorModal(true);
    }
  };

  const deletePropertyRoomTypeMealPlan = async (id) => {
    try{
      const response = await roomtypeMealPlanService.deletePropertyRoomTypeMealPlan(id);
      const data = response.data;
      console.log("Deleted data:", data);
      return response; // Return the response so it can be used in handleDelete
    }catch(error){
      console.error('Error deleting property room type meal plan:', error);
      throw error; // Re-throw the error so it can be caught in handleDelete
    }
  };

  useEffect(() => {
    fetchPropertyRoomTypeMealPlans();
  }, []);


 

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Rate Planner Matrix</h2>
                <p className="text-sm text-gray-600">Set pricing for all room types and meal plan combinations</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Sidebar - Room Types */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Types</h3>
            <div className="space-y-2">
              {roomTypesMap.map((roomType) => (
                <button
                  key={roomType.id}
                  onClick={() => setSelectedRoomType(roomType.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedRoomType === roomType.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Home className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{roomType.roomType?.name || 'Unknown'}</div>
                      <div className="text-xs opacity-75">
                        {Object.keys(rateMatrix[roomType.id] || {}).filter(mealPlan => {
                          const plan = rateMatrix[roomType.id]?.[mealPlan];
                          return plan?.groupOccupancyPrice || plan?.doubleOccupancyPrice || plan?.singleOccupancyPrice;
                        }).length} / {mealPlans?.length || 0} plans
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content - Meal Plans Matrix */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedRoomType ? (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {roomTypesMap.find(rt => rt.id === selectedRoomType)?.roomType?.name || 'Unknown Room Type'}
                  </h3>
                  <p className="text-sm text-gray-600">Configure pricing for different meal plans</p>
                </div>

                <div className="space-y-6">
                  {mealPlans?.length > 0 ? mealPlans.map((mealPlan, index) => {
                    const mealPlanKey = mealPlan.value || `mealPlan_${index}`;
                    const actualMealPlanId = mealPlan.value || mealPlan.id || `mealPlan_${index}`;
                    const currentPlan = rateMatrix[selectedRoomType]?.[mealPlanKey] || {};
                    console.log('Rendering meal plan:', mealPlanKey, 'actualId:', actualMealPlanId, 'for room type:', selectedRoomType, 'current plan:', currentPlan);
                    return (
                      <div key={mealPlanKey} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white rounded-lg border border-gray-200">
                              <Utensils className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{mealPlan.name}</h4>
                              <p className="text-sm text-gray-600">{mealPlan.description}</p>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {currentPlan.groupOccupancyPrice || currentPlan.doubleOccupancyPrice || currentPlan.singleOccupancyPrice ? 'Configured' : 'Not set'}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Main Pricing */}
                          <div className="space-y-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-3">Room Pricing</h5>
                            <div className="grid grid-cols-2 gap-4">
                              {/* Group Occupancy - Show when room occupancy > 2 */}
                              {(() => {
                                const roomType = roomTypesMap.find(rt => rt.id === selectedRoomType);
                                console.log(roomType)
                                // Try multiple possible field names for occupancy
                                const roomOccupancy = roomType?.Occupancy || roomType?.occupancy || roomType?.roomType?.Occupancy || 2;
                               
                                console.log('Debug Group Occupancy:', {
                                  selectedRoomType,
                                  roomType,
                                  roomOccupancy,
                                  shouldShow: roomOccupancy > 2,
                                  allFields: Object.keys(roomType || {})
                                });
                                
                                if (roomOccupancy > 2) {
                                  return (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <div className="flex items-center space-x-2">
                                          <Users className="h-4 w-4 text-gray-500" />
                                          <span>Group Occupancy ({roomOccupancy})</span>
                                        </div>
                                      </label>
                                      <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                                        <input
                                          type="number"
                                          min="0"
                                          value={currentPlan.groupOccupancyPrice || ''}
                                          onChange={(e) => handleInputChange(selectedRoomType, mealPlanKey, 'groupOccupancyPrice', e.target.value)}
                                          placeholder="0"
                                          className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          key={`${selectedRoomType}-${mealPlanKey}-groupOccupancyPrice`}
                                        />
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  <div className="flex items-center space-x-2">
                                    <Users className="h-4 w-4 text-gray-500" />
                                    <span>Double Occupancy</span>
                                  </div>
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={currentPlan.doubleOccupancyPrice || ''}
                                    onChange={(e) => handleInputChange(selectedRoomType, mealPlanKey, 'doubleOccupancyPrice', e.target.value)}
                                    placeholder="0"
                                    className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    key={`${selectedRoomType}-${mealPlanKey}-doubleOccupancyPrice`}
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  <div className="flex items-center space-x-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                    <span>Single Occupancy</span>
                                  </div>
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={currentPlan.singleOccupancyPrice || ''}
                                    onChange={(e) => handleInputChange(selectedRoomType, mealPlanKey, 'singleOccupancyPrice', e.target.value)}
                                    placeholder="0"
                                    className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    key={`${selectedRoomType}-${mealPlanKey}-singleOccupancyPrice`}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Extra Bed Pricing */}
                          <div className="space-y-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-3">Extra Bed Pricing</h5>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-2">
                                  <div className="flex items-center space-x-1">
                                    <User className="h-3 w-3 text-gray-500" />
                                    <span>Adult</span>
                                  </div>
                                </label>
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={currentPlan.extraBedPriceAdult || ''}
                                    onChange={(e) => handleInputChange(selectedRoomType, mealPlanKey, 'extraBedPriceAdult', e.target.value)}
                                    placeholder="0"
                                    className="w-full pl-6 pr-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    key={`${selectedRoomType}-${mealPlanKey}-extraBedPriceAdult`}
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-2">
                                  <div className="flex items-center space-x-1">
                                    <Baby className="h-3 w-3 text-gray-500" />
                                    <span>Child</span>
                                  </div>
                                </label>
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={currentPlan.extraBedPriceChild || ''}
                                    onChange={(e) => handleInputChange(selectedRoomType, mealPlanKey, 'extraBedPriceChild', e.target.value)}
                                    placeholder="0"
                                    className="w-full pl-6 pr-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    key={`${selectedRoomType}-${mealPlanKey}-extraBedPriceChild`}
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-2">
                                  <div className="flex items-center space-x-1">
                                    <Baby className="h-3 w-3 text-gray-500" />
                                    <span>Infant</span>
                                  </div>
                                </label>
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={currentPlan.extraBedPriceInfant || '0'}
                                    onChange={(e) => handleInputChange(selectedRoomType, mealPlanKey, 'extraBedPriceInfant', e.target.value)}
                                    placeholder="0"
                                    className="w-full pl-6 pr-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    key={`${selectedRoomType}-${mealPlanKey}-extraBedPriceInfant`}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Update and Delete Buttons for Existing Records */}
                        {currentPlan.existingRecordId && (
                          <div className="mt-6 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-end space-x-3">
                              <button
                                onClick={() => handleUpdate(selectedRoomType, mealPlanKey)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                              >
                                <Edit className="h-4 w-4" />
                                <span>Update</span>
                              </button>
                              <button
                                onClick={() => handleDelete(selectedRoomType, mealPlanKey)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }) : (
                    <div className="text-center py-8">
                      <Utensils className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">No meal plans available</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Home className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Select a room type to configure pricing</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedRoomType ? 
                `${Object.keys(rateMatrix[selectedRoomType] || {}).filter(mealPlan => {
                  const plan = rateMatrix[selectedRoomType]?.[mealPlan];
                  return plan?.groupOccupancyPrice || plan?.doubleOccupancyPrice || plan?.singleOccupancyPrice;
                }).length} / ${mealPlans?.length || 0} meal plans configured for selected room type` 
                : 'Select a room type to configure pricing'
              }
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save All Rate Plans
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Success!</h3>
                <p className="text-sm text-gray-600">{successMessage}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Error</h3>
                <p className="text-sm text-gray-600">{errorMessage}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RatePlannerModal;
