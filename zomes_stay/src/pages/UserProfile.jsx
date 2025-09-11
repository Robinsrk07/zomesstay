import React, { useState } from "react";

const defaultUser = {
  name: "John Doe",
  email: "userstest@gmail.com",
  phone: "+91 123 456 7890",
  location: "Sulthan Bathery, Kerala, India.",
  joined: 2021,
  city: "",
  state: "",
  country: "",
  zip: "",
  avatar: "",
  emailVerified: true,
  mobileVerified: true,
};

const UserProfile = () => {
  const [user, setUser] = useState(defaultUser);
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    city: user.city,
    state: user.state,
    country: user.country,
    zip: user.zip,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    // Validate fields (simple demo)
    let errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setUser({ ...user, ...form });
      // Optionally show success
    }
  };

  return (
    <div className="min-h-[80vh] bg-white rounded-2xl shadow-lg flex flex-col md:flex-row gap-8 p-4 md:p-8 lg:p-10 max-w-6xl mx-auto mt-6 my-6 border border-gray-200">
      {/* Sidebar */}
      <aside className="w-full md:w-[320px] flex-shrink-0 bg-[#004AAD] text-white rounded-2xl flex flex-col items-center py-8 px-6 gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-[104px] h-[104px] rounded-full bg-white flex items-center justify-center text-[#004AAD] text-5xl font-bold mb-2">
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <svg width="56" height="56" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="#E5E7EB"/><path d="M4 20c0-3.314 3.134-6 8-6s8 2.686 8 6" fill="#E5E7EB"/></svg>
            )}
          </div>
          <button className="text-xs font-medium underline underline-offset-2 hover:text-blue-100 focus:outline-none">Upload a Photo</button>
        </div>
        <div className="flex flex-col items-start gap-1 mt-2">
          <span className="text-lg font-bold">{user.name}</span>
          <div className="flex items-center gap-2 text-sm">
            <svg className="inline-block" width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="#fff" strokeWidth="1.5" d="M3 5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5v13A2.5 2.5 0 0 1 18.5 21h-13A2.5 2.5 0 0 1 3 18.5v-13Z"/><path stroke="#fff" strokeWidth="1.5" d="M7 8h10M7 12h7m-7 4h4"/></svg>
            {user.phone}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <svg className="inline-block" width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="#fff" strokeWidth="1.5" d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z"/><path stroke="#fff" strokeWidth="1.5" d="M22 6.5 12 13 2 6.5"/></svg>
            {user.email}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <svg className="inline-block" width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="#fff" strokeWidth="1.5" d="M12 2C7.03 2 3 6.03 3 11c0 5.25 7.5 11 9 11s9-5.75 9-11c0-4.97-4.03-9-9-9Zm0 13a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"/></svg>
            {user.location}
          </div>
        </div>
        <div className="w-full border-t border-white/20 my-4"></div>
        <div className="w-full">
          <div className="text-sm font-semibold mb-2">Identity Verification</div>
          <ul className="flex flex-col gap-1 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-green-300">✔</span> Email Confirmed
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-300">✔</span> Mobile Confirmed
            </li>
          </ul>
        </div>
      </aside>

      {/* Main Content: Editable Form */}
      <main className="flex-1 flex flex-col gap-8 ">
        <header className="mb-2">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-600">Hello, {user.name}</h1>
          <div className="text-gray-400 text-sm">Joined in {user.joined}</div>
        </header>
        <form className="flex-1 flex flex-col gap-6" onSubmit={handleSave} autoComplete="off">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-500 mb-1">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                className={`w-full h-10 rounded-lg border ${errors.name ? "border-red-400" : "border-gray-200"} px-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004AAD]/40 focus:border-[#004AAD] transition text-base`}
                placeholder="John Doe"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && <div id="name-error" className="text-xs text-red-500 mt-1">{errors.name}</div>}
            </div>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-500 mb-1">Mail ID</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                disabled
                className="w-full h-10 rounded-lg border border-gray-200 px-3 text-gray-400 bg-gray-100 placeholder-gray-400 cursor-not-allowed text-base"
                placeholder="userstest@gmail.com"
              />
            </div>
            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                disabled
                className="w-full h-10 rounded-lg border border-gray-200 px-3 text-gray-400 bg-gray-100 placeholder-gray-400 cursor-not-allowed text-base"
                placeholder="+91 123 456 7890"
              />
            </div>
            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-500 mb-1">City</label>
              <input
                id="city"
                name="city"
                type="text"
                value={form.city}
                onChange={handleChange}
                className="w-full h-10 rounded-lg border border-gray-200 px-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004AAD]/40 focus:border-[#004AAD] transition text-base"
                placeholder="City Name"
              />
            </div>
            {/* State */}
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-500 mb-1">State</label>
              <input
                id="state"
                name="state"
                type="text"
                value={form.state}
                onChange={handleChange}
                className="w-full h-10 rounded-lg border border-gray-200 px-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004AAD]/40 focus:border-[#004AAD] transition text-base"
                placeholder="State Name"
              />
            </div>
            {/* Country */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-500 mb-1">Country</label>
              <input
                id="country"
                name="country"
                type="text"
                value={form.country}
                onChange={handleChange}
                className="w-full h-10 rounded-lg border border-gray-200 px-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004AAD]/40 focus:border-[#004AAD] transition text-base"
                placeholder="Country Name"
              />
            </div>
            {/* Zip Code */}
            <div>
              <label htmlFor="zip" className="block text-sm font-medium text-gray-500 mb-1">Zip Code</label>
              <input
                id="zip"
                name="zip"
                type="text"
                value={form.zip}
                onChange={handleChange}
                className="w-full h-10 rounded-lg border border-gray-200 px-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004AAD]/40 focus:border-[#004AAD] transition text-base"
                placeholder="Code"
              />
            </div>
          </div>
          {/* Actions */}
          <div className="flex flex-col md:flex-row gap-3 justify-end items-center mt-2">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300 text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full md:w-auto rounded-full bg-[#004AAD] text-white font-semibold px-8 py-3 text-base shadow hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-[#004AAD]/50"
            >
              Save
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default UserProfile;