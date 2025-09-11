import { useState } from "react";

const mockUsers = [
  {
    id: 1,
    name: "John Doe",
    phone: "9876543210",
    email: "john@example.com",
    blocked: false,
  },
  {
    id: 2,
    name: "Jane Smith",
    phone: "9123456789",
    email: "jane@example.com",
    blocked: true,
  },
  {
    id: 3,
    name: "Amit Kumar",
    phone: "9988776655",
    email: "amitkumar@example.com",
    blocked: false,
  },
  {
    id: 4,
    name: "Priya Singh",
    phone: "9871234560",
    email: "priya.singh@example.com",
    blocked: false,
  },
  {
    id: 5,
    name: "Jishnu Singh",
    phone: "9001122334",
    email: "jishnu@example.com",
    blocked: false,
  },
  {
    id: 6,
    name: "Kavya Singh",
    phone: "9112233445",
    email: "kavya@example.com",
    blocked: true,
  },
  {
    id: 7,
    name: "Akhila Singh",
    phone: "9009988776",
    email: "akhila@example.com",
    blocked: false,
  },
];

export default function RegisteredUsers() {
  const [users, setUsers] = useState(mockUsers);

  const handleBlockToggle = (id) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, blocked: !user.blocked } : user
      )
    );
  };

  const getStatusDisplay = (blocked) => {
    if (blocked) {
      return {
        text: 'Blocked',
        className: 'text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-medium'
      };
    }
    return {
      text: 'Active',
      className: 'text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-medium'
    };
  };

  const getActionButton = (user) => {
    if (user.blocked) {
      return {
        text: 'Unblock',
        className: 'inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors'
      };
    }
    return {
      text: 'Block',
      className: 'inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors'
    };
  };

  return (
    <div className="p-6 max-w-full">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Registered Users</h2>
      
      {/* Fixed overflow container */}
      <div className="w-full overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="w-full min-w-[700px] bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                User ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Phone Number
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Email ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{user.id}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {user.name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {user.phone}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <div className="max-w-[250px] truncate" title={user.email}>
                    {user.email}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={getStatusDisplay(user.blocked).className}>
                    {getStatusDisplay(user.blocked).text}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button
                    onClick={() => handleBlockToggle(user.id)}
                    className={getActionButton(user).className}
                  >
                    {getActionButton(user).text}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800">Total Users</h3>
          <p className="text-2xl font-bold text-blue-900">{users.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800">Active Users</h3>
          <p className="text-2xl font-bold text-green-900">
            {users.filter(u => !u.blocked).length}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-800">Blocked Users</h3>
          <p className="text-2xl font-bold text-red-900">
            {users.filter(u => u.blocked).length}
          </p>
        </div>
      </div>
    </div>
  );
}