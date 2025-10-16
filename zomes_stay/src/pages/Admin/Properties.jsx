import { Eye, Plus } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import  {propertyService,mediaService} from "../../services";

/* ---------- utils ---------- */
const nfINR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const formatINR = (v) => nfINR.format(Number(v || 0));
const formatDate = (d) => {
  const dt = d ? new Date(d) : null;
  return dt && !isNaN(dt) ? dt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" }) : "—";
};


/* ---------- Page ---------- */
const Properties = () => {
  const navigate = useNavigate();
  const [viewModal, setViewModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [propertyList, setPropertyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  // Dropdown options for room types
  const [utils, setUtils] = useState([]);

  console.log("utils", utils);
  /* ----- data ----- */
  const fetchProperties = async () => {
    setLoading(true);
    setErrMsg("");
    try {
      const res = await propertyService.getProperties();
      setPropertyList(res?.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch properties", err);
      setErrMsg("Could not load properties. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUtils =async ()=>{
    try{
       const utils = await propertyService.getUtils();
       setUtils(utils?.data?.data || []);
    }catch(err){
      console.error("Failed to fetch utils", err);
    }


  }



  


  useEffect(() => {
      fetchProperties();
    fetchUtils();
  }, []);

  /* ----- handlers ----- */
  const handleView = (property) => {
    setSelectedProperty(property);
    setViewModal(true);
  };


  const rows = useMemo(() => propertyList ?? [], [propertyList]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">All Properties</h1>
        <button
          type="button"
          onClick={() => navigate('/admin/base/properties/add')}
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
                      src={mediaService.getMedia(selectedProperty.coverImage)}
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
                              src={mediaService.getMedia(m.url)}
                              alt={m.caption || "Media"}
                              className="w-full h-32 object-cover bg-gray-100"
                            />
                          ) : (
                            <video
                              src={mediaService.getMedia(m.url)}
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



    </div>
  );
};

export default Properties;
