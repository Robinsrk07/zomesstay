// menuData.js
import {
  Home,
  Building,
  Users,
  FileText,
  DollarSign,
  Wrench,
  MessageSquare,
  BarChart2,
  Settings,
  HelpCircle,
} from "lucide-react"; 




export const MENU = [
  {
    label: "Dashboard",
    icon: <Home className="w-4 h-4" />,
    path: "dashboard", 
  },
  {
    label: "Properties Management",
    icon: <Building className="w-4 h-4" />,
    children: [
      { label: "All Properties", path: "properties" },
    ],
  },
  {
    label: "Booking Management",
    icon: <Users className="w-4 h-4" />,
    children: [
      { label: "All Bookings", path: "all_bookings" },
     
    ],
  },
  {
    label: "Guest Management",
    icon: <DollarSign className="w-4 h-4" />,
    children: [
      { label: " Registred Users", path: "registred_users" },
      
    ],
  },
  {
    label: "Maintenance",
    icon: <Wrench className="w-4 h-4" />,
    children: [
      { label: "Requests", path: "maintenance/requests" },
      { label: "Schedule", path: "maintenance/schedule" },
      { label: "Vendors", path: "maintenance/vendors" },
    ],
  },
  {
    label: "Payment  & Transaction",
    icon: <Wrench className="w-4 h-4" />,
    children: [
      { label: "All Payments", path: "transactions" },
     
    ],
  },
  {
    label: "Promotions  & Discounts",
    icon: <Wrench className="w-4 h-4" />,
    children: [
      { label: "Promotions", path: "promotion" },
     
    ],
    
  },
  {
    label: "Communication",
    icon: <MessageSquare className="w-4 h-4" />,
    children: [
      { label: "Messages", path: "communication/messages" },
      { label: "Announcements", path: "communication/announcements" },
    ],
  },
  {
    label: "Reports",
    icon: <BarChart2 className="w-4 h-4" />,
    path: "reports",
  },
  {
    label: "Settings",
    icon: <Settings className="w-4 h-4" />,
    path: "settings",
  },
  {
    label: "Help & Support",
    icon: <HelpCircle className="w-4 h-4" />,
    path: "help",
  }
];

