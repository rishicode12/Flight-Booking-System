import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Wallet, Edit2, Save, X, AlertCircle } from 'lucide-react';

const UserProfilePage = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/bookings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(Array.isArray(data) ? data : []);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!editName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await updateProfile(editName);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-white rounded-lg transition"
            title="Back to home"
          >
            <ArrowLeft className="text-gray-700" size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-lg mb-8 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <User size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user?.name || 'User'}</h2>
                <p className="text-blue-100">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 items-start">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Name Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Edit2 size={16} /> Edit
                  </button>
                )}
              </div>
              {isEditing ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Enter your name"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save size={18} /> {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(user?.name || '');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <p className="text-gray-700 font-medium">{user?.name || 'N/A'}</p>
              )}
            </div>

            {/* Email Section */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Email Address</label>
              <div className="flex items-center gap-2 text-gray-700">
                <Mail size={18} className="text-blue-600" />
                <span>{user?.email || 'N/A'}</span>
              </div>
            </div>

            {/* Wallet Balance Section */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Wallet Balance</label>
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
                <Wallet size={20} className="text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">
                  ₹{user?.walletBalance?.toLocaleString('en-IN') || '0'}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Booking History */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
            <h3 className="text-xl font-bold">Booking History</h3>
          </div>

          <div className="p-6">
            {loading ? (
              <p className="text-gray-600 text-center py-8">Loading bookings...</p>
            ) : bookings.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No bookings yet. Start booking flights now!</p>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking, index) => (
                  <div key={booking._id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Flight</p>
                        <p className="font-semibold text-gray-800">{booking.flight_id || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Passengers</p>
                        <p className="font-semibold text-gray-800">{booking.passenger_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
                        <p className="font-semibold text-blue-600">₹{booking.price_paid?.toLocaleString('en-IN') || '0'}</p>
                      </div>
                    </div>
                    {booking.booking_date && (
                      <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                        📅 {new Date(booking.booking_date).toLocaleDateString('en-IN')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
