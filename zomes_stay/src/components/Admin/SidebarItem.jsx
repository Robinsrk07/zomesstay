import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const Chevron = ({ open }) => (
  <svg
    className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M7 5l6 5-6 5V5z" />
  </svg>
);

const SidebarItem = ({ item, depth = 0 }) => {
  const { pathname } = useLocation();
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
  const [open, setOpen] = useState(false);
    const auth = useSelector((state) => state.auth);
    const role = auth?.role;

  const padLeft = { paddingLeft: 12 + depth * 12 };

  if (!hasChildren) {
    const active = item.path && pathname === item.path;
    return (
      <Link
        to={item.path ? (item.path.startsWith("/") ? item.path : `/${role}/base/${item.path}`) : "#"}
        className={`block rounded-md px-3 py-2 text-sm ${
          active ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-50"
        }`}
        style={padLeft}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between rounded-md px-8 py-2 text-sm text-gray-500 hover:bg-gray-50"
        style={padLeft}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          {item.icon}
          {item.label}
        </span>
        <Chevron open={open} />
      </button>

      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <ul className="mt-1 space-y-1">
          {item.children.map(child => (
            <li key={child.label}>
              <SidebarItem item={child} depth={depth + 1} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SidebarItem;
