// Frontend/src/pages/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const loadRequests = async () => {
      const res = await api.get('/admin/pending-verifications');
      setRequests(res.data);
    };
    loadRequests();
  }, []);

  const approveUser = async (id) => {
    if (window.confirm("Are you sure you want to verify this user?")) {
      await api.patch(`/admin/approve-badge/${id}`);
      setRequests(requests.filter(req => req._id !== id)); // Remove from list
    }
  };

  return (
    <div className="p-10 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Owner/Admin Dashboard</h1>
      <div className="grid gap-4">
        {requests.map(user => (
          <div key={user._id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center border-l-4 border-blue-500">
            <div>
              <p className="font-bold text-lg">{user.fullName} (@{user.username})</p>
              <p className="text-sm text-gray-600">Reason: "{user.verificationApplication?.statement}"</p>
            </div>
            <button 
              onClick={() => approveUser(user._id)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition"
            >
              Approve Blue Badge
            </button>
          </div>
        ))}
        {requests.length === 0 && <p className="text-gray-500">No pending requests at the moment.</p>}
      </div>
    </div>
  );
}