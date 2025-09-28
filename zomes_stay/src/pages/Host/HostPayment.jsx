import { useState } from "react";

const mockTransactions = [
  {
    id: "TXN001",
    bookingId: "BK001",
    customer: "John Doe",
    property: "Sea View Apartment",
    amount: 3500,
    type: "booking_payment",
    method: "credit_card",
    status: "completed",
    date: "2025-08-20",
    description: "Booking payment for deluxe room",
    refundable: true,
    commission: 350,
    netAmount: 3150,
    gateway: "Razorpay",
    transactionId: "pay_MkB2xQJ9E7Lz8w"
  },
  {
    id: "TXN002",
    bookingId: "BK002",
    customer: "Jane Smith",
    property: "Mountain Villa",
    amount: 5000,
    type: "full_payment",
    method: "upi",
    status: "completed",
    date: "2025-08-19",
    description: "Full payment for suite booking",
    refundable: true,
    commission: 500,
    netAmount: 4500,
    gateway: "PayU",
    transactionId: "upi_NkC3yRK0F8Mz9x"
  },
  {
    id: "TXN003",
    bookingId: "BK003",
    customer: "Amit Kumar",
    property: "City Hostel",
    amount: 1200,
    type: "advance_payment",
    method: "net_banking",
    status: "pending",
    date: "2025-08-21",
    description: "Advance payment for single bed",
    refundable: true,
    commission: 120,
    netAmount: 1080,
    gateway: "Paytm",
    transactionId: "nb_OlD4zSL1G9Na0y"
  },
  {
    id: "TXN004",
    bookingId: "BK002",
    customer: "Jane Smith",
    property: "Mountain Villa",
    amount: 500,
    type: "refund",
    method: "credit_card",
    status: "completed",
    date: "2025-08-18",
    description: "Partial refund for cancellation",
    refundable: false,
    commission: -50,
    netAmount: 450,
    gateway: "PayU",
    transactionId: "ref_PlE5aTM2H0Ob1z"
  },
  {
    id: "TXN005",
    bookingId: "BK004",
    customer: "Priya Singh",
    property: "Lake Cottage",
    amount: 8000,
    type: "booking_payment",
    method: "wallet",
    status: "failed",
    date: "2025-08-22",
    description: "Booking payment for entire cottage",
    refundable: false,
    commission: 800,
    netAmount: 7200,
    gateway: "Razorpay",
    transactionId: "wal_QmF6bUN3I1Pc2a"
  }
];

const mockPaymentMethods = ["All", "credit_card", "debit_card", "upi", "net_banking", "wallet"];
const mockTransactionTypes = ["All", "booking_payment", "full_payment", "advance_payment", "refund", "penalty"];
const mockStatuses = ["All", "completed", "pending", "failed", "cancelled"];

export default function PaymentsTransactions() {
  const [transactions, setTransactions] = useState(mockTransactions);
  const [filterMethod, setFilterMethod] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [refundAmount, setRefundAmount] = useState("");

  // Filter transactions
  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = txn.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         txn.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         txn.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = filterMethod === "All" || txn.method === filterMethod;
    const matchesType = filterType === "All" || txn.type === filterType;
    const matchesStatus = filterStatus === "All" || txn.status === filterStatus;
    
    return matchesSearch && matchesMethod && matchesType && matchesStatus;
  });

  // Calculate statistics
  const totalRevenue = transactions
    .filter(t => t.status === 'completed' && t.type !== 'refund')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalRefunds = transactions
    .filter(t => t.status === 'completed' && t.type === 'refund')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const pendingPayments = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCommission = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + Math.abs(t.commission), 0);

  // Utility functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'cancelled': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'booking_payment': return 'text-blue-600 bg-blue-50';
      case 'full_payment': return 'text-green-600 bg-green-50';
      case 'advance_payment': return 'text-purple-600 bg-purple-50';
      case 'refund': return 'text-red-600 bg-red-50';
      case 'penalty': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatPaymentMethod = (method) => {
    const methods = {
      'credit_card': 'Credit Card',
      'debit_card': 'Debit Card',
      'upi': 'UPI',
      'net_banking': 'Net Banking',
      'wallet': 'Wallet'
    };
    return methods[method] || method;
  };

  const formatTransactionType = (type) => {
    const types = {
      'booking_payment': 'Booking Payment',
      'full_payment': 'Full Payment',
      'advance_payment': 'Advance Payment',
      'refund': 'Refund',
      'penalty': 'Penalty'
    };
    return types[type] || type;
  };

  const handleRefund = (transaction) => {
    setSelectedTransaction(transaction);
    setRefundAmount(transaction.amount.toString());
    setShowRefundModal(true);
  };

  const processRefund = () => {
    if (selectedTransaction && refundAmount) {
      const newRefund = {
        id: `TXN${String(transactions.length + 1).padStart(3, '0')}`,
        bookingId: selectedTransaction.bookingId,
        customer: selectedTransaction.customer,
        property: selectedTransaction.property,
        amount: parseFloat(refundAmount),
        type: 'refund',
        method: selectedTransaction.method,
        status: 'completed',
        date: new Date().toISOString().split('T')[0],
        description: `Refund for ${selectedTransaction.description}`,
        refundable: false,
        commission: -Math.abs(parseFloat(refundAmount) * 0.1),
        netAmount: parseFloat(refundAmount) * 0.9,
        gateway: selectedTransaction.gateway,
        transactionId: `ref_${Math.random().toString(36).substr(2, 14)}`
      };

      setTransactions(prev => [newRefund, ...prev]);
      setShowRefundModal(false);
      setSelectedTransaction(null);
      setRefundAmount("");
    }
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Transaction ID', 'Booking ID', 'Customer', 'Property', 'Amount', 'Type', 'Method', 'Status', 'Date', 'Gateway ID'].join(','),
      ...filteredTransactions.map(txn => [
        txn.id,
        txn.bookingId,
        txn.customer,
        txn.property,
        txn.amount,
        txn.type,
        txn.method,
        txn.status,
        txn.date,
        txn.transactionId
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
  };

  return (
    <div className="p-6 max-w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Payments & Transactions</h2>
        <button
          onClick={exportTransactions}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Export CSV
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-sm font-medium text-green-800">Total Revenue</h3>
          <p className="text-2xl font-bold text-green-900">₹{totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-1">Completed payments</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="text-sm font-medium text-yellow-800">Pending Payments</h3>
          <p className="text-2xl font-bold text-yellow-900">₹{pendingPayments.toLocaleString()}</p>
          <p className="text-xs text-yellow-600 mt-1">Awaiting confirmation</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h3 className="text-sm font-medium text-red-800">Total Refunds</h3>
          <p className="text-2xl font-bold text-red-900">₹{totalRefunds.toLocaleString()}</p>
          <p className="text-xs text-red-600 mt-1">Processed refunds</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800">Commission Earned</h3>
          <p className="text-2xl font-bold text-blue-900">₹{totalCommission.toLocaleString()}</p>
          <p className="text-xs text-blue-600 mt-1">Platform fees</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search customer, property, or transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {mockPaymentMethods.map(method => (
                <option key={method} value={method}>
                  {method === "All" ? "All Methods" : formatPaymentMethod(method)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {mockTransactionTypes.map(type => (
                <option key={type} value={type}>
                  {type === "All" ? "All Types" : formatTransactionType(type)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {mockStatuses.map(status => (
                <option key={status} value={status}>
                  {status === "All" ? "All Statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="w-full overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="w-full min-w-[1200px] bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Transaction ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Property
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Method
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Gateway ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTransactions.map((txn) => (
              <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {txn.id}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {txn.customer}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <div className="max-w-[200px] truncate" title={txn.property}>
                    {txn.property}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                  ₹{txn.amount.toLocaleString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(txn.type)}`}>
                    {formatTransactionType(txn.type)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {formatPaymentMethod(txn.method)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(txn.status)}`}>
                    {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {txn.date}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                  {txn.transactionId}
                </td>
                <td className="px-4 py-3 whitespace-nowrap space-x-2">
                  <button className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    View
                  </button>
                  {txn.status === 'completed' && txn.refundable && txn.type !== 'refund' && (
                    <button
                      onClick={() => handleRefund(txn)}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Refund
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No transactions found matching your criteria.
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Process Refund</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Transaction: {selectedTransaction?.id}</p>
                <p className="text-sm text-gray-600 mb-2">Customer: {selectedTransaction?.customer}</p>
                <p className="text-sm text-gray-600 mb-4">Original Amount: ₹{selectedTransaction?.amount}</p>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">Refund Amount</label>
                <input
                  type="number"
                  max={selectedTransaction?.amount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter refund amount"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={processRefund}
                  disabled={!refundAmount || parseFloat(refundAmount) <= 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:bg-gray-400"
                >
                  Process Refund 
                </button>
              </div>
            </div>
          </div>
        </div>
      )}  
    </div> 
  );
}