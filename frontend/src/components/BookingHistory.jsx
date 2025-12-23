import React, { useState, useEffect } from 'react';
import { Plane, Download, Calendar, DollarSign, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { bookingAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import WalletDisplay from './WalletDisplay';

const BookingHistory = ({ onNavigate = () => {} }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingPNR, setDownloadingPNR] = useState(null);

  // Fetch bookings from backend
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await bookingAPI.getMyBookings();

        setBookings(response.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch bookings');
        console.error('Error fetching bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user?.id]);

  // Download ticket PDF
  const handleDownloadTicket = async (bookingId, pnr) => {
    try {
      setDownloadingPNR(pnr);
      const response = await bookingAPI.downloadTicket(bookingId);

      // Create blob link and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket_${pnr}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download ticket: ' + (err.response?.data?.message || err.message));
    } finally {
      setDownloadingPNR(null);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-blue-50 p-4 md:p-8 flex flex-col items-center font-sans">
      {/* Navigation Bar */}
      <nav className="w-full max-w-7xl flex justify-between items-center mb-8 px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center text-white font-bold cursor-pointer" onClick={() => navigate('/')}>F</div>
          <span className="text-xl font-bold text-blue-900 cursor-pointer" onClick={() => navigate('/')}>FlightJet</span>
        </div>
        <div className="flex gap-6 text-sm font-medium text-gray-600">
          <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate('/')}>Search</span>
          <span className="text-blue-600 cursor-pointer" onClick={() => navigate('/bookings')}>My Bookings</span>
          <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate('/profile')}>My Account</span>
        </div>
        <div className="flex items-center gap-3">
          <WalletDisplay />
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600">
            <User size={18} />
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="w-full max-w-6xl mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          My <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">Booking History</span>
        </h1>
        <p className="text-gray-600 text-sm md:text-base">View, manage, and download your flight bookings</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600"></div>
          </div>
          <p className="text-gray-600 text-lg font-semibold">Loading your bookings...</p>
          <p className="text-gray-500 text-sm mt-2">This won't take long</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="w-full max-w-6xl bg-red-50 border-2 border-red-200 rounded-2xl shadow-lg p-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={28} />
            <div>
              <h3 className="text-red-800 font-bold text-lg">Error loading bookings</h3>
              <p className="text-red-700 text-sm mt-2">{error}</p>
              <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">Try Again</button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && bookings.length === 0 && (
        <div className="w-full max-w-6xl bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-12 text-center border border-blue-100">
          <Plane className="mx-auto text-gray-300 mb-6" size={64} />
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No bookings yet</h3>
          <p className="text-gray-600 text-lg mb-8">Start your journey by searching and booking a flight</p>
          <button 
            className="px-10 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-full hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1" 
            onClick={() => navigate('/')}
          >
            🔍 Search Flights
          </button>
        </div>
      )}

      {/* Bookings List */}
      <div className="w-full max-w-6xl space-y-5">
        {bookings.map((booking) => (
          <div key={booking._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100">
            {/* Card Header - Flight Info */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 p-6 text-white">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <Plane size={28} />
                  </div>
                  <div>
                    <p className="text-sm opacity-90 uppercase tracking-wide font-medium">Flight</p>
                    <h2 className="text-2xl md:text-3xl font-bold">{booking.airline}</h2>
                  </div>
                </div>
                <div className="text-right bg-white bg-opacity-10 rounded-lg px-4 py-3">
                  <p className="text-xs opacity-75 uppercase tracking-wide font-medium">Flight ID</p>
                  <p className="text-2xl font-bold font-mono">{booking.flight_id}</p>
                </div>
              </div>

              {/* Route */}
              <div className="flex items-center justify-between bg-white bg-opacity-15 rounded-xl p-4">
                <div>
                  <p className="text-xs opacity-75 uppercase tracking-widest font-semibold">From</p>
                  <p className="text-xl font-bold mt-1">{booking.route.split('-')[0]}</p>
                </div>
                <ArrowRight size={28} className="opacity-80" />
                <div className="text-right">
                  <p className="text-xs opacity-75 uppercase tracking-widest font-semibold">To</p>
                  <p className="text-xl font-bold mt-1">{booking.route.split('-')[1]}</p>
                </div>
              </div>
            </div>

            {/* Card Body - Details Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 bg-gradient-to-b from-white to-gray-50">
              {/* Passenger Name */}
              <div className="border-l-4 border-blue-400 pl-4">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2">Passenger</p>
                <p className="text-lg font-bold text-gray-800">{booking.passenger_name}</p>
              </div>

              {/* PNR */}
              <div className="border-l-4 border-purple-400 pl-4">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2">PNR</p>
                <p className="text-xl font-mono font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg inline-block">{booking.pnr}</p>
              </div>

              {/* Booking Date */}
              <div className="border-l-4 border-green-400 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-gray-600" />
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Booked On</p>
                </div>
                <p className="text-lg font-semibold text-gray-800">{formatDate(booking.booking_time)}</p>
              </div>

              {/* Amount Paid */}
              <div className="border-l-4 border-green-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={16} className="text-green-600" />
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Amount Paid</p>
                </div>
                <p className="text-2xl font-bold text-green-600">₹{booking.price_paid.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Card Footer - Action Buttons */}
            <div className="bg-gray-100 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-600 font-medium">📌 Booking ID: <span className="font-bold">{booking._id.substring(0, 12)}...</span></p>
              </div>
              <button
                onClick={() => handleDownloadTicket(booking._id, booking.pnr)}
                disabled={downloadingPNR === booking.pnr}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-full hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              >
                <Download size={20} />
                {downloadingPNR === booking.pnr ? '⏳ Downloading...' : '📥 Download Ticket'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingHistory;
