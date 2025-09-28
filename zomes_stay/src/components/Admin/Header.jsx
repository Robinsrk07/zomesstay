import { MagnifyingGlassIcon, BellIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import authService from "../../services/auth/authService";
import { useSelector, useDispatch } from "react-redux";            // ⬅️ add dispatch
import hostAuthService from "../../services/auth/host_authService";
import { persistor } from "../../store/store";            // ⬅️ add persistor

const Header = ({ onOpenSidebar }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();                                   // ⬅️ add
  const auth = useSelector((state) => state.auth);
  const role = auth?.role;

console.log("role to test ",auth)
console.log("role to test ",role)

  const handleLogout = async () => {
    try {
      if (role === "admin") await authService.logout();
      else if (role === "host") await hostAuthService.logout();
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      // remove any client token
      sessionStorage.removeItem("authToken");

      // reset redux in-memory (no new imports; use action type string)
      dispatch({ type: "auth/logout" });

      // wipe persisted redux so it won't rehydrate on refresh
      await persistor.flush();
      await persistor.purge();

      toast.success("Logged out successfully!");
      if (role === "host") navigate("/host", { replace: true });
      else if (role === "admin") navigate("/admin", { replace: true });
    }
  };

  return (
    <header className="w-full shadow-lg h-[100px] bg-white flex items-center px-6">
      {/* Hamburger for mobile */}
      <button
        type="button"
        className="md:hidden mr-4 inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label="Open sidebar"
        onClick={onOpenSidebar}
      >
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      {/* Search bar */}
      <div className="relative w-full max-w-[500px]">
        <input
          type="text"
          placeholder="Search..."
          className="w-full rounded-lg border border-gray-300 py-2 pl-4 pr-10 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <MagnifyingGlassIcon className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
      </div>

      {/* Right cluster */}
      <div className="ml-auto flex items-center gap-6">
        <div className="relative">
          <BellIcon className="h-6 w-6 text-indigo-400 cursor-pointer" />
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3">
          <img
            src="https://i.pravatar.cc/100?img=12"
            alt="User Avatar"
            className="h-9 w-9 rounded-full object-cover"
          />
          <div className="leading-tight hidden sm:block">
            <div className="text-sm font-semibold text-gray-800">John Thomson</div>
            <div className="text-xs text-indigo-400">
              {role === "host" ? "Property owner" : "Admin"}
            </div>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="text-sm font-semibold text-red-500 hover:text-red-600"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
