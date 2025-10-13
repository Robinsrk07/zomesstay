import React, { useMemo, useState } from "react";
import { validateAndPriceBooking, priceMealPlans, combineTotalsWithMeals } from "../utils/bookingCapacityPricing";
import { Users, BedDouble, Plus, Minus, Check, Utensils, Coffee, Heart } from "lucide-react";

// Robust decimal parser to handle Prisma Decimal, string, or number
const parseDecimal = (v) => {
  if (v == null) return 0;
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }
  if (typeof v === 'object') {
    try {
      if (typeof v.toNumber === 'function') return v.toNumber();
      const val = v.valueOf?.();
      const n = parseFloat(val);
      return isNaN(n) ? 0 : n;
    } catch {
      return 0;
    }
  }
  return 0;
};

export default function RoomSection({
  propertyDetails,
  selectedRooms = [],
  toggleRoomSelection,
  updateRoomMealPlan,
  updateRoomExtraBeds,
  calculateTotalPrice,
  range,
  party = { adults: 0, childrenBed: 0, childrenNoBed: 0, infantsBed: 0, infantsNoBed: 0 },
  onProceed,
}) {
  if (!propertyDetails) {
    return null;
  }


  console.log('Property Details in RoomSection:', propertyDetails);
  const roomTypes = Array.isArray(propertyDetails.roomTypes) ? propertyDetails.roomTypes : [];

  const nights = range?.start && range?.end
    ? Math.ceil(Math.abs(range.end - range.start) / (1000 * 60 * 60 * 24))
    : 0;

  const [typeCounts, setTypeCounts] = useState({});
  const [adultsLocal, setAdultsLocal] = useState(() => (party?.adults ?? 2));

  const incCount = (id, max) => setTypeCounts(prev => ({ ...prev, [id]: Math.min((prev[id] || 0) + 1, max) }));
  const decCount = (id) => setTypeCounts(prev => ({ ...prev, [id]: Math.max((prev[id] || 0) - 1, 0) }));

  const builtRooms = useMemo(() => {
    const arr = [];
    roomTypes.forEach(rt => {
      const count = typeCounts[rt.id] || 0;
      for (let i = 0; i < count; i++) {
        const pr = rt.propertyRoomType || rt.PropertyRoomType || (Array.isArray(rt.propertyRoomTypes) ? rt.propertyRoomTypes[0] : undefined) || (Array.isArray(rt.PropertyRoomTypes) ? rt.PropertyRoomTypes[0] : undefined) || {};
        arr.push({
          id: `${rt.id}#${i + 1}`,
          roomTypeId: rt.id,
          occupancy: Number(pr.Occupancy ?? pr.occupancy ?? rt.Occupancy ?? rt.occupancy ?? 0),
          extraBedCapacity: Number(pr.extraBedCapacity ?? rt.extraBedCapacity ?? 0),
          basePrice: parseDecimal(pr.basePrice ?? rt.basePrice ?? 0),
          singleOccupancyPrice: parseDecimal(pr.singleOccupancyPrice ?? pr.singleoccupancyprice ?? rt.singleOccupancyPrice ?? rt.singleoccupancyprice ?? pr.basePrice ?? rt.basePrice ?? 0),
          extraBedPriceAdult: parseDecimal(pr.extraBedPriceAdult ?? pr.extraBedPrice ?? rt.extraBedPriceAdult ?? rt.extraBedPrice ?? 0),
          extraBedPriceChild: parseDecimal(pr.extraBedPriceChild ?? rt.extraBedPriceChild ?? 0),
          extraBedPriceInfant: parseDecimal(pr.extraBedPriceInfant ?? rt.extraBedPriceInfant ?? 0),
          _roomType: rt,
        });
      }
    });
    return arr;
  }, [roomTypes, typeCounts]);

  const computedParty = useMemo(() => ({
    adults: adultsLocal,
    childrenBed: 0,
    childrenNoBed: 0,
    infantsBed: 0,
    infantsNoBed: 0,
  }), [adultsLocal]);

  const validation = useMemo(() => {
    if (!builtRooms.length || nights <= 0 || !range?.start || !range?.end) {
      return null;
    }
    return validateAndPriceBooking({
      rooms: builtRooms,
      party: computedParty,
      nights,
    });
  }, [builtRooms, computedParty, nights, range]);

  const roomPriceMap = useMemo(() => {
    const m = new Map();
    builtRooms.forEach((r) => m.set(r.id, r));
    return m;
  }, [builtRooms]);

  // Build meal pricing map per roomType and default selections
  const { mealPricingByRoomType, defaultMealPlanIdByRoomType } = useMemo(() => {
    const m = {};
    const defaults = {};
    roomTypes.forEach((rt) => {
      const plans = {};
      const base = rt.baseMealPlan || null;
      const links = Array.isArray(rt.mealPlanLinks) ? rt.mealPlanLinks : [];

      // If baseMealPlan exists, delta mode: link.adultPrice/childPrice are add-on deltas; fallback to plan - base
      // If not, absolute mode: use link.adultPrice/childPrice or plan's absolute prices
      links.forEach((link) => {
        const plan = link.mealPlan || {};
        const planId = plan.id || link.mealPlanId || link.id;
        if (!planId) return;
        const adultBase = parseDecimal(plan.adult_price);
        const childBase = parseDecimal(plan.child_price);
        const adultLink = parseDecimal(link.adultPrice);
        const childLink = parseDecimal(link.childPrice);

        if (base) {
          const baseAdult = parseDecimal(base.adult_price);
          const baseChild = parseDecimal(base.child_price);
          const deltaAdult = adultLink || Math.max(0, adultBase - baseAdult);
          const deltaChild = childLink || Math.max(0, childBase - baseChild);
          plans[planId] = { mode: 'delta', adult: deltaAdult, child: deltaChild, name: plan.name, description: plan.description };
        } else {
          const absAdult = adultLink || adultBase;
          const absChild = childLink || childBase;
          plans[planId] = { mode: 'absolute', adult: absAdult, child: absChild, name: plan.name, description: plan.description };
        }
      });

      // Default selection: base plan if available; else if an EP/NP like child=0/adult=0 exists; else first
      let defaultId = null;
      if (base) defaultId = base.id;
      else {
        const zeroPlan = Object.entries(plans).find(([,v]) => (v.adult || 0) === 0 && (v.child || 0) === 0);
        defaultId = zeroPlan ? zeroPlan[0] : Object.keys(plans)[0] || null;
      }

      if (Object.keys(plans).length > 0) {
        m[rt.id] = { plans };
        defaults[rt.id] = defaultId;
      }
    });
    return { mealPricingByRoomType: m, defaultMealPlanIdByRoomType: defaults };
  }, [roomTypes]);

  const [mealSelectionByRoomId, setMealSelectionByRoomId] = useState({});

  // Auto-assign default meal plan when rooms are added or room counts change
  useMemo(() => {
    const next = { ...mealSelectionByRoomId };
    builtRooms.forEach((r) => {
      const rtId = r.roomTypeId;
      if (!next[r.id]) {
        const def = defaultMealPlanIdByRoomType[rtId];
        if (def) next[r.id] = def;
      }
    });
    const changed = JSON.stringify(next) !== JSON.stringify(mealSelectionByRoomId);
    if (changed) setMealSelectionByRoomId(next);
    // We intentionally ignore set in deps to avoid loop; run when builtRooms or defaults change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builtRooms, defaultMealPlanIdByRoomType]);

  // Compute pricing with beds + meals
  const combinedTotals = useMemo(() => {
    if (!validation || !validation.ok) return null;
    const meals = priceMealPlans({
      assignments: validation.assignment,
      rooms: builtRooms,
      mealSelections: mealSelectionByRoomId,
      mealPricingByRoomType,
      nights,
    });
    return combineTotalsWithMeals(validation.totals, meals);
  }, [validation, builtRooms, mealSelectionByRoomId, mealPricingByRoomType, nights]);

  return (
    <section className="px-4 md:px-10 py-6">
      <h2 className="text-2xl font-bold mb-4">Choose your room {roomTypes.length ? `(${roomTypes.length} type${roomTypes.length > 1 ? 's' : ''})` : ''}</h2>

      <div className="mb-4 p-4 bg-white rounded-lg border flex items-center justify-between">
        <div className="text-sm font-medium">Adults</div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setAdultsLocal(Math.max(0, adultsLocal - 1))} className="w-8 h-8 rounded-full border flex items-center justify-center"><Minus size={16} /></button>
          <span className="w-10 text-center font-semibold">{adultsLocal}</span>
          <button type="button" onClick={() => setAdultsLocal(adultsLocal + 1)} className="w-8 h-8 rounded-full border flex items-center justify-center"><Plus size={16} /></button>
        </div>
      </div>

      {/* Enhanced Room Types List */}
      <div className="space-y-6">
        {roomTypes.map((rt) => (
          <div key={rt.id} className="border rounded-xl bg-white shadow-sm overflow-hidden">
            {/* Room Type Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {rt.name || rt.title || rt.typeName || 'Room type'}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-blue-600" />
                      <span className="font-medium">{(rt?.propertyRoomType?.Occupancy ?? rt.Occupancy ?? rt.occupancy ?? 0)} guests</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BedDouble size={16} className="text-green-600" />
                      <span>+{(rt?.propertyRoomType?.extraBedCapacity ?? rt.extraBedCapacity ?? 0)} extra bed(s)</span>
                    </div>
                  </div>
                  {(rt?.propertyRoomType?.basePrice ?? rt.basePrice) ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        ₹{Number(rt?.propertyRoomType?.basePrice ?? rt.basePrice).toLocaleString('en-IN')}
                      </span>
                      <span className="text-sm text-gray-600">per night</span>
                      {nights > 0 && (
                        <span className="text-sm text-blue-600 font-medium">
                          ({nights} night{nights > 1 ? 's' : ''})
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Price will be shown at selection</p>
                  )}
                </div>
              </div>
            </div>

            {/* Room Selection */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-gray-900">Select Rooms</span>
                  <p className="text-xs text-gray-600 mt-1">Choose how many rooms of this type you need</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    type="button" 
                    onClick={() => decCount(rt.id)} 
                    className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-blue-500 flex items-center justify-center transition-colors"
                  >
                    <Minus size={16} className="text-gray-600" />
                  </button>
                  <span className="w-12 text-center font-bold text-lg">{typeCounts[rt.id] || 0}</span>
                  <button 
                    type="button" 
                    onClick={() => incCount(rt.id, (rt.rooms?.length ?? 10))} 
                    className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-blue-500 flex items-center justify-center transition-colors"
                  >
                    <Plus size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Meal Plan Selection */}
            {mealPricingByRoomType[rt.id] && (
              <div className="p-6">
                <div className="text-sm font-semibold text-gray-900 mb-4">Meal Plans</div>
                
                {/* Show included base meal plan */}
                {rt.baseMealPlan && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Utensils className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-800">{rt.baseMealPlan.name}</span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Included</span>
                        </div>
                        {rt.baseMealPlan.description && (
                          <p className="text-sm text-green-700 mt-1">{rt.baseMealPlan.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional meal plan options */}
                {Object.entries(mealPricingByRoomType[rt.id].plans).length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Upgrade Options</div>
                    {Array.from({ length: typeCounts[rt.id] || 0 }, (_, idx) => {
                      const builtRoomId = `${rt.id}#${idx + 1}`;
                      const sel = mealSelectionByRoomId[builtRoomId] || '';
                      return (
                        <div key={builtRoomId} className="p-3 bg-gray-50 rounded-lg border">
                          <div className="text-sm font-medium text-gray-700 mb-2">Room {idx + 1}</div>
                          <div className="space-y-2">
                            {Object.entries(mealPricingByRoomType[rt.id].plans).map(([pid, p]) => {
                              const isSelected = sel === pid;
                              const isDeltaMode = p.mode === 'delta';
                              const icon = p.name?.toLowerCase().includes('breakfast') ? Coffee : 
                                          p.name?.toLowerCase().includes('dinner') ? Utensils : Heart;
                              
                              return (
                                <label
                                  key={pid}
                                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-white ${
                                    isSelected 
                                      ? 'border-blue-300 bg-blue-50' 
                                      : 'border-gray-200 bg-white hover:border-gray-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-center w-5 h-5 mt-0.5">
                                    <input
                                      type="radio"
                                      name={`mealPlan-${builtRoomId}`}
                                      value={pid}
                                      checked={isSelected}
                                      onChange={() => setMealSelectionByRoomId((prev) => ({ ...prev, [builtRoomId]: pid }))}
                                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      {React.createElement(icon, { className: "w-4 h-4 text-gray-600" })}
                                      <span className="font-medium text-gray-900">{p.name}</span>
                                      {isDeltaMode && (p.adult > 0 || p.child > 0) && (
                                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                                          +₹{(p.adult || 0).toLocaleString('en-IN')} / adult
                                        </span>
                                      )}
                                    </div>
                                    {p.description && (
                                      <p className="text-sm text-gray-600">{p.description}</p>
                                    )}
                                    {isDeltaMode && p.adult === 0 && p.child === 0 && (
                                      <p className="text-xs text-green-600 font-medium mt-1">No additional cost</p>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Enhanced Pricing Summary */}
      {builtRooms.length > 0 && (
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          {!range?.start || !range?.end || nights <= 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-600 mb-2">📅</div>
              <div className="text-sm text-gray-600">Select dates to validate availability and pricing.</div>
            </div>
          ) : validation == null ? (
            <div className="text-center py-8">
              <div className="text-gray-600 mb-2">⏳</div>
              <div className="text-sm text-gray-600">Preparing pricing…</div>
            </div>
          ) : !validation.ok ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-red-600">⚠️</div>
                <div className="text-red-600 font-semibold">Combination not available</div>
              </div>
              <ul className="list-disc pl-5 text-sm text-red-700 mt-2">
                {validation.errors.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
              {validation.suggestions?.minRoomsNeeded && (
                <div className="text-sm text-gray-700 mt-3 p-3 bg-blue-50 rounded-lg">
                  💡 You may need at least <span className="font-semibold">{validation.suggestions.minRoomsNeeded}</span> rooms of this type to fit your party.
                </div>
              )}
            </div>
          ) : (
            <div>
              {validation.warnings?.length > 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-amber-600">⚠️</div>
                    <div className="text-amber-700 font-medium">Please note:</div>
                  </div>
                  <ul className="list-disc pl-5 text-sm text-amber-700">
                    {validation.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Total Summary */}
              <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-lg border border-blue-200">
                <div>
                  <div className="text-sm text-gray-600">Selected rooms</div>
                  <div className="text-lg font-semibold text-gray-900">{builtRooms.length} room{builtRooms.length > 1 ? 's' : ''}</div>
                  {nights > 0 && (
                    <div className="text-sm text-blue-600 font-medium">
                      {nights} night{nights > 1 ? 's' : ''} stay
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Estimated total</div>
                  <div className="text-3xl font-bold text-gray-900">₹{(combinedTotals?.grandTotal || 0).toLocaleString('en-IN')}</div>
                  <div className="text-xs text-gray-500">including taxes</div>
                </div>
              </div>

              {/* Room Details */}
              <div className="space-y-3">
                <div className="text-sm font-semibold text-gray-900 mb-3">Booking Details</div>
                {(combinedTotals?.perRoom || []).map((r) => {
                  const conf = roomPriceMap.get(r.roomId) || {};
                  const base = validation.totals?.perRoom?.find((b) => b.roomId === r.roomId) || {};
                  const extraAdults = base.extraAllocated?.adults || 0;
                  const extraKids = base.extraAllocated?.childrenBed || 0;
                  const extraInf = base.extraAllocated?.infantsBed || 0;
                  const extraPerNight = (extraAdults * (conf.extraBedPriceAdult || 0)) + (extraKids * (conf.extraBedPriceChild || 0)) + (extraInf * (conf.extraBedPriceInfant || 0));
                  const mealPlanId = mealSelectionByRoomId[r.roomId];
                  const rtId = conf.roomTypeId;
                  const planMeta = mealPricingByRoomType[rtId]?.plans?.[mealPlanId];

                  return (
                    <div key={r.roomId} className="p-4 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">
                          Room {r.roomId} {base.isSingle ? '(Single occupancy)' : ''}
                        </div>
                        <div className="text-lg font-bold text-gray-900">₹{(r.totalWithMeals || r.total || 0).toLocaleString('en-IN')}</div>
                      </div>
                      <div className="text-xs text-gray-500 mb-1">
                        Base occupancy: A{base.baseAllocated?.adults||0}/C{base.baseAllocated?.childrenBed||0}/I{base.baseAllocated?.infantsBed||0}
                      </div>
                      {(extraAdults + extraKids + extraInf) > 0 && (
                        <div className="text-xs text-blue-600 mb-1">
                          Extra beds: A{extraAdults}/C{extraKids}/I{extraInf} (+₹{extraPerNight.toLocaleString('en-IN')}/night)
                        </div>
                      )}
                      {planMeta && (
                        <div className="text-xs text-green-600 font-medium">
                          Meal plan: {planMeta.name || 'Selected'}
                          {planMeta.description && ` — ${planMeta.description}`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      {/* Enhanced Book Now Button */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled={!validation || !validation.ok}
          onClick={() => onProceed && onProceed({ rooms: builtRooms, party: computedParty, nights, totals: validation?.totals, assignment: validation?.assignment })}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed"
        >
          {validation && validation.ok ? 'Book Now' : 'Complete Selection'}
        </button>
      </div>
    </section>
  );
}
