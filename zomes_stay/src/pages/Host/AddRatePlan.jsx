import React, { useState, useEffect ,useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Target, Home, Utensils, Users, Baby, User, Save, CheckCircle, AlertCircle, Edit, Trash2, Palette, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { roomtypeMealPlanService ,propertyRoomTypeService, mealPlanService } from '../../services';
import { useSelector } from 'react-redux';

const AddRatePlan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get data from location state or set defaults
  //const {propertyId } = location.state || {};
  const {property} = useSelector((state) => state.property);
  console.log("property",property)
  const propertyId = property?.id;

  
  const [ratePlanForm, setRatePlanForm] = useState({
    name: '',
    color: '#3B82F6' // Default blue
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [roomTypesMap, setRoomTypesMap] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  
  // Pricing grid state - stores pricing for each room type + meal plan combination
  const [pricingGrid, setPricingGrid] = useState({});
  const [existingDataMap, setExistingDataMap] = useState({});
  const [rowToggles, setRowToggles] = useState({}); // Track which rows are enabled
  
  // Predefined colors
  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  // Fetch existing data when component mounts


  const fetchRoomTypesMap = useCallback(async () => {
    try {
      const response = await propertyRoomTypeService.getPropertyRoomTypes(propertyId);
      const data = response.data;
      console.log("roomTypesMap",data)
      if (data) {
        setRoomTypesMap(data);
      } else {
        toast.error('Failed to load room types map');
      }
    } catch (error) {
      console.error('Error fetching room types map:', error);
      toast.error('Failed to load room types map');
    } finally {
      setInitialLoading(false);
    }
  }, [propertyId]);

  const fetchMealPlans = useCallback(async () => {
    try{
      const response = await mealPlanService.getMealPlans(propertyId);
      const data = response

      console.log("mealPlans",data)
      setMealPlans(data);
      
    }catch(error){
      console.error('Error fetching meal plans:', error);
      toast.error('Failed to load meal plans');
    }
  }, [propertyId]);



  const fetchExistingData = async () => {
    try {
      setLoading(true);
      const existingData = {};
      
      // Fetch existing PropertyRoomTypeMealPlan data
      for (const roomType of roomTypesMap) {
        try {
          const response = await roomtypeMealPlanService.getPropertyRoomTypeMealPlans(roomType.id);
          console.log(`Fetched data for room type ${roomType.id}:`, response);
          
          if (response && response.data && Array.isArray(response.data)) {
            existingData[roomType.id] = {};
            response.data.forEach(item => {
              console.log(`Mapping meal plan ${item.mealPlanId} for room type ${roomType.id}:`, item);
              existingData[roomType.id][item.mealPlanId] = item;
            });
          }
        } catch (roomTypeError) {
          console.error(`Error fetching data for room type ${roomType.id}:`, roomTypeError);
          // Continue with other room types even if one fails
        }
      }
      
      console.log('Final existing data:', existingData);
      setExistingDataMap(existingData);
      initializePricingGrid(existingData);
    } catch (error) {
      console.error('Error fetching existing data:', error);
      toast.error('Failed to load existing pricing data');
      // Initialize empty grid even if fetch fails
      initializePricingGrid({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!propertyId) {
      toast.error('Property ID not found. Please select a property first.');
      navigate('/host/base/inventory_management');
      return;
    }
    
    // Fetch room types and meal plans first
    fetchRoomTypesMap();
    fetchMealPlans();
  }, [propertyId, navigate, fetchRoomTypesMap, fetchMealPlans]);

  useEffect(() => {
    // Only fetch existing data when both room types and meal plans are loaded
    if (roomTypesMap.length > 0 && mealPlans.length > 0) {
      fetchExistingData();
    }
  }, [roomTypesMap, mealPlans]);  

  // Helper functions for row toggle management
  const getRowKey = (roomTypeId, mealPlanId) => `${roomTypeId}-${mealPlanId}`;
  
  const isRowEnabled = (roomTypeId, mealPlanId) => {
    return rowToggles[getRowKey(roomTypeId, mealPlanId)] || false;
  };
  
  const toggleRow = (roomTypeId, mealPlanId) => {
    const rowKey = getRowKey(roomTypeId, mealPlanId);
    setRowToggles(prev => ({
      ...prev,
      [rowKey]: !prev[rowKey]
    }));
  };


  const initializePricingGrid = (existingData = {}) => {
    const grid = {};
    
    console.log('Initializing pricing grid with data:', existingData);
    console.log('Room types:', roomTypesMap);
    console.log('Meal plans:', mealPlans);
    
    roomTypesMap.forEach(roomType => {
      grid[roomType.id] = {};
      mealPlans.forEach(mealPlan => {
        const existing = existingData[roomType.id]?.[mealPlan.id];
        console.log(`Initializing ${roomType.roomType?.name || roomType.id} + ${mealPlan.name}:`, existing);
        
        grid[roomType.id][mealPlan.id] = {
          singleOccupancyPrice: existing?.singleOccupancyPrice ? existing.singleOccupancyPrice.toString() : '',
          doubleOccupancyPrice: existing?.doubleOccupancyPrice ? existing.doubleOccupancyPrice.toString() : '',
          extraBedPriceAdult: existing?.extraBedPriceAdult ? existing.extraBedPriceAdult.toString() : '',
          extraBedPriceChild: existing?.extraBedPriceChild ? existing.extraBedPriceChild.toString() : '',
          extraBedPriceInfant: existing?.extraBedPriceInfant ? existing.extraBedPriceInfant.toString() : '0',
          groupOccupancyPrice: existing?.groupOccupancyPrice ? existing.groupOccupancyPrice.toString() : '',
          existingRecordId: existing?.id || null
        };
      });
    });
    
    console.log('Final pricing grid:', grid);
    setPricingGrid(grid);
  };

  const handleRatePlanFormChange = (field, value) => {
    setRatePlanForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePricingChange = (roomTypeId, mealPlanId, field, value) => {
    setPricingGrid(prev => ({
      ...prev,
      [roomTypeId]: {
        ...prev[roomTypeId],
        [mealPlanId]: {
          ...prev[roomTypeId][mealPlanId],
          [field]: value
        }
      }
    }));
  };



  const prepareRatePlanData = () => {
    const ratePlanData = {
      propertyId: propertyId,
      ratePlanName: ratePlanForm.name,
      ratePlanColor: ratePlanForm.color,
      roomTypeMealPlanCombinations: []
    };
      
      Object.keys(pricingGrid).forEach(roomTypeId => {
        Object.keys(pricingGrid[roomTypeId]).forEach(mealPlanId => {
          const pricing = pricingGrid[roomTypeId][mealPlanId];
          const isEnabled = isRowEnabled(roomTypeId, mealPlanId);
          
        // Only include enabled rows with pricing data
          if (isEnabled && (pricing.singleOccupancyPrice || pricing.doubleOccupancyPrice || 
              pricing.extraBedPriceAdult || pricing.extraBedPriceChild || pricing.groupOccupancyPrice)) {
            
            ratePlanData.roomTypeMealPlanCombinations.push({
              propertyRoomTypeId: roomTypeId,
              mealPlanId: mealPlanId,
              singleOccupancyPrice: parseFloat(pricing.singleOccupancyPrice) || 0,
              doubleOccupancyPrice: parseFloat(pricing.doubleOccupancyPrice) || 0,
              extraBedPriceAdult: parseFloat(pricing.extraBedPriceAdult) || 0,
              extraBedPriceChild: parseFloat(pricing.extraBedPriceChild) || 0,
              extraBedPriceInfant: parseFloat(pricing.extraBedPriceInfant) || 0,
              groupOccupancyPrice: parseFloat(pricing.groupOccupancyPrice) || 0,
              existingRecordId: pricing.existingRecordId || null
            });
          } 
        });
      });

    return ratePlanData;
  };


  const handleSaveBulk = async () => {
    if (!ratePlanForm.name.trim()) {
      toast.error('Please enter a rate plan name');
      return;
    }
    
    // Validate name and color uniqueness
    if (ratePlanForm.name.trim().length < 2) {
      toast.error('Rate plan name must be at least 2 characters long');
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare the bulk data
      const ratePlanData = prepareRatePlanData();
      
      // Check if there are any enabled combinations
      if (ratePlanData.roomTypeMealPlanCombinations.length === 0) {
        setErrorMessage('Please enable at least one rate combination to save.');
        setShowErrorModal(true);
        return;
      }
      
      console.log('Bulk rate plan data to save:', ratePlanData);
      
      // Single API call for bulk save
      await roomtypeMealPlanService.saveRatePlanBulk(ratePlanData);
      
      setSuccessMessage(`Rate plan "${ratePlanForm.name}" saved successfully!`);
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Error saving rate plan:', error);
      
      // Handle specific error messages from backend
      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
      setErrorMessage('Failed to save rate plan. Please try again.');
      }
      
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };



  const handleBack = () => {
    navigate('/host/base/inventory_management');
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate('/host/base/inventory_management');
  };



  // Show loading screen while initializing
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rate plan data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBack}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <Target className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Add Rate Plan</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="space-y-4">
          {/* Rate Plan Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-md font-semibold text-gray-900 mb-3">Rate Plan Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate Plan Name *
                </label>
                <input
                  type="text"
                  value={ratePlanForm.name}
                  onChange={(e) => handleRatePlanFormChange('name', e.target.value)}
                  placeholder="e.g., Best Available Rate, Weekend Special"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color *
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <input
                      type="color"
                      value={ratePlanForm.color}
                      onChange={(e) => handleRatePlanFormChange('color', e.target.value)}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleRatePlanFormChange('color', color)}
                        className={`w-5 h-5 rounded-full border transition-all ${
                          ratePlanForm.color === color ? 'border-gray-400 scale-110' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-md font-semibold text-gray-900">Pricing Grid</h2>
                {loading && (
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    <span>Loading existing rates...</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="overflow-auto max-h-96">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Room Category
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Meal Plan
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Occupancy
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pricing Details
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking per-wider w-32">
                      Enable/Disable
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roomTypesMap.map((roomType) => 
                    mealPlans.map((mealPlan) => (
                      <tr key={`${roomType.id}-${mealPlan.id}`} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          {roomType.roomType?.name || 'Unknown'}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-600 w-32">
                          {mealPlan.name}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-600 w-20">
                          All Prices
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex flex-wrap gap-2">
                            {/* Single */}
                            <div className="flex flex-col items-center">
                              <label className="text-xs text-gray-500 mb-1">Single Occupancy</label>
                              <input
                                type="number"
                                value={pricingGrid[roomType.id]?.[mealPlan.id]?.singleOccupancyPrice || ''}
                                onChange={(e) => handlePricingChange(roomType.id, mealPlan.id, 'singleOccupancyPrice', e.target.value)}
                                placeholder="0"
                                disabled={!isRowEnabled(roomType.id, mealPlan.id)}
                                className={`w-16 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                  pricingGrid[roomType.id]?.[mealPlan.id]?.existingRecordId 
                                    ? 'border-green-300 bg-green-50' 
                                    : 'border-gray-300'
                                } ${!isRowEnabled(roomType.id, mealPlan.id) ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                                title={isRowEnabled(roomType.id, mealPlan.id) ? "Price for single occupancy (1 guest)" : "Enable row toggle to modify rates"}
                              />
                            </div>
                            
                            {/* Double */}
                            <div className="flex flex-col items-center">
                              <label className="text-xs text-gray-500 mb-1">Double Occupancy</label>
                              <input
                                type="number"
                                value={pricingGrid[roomType.id]?.[mealPlan.id]?.doubleOccupancyPrice || ''}
                                onChange={(e) => handlePricingChange(roomType.id, mealPlan.id, 'doubleOccupancyPrice', e.target.value)}
                                placeholder="0"
                                disabled={!isRowEnabled(roomType.id, mealPlan.id)}
                                className={`w-16 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                  pricingGrid[roomType.id]?.[mealPlan.id]?.existingRecordId 
                                    ? 'border-green-300 bg-green-50' 
                                    : 'border-gray-300'
                                } ${!isRowEnabled(roomType.id, mealPlan.id) ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                                title={isRowEnabled(roomType.id, mealPlan.id) ? "Price for double occupancy (2 guests)" : "Enable row toggle to modify rates"}
                              />
                            </div>
                            
                            {/* Extra Person */}
                            <div className="flex flex-col items-center">
                              <label className="text-xs text-gray-500 mb-1">Extra Adult</label>
                              <input
                                type="number"
                                value={pricingGrid[roomType.id]?.[mealPlan.id]?.extraBedPriceAdult || ''}
                                onChange={(e) => handlePricingChange(roomType.id, mealPlan.id, 'extraBedPriceAdult', e.target.value)}
                                placeholder="0"
                                disabled={!isRowEnabled(roomType.id, mealPlan.id)}
                                className={`w-16 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                  pricingGrid[roomType.id]?.[mealPlan.id]?.existingRecordId 
                                    ? 'border-green-300 bg-green-50' 
                                    : 'border-gray-300'
                                } ${!isRowEnabled(roomType.id, mealPlan.id) ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                                title={isRowEnabled(roomType.id, mealPlan.id) ? "Additional price for extra adult guest" : "Enable row toggle to modify rates"}
                              />
                            </div>
                            
                            {/* Extra Child */}
                            <div className="flex flex-col items-center">
                              <label className="text-xs text-gray-500 mb-1">Extra Child</label>
                              <input
                                type="number"
                                value={pricingGrid[roomType.id]?.[mealPlan.id]?.extraBedPriceChild || ''}
                                onChange={(e) => handlePricingChange(roomType.id, mealPlan.id, 'extraBedPriceChild', e.target.value)}
                                placeholder="0"
                                disabled={!isRowEnabled(roomType.id, mealPlan.id)}
                                className={`w-16 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                  pricingGrid[roomType.id]?.[mealPlan.id]?.existingRecordId 
                                    ? 'border-green-300 bg-green-50' 
                                    : 'border-gray-300'
                                } ${!isRowEnabled(roomType.id, mealPlan.id) ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                                title={isRowEnabled(roomType.id, mealPlan.id) ? "Additional price for extra child guest" : "Enable row toggle to modify rates"}
                              />
                            </div>
                            
                            {/* Group (if room occupancy > 2) */}
                            {roomType.Occupancy > 2 && (
                              <div className="flex flex-col items-center">
                                <label className="text-xs text-gray-500 mb-1">Group Rate({roomType.Occupancy})</label>
                                <input
                                  type="number"
                                  value={pricingGrid[roomType.id]?.[mealPlan.id]?.groupOccupancyPrice || ''}
                                  onChange={(e) => handlePricingChange(roomType.id, mealPlan.id, 'groupOccupancyPrice', e.target.value)}
                                  placeholder="0"
                                  disabled={!isRowEnabled(roomType.id, mealPlan.id)}
                                  className={`w-16 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                    pricingGrid[roomType.id]?.[mealPlan.id]?.existingRecordId 
                                      ? 'border-green-300 bg-green-50' 
                                      : 'border-gray-300'
                                  } ${!isRowEnabled(roomType.id, mealPlan.id) ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                                  title={isRowEnabled(roomType.id, mealPlan.id) ? `Group rate for ${roomType.Occupancy}+ guests` : "Enable row toggle to modify rates"}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => toggleRow(roomType.id, mealPlan.id)}
                                className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                  isRowEnabled(roomType.id, mealPlan.id) ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                                title={isRowEnabled(roomType.id, mealPlan.id) ? "Disable row" : "Enable row"}
                              >
                                <span
                                  className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                                    isRowEnabled(roomType.id, mealPlan.id) ? 'translate-x-3.5' : 'translate-x-0.5'
                                  }`}
                                />
                              </button>
                              <span className={`text-xs ${isRowEnabled(roomType.id, mealPlan.id) ? 'text-blue-600' : 'text-gray-400'}`}>
                                {isRowEnabled(roomType.id, mealPlan.id) ? 'ON' : 'OFF'}
                              </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleBack}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveBulk}
              disabled={loading || !ratePlanForm.name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 text-sm"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-3 w-3" />
                  <span>Save Rate Plan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Success!</h3>
            </div>
            <p className="text-gray-600 mb-6">{successMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={handleSuccessClose}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Error</h3>
            </div>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddRatePlan;
