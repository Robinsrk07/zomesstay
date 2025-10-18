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
  
  
  
  
  export const MENU_HOST = [
    {
      label: "Dashboard",
      icon: <Home className="w-4 h-4" />,
      path: "host-dashboard", 
    },
    {
      label: "Properties Management",
      icon: <Building className="w-4 h-4" />,
      children: [
        { label: "All Properties", path: "host-properties" },
      ],
    },
    {
      label: "Booking Management",
      icon: <Users className="w-4 h-4" />,
      children: [
        { label: "All Bookings", path: "host-all_bookings" },
       
      ],
    },
    {
      label: "inventory Management",
      icon: <Users className="w-4 h-4" />,
      children: [
        { label: "Inventory", path: "inventory_management" },
        { label: "Meal Plan", path: "meal_plans" },

       
      ],
    },
    {
      label: "Rate Plan Management",
      icon: <Users className="w-4 h-4" />,
      children: [
        { label: "Best Rates", path: "best_available_rates" },

       
      ],
    },
    {
      label: "Guest Management",
      icon: <DollarSign className="w-4 h-4" />,
      children: [
        { label: " Registred Users", path: "host-registred_users" },
        
      ],
    },
    {
      label: "Maintenance",
      icon: <Wrench className="w-4 h-4" />,
      children: [
        { label: "Requests", path: "host-maintenance/requests" },
        { label: "Schedule", path: "host-maintenance/schedule" },
        { label: "Vendors", path: "host-maintenance/vendors" },
      ],
    },
    {
      label: "Payment  & Transaction",
      icon: <Wrench className="w-4 h-4" />,
      children: [
        { label: "All Payments", path: "host-transactions" },
       
      ],
    },
    {
      label: "Promotions  & Discounts",
      icon: <Wrench className="w-4 h-4" />,
      children: [
        { label: "Promotions", path: "host-promotion" },
       
      ],
      
    },
    {
      label: "Communication",
      icon: <MessageSquare className="w-4 h-4" />,
      children: [
        { label: "Messages", path: "host-communication/messages" },
        { label: "Announcements", path: "host-communication/announcements" },
      ],
    },
    {
      label: "Reports",
      icon: <BarChart2 className="w-4 h-4" />,
      path: "host-reports",
    },
    {
      label: "Settings",
      icon: <Settings className="w-4 h-4" />,
      path: "host-settings",
    },
    {
      label: "Help & Support",
      icon: <HelpCircle className="w-4 h-4" />,
      path: "host-help",
    }
  ];
  
  
