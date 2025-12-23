import React, { useState } from 'react';
import { X, Loader, Plane, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { bookingAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

const BookingModal = ({ flight, returnFlight = null, isOpen, onClose, onBookingSuccess, passengerCount = 1 }) => {
  const { user, updateWalletBalance } = useAuth();
  const navigate = useNavigate();
  const walletBalance = user?.walletBalance || 0;
  const [formData, setFormData] = useState({
    email: '',
  });
  const [passengers, setPassengers] = useState(() => Array.from({ length: passengerCount }, () => ({ name: '', age: '' })));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);
  const [downloading, setDownloading] = useState({ outbound: false, return: false });
  const [isEditingPassengers, setIsEditingPassengers] = useState(false);
  
  // Calculate total price: for round trip, include both outbound and return
  const outboundPrice = flight ? flight.current_price * passengerCount : 0;
  const returnPrice = returnFlight ? returnFlight.current_price * passengerCount : 0;
  const totalPrice = outboundPrice + returnPrice;

  if (!isOpen || !flight) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePassengerChange = (index, key, value) => {
    setPassengers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate passenger names
    for (let i = 0; i < passengerCount; i++) {
      if (!passengers[i]?.name || !passengers[i].name.trim()) {
        setError(`Passenger ${i + 1} name is required`);
        return;
      }
    }

    // Check wallet balance for total price (including all passengers and round trip if applicable)
    if (walletBalance < totalPrice) {
      const priceBreakdown = returnFlight 
        ? `Outbound: ₹${outboundPrice} + Return: ₹${returnPrice}`
        : `${passengerCount} passenger${passengerCount > 1 ? 's' : ''} × ₹${flight.current_price}`;
      setError(`Insufficient wallet balance. Required: ₹${totalPrice} (${priceBreakdown}), Available: ₹${walletBalance}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        flightId: flight.flight_id,
        passengerCount: passengerCount,
        passenger_details: passengers.map((p) => ({ name: p.name.trim(), age: p.age ? Number(p.age) : null })),
      };
      if (returnFlight && returnFlight.flight_id) payload.returnFlightId = returnFlight.flight_id;

      const response = await bookingAPI.createBooking(payload);
      const data = response.data;
      
      // Update wallet balance immediately from booking response
      if (data.remainingBalance !== undefined) {
        updateWalletBalance(data.remainingBalance);
      }
      
      setBookingResult(data);
      onBookingSuccess && onBookingSuccess(data);
    } catch (err) {
      let errorMsg = 'Booking failed. Please try again.';
      if (err.response?.data?.message) errorMsg = err.response.data.message;
      else if (err.message) errorMsg = err.message;
      if (errorMsg.includes('validation failed') || errorMsg.includes('required')) {
        errorMsg = 'There was an issue processing your booking. Please refresh and try again.';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (bookingResult) {
    // Edit passenger details view
    if (isEditingPassengers) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 transform transition-all">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                ✏️ Edit Passenger Details
              </h2>
            </div>

            {/* Edit Form */}
            <div className="overflow-y-auto max-h-[calc(100vh-200px)] p-6 sm:p-8">
              <div className="space-y-4">
                {Array.from({ length: passengerCount }).map((_, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">Passenger {idx + 1} Name *</label>
                      <input
                        type="text"
                        value={passengers[idx]?.name || ''}
                        onChange={(e) => handlePassengerChange(idx, 'name', e.target.value)}
                        placeholder="Full name as per ID"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">Age</label>
                      <input
                        type="number"
                        min="0"
                        value={passengers[idx]?.age || ''}
                        onChange={(e) => handlePassengerChange(idx, 'age', e.target.value)}
                        placeholder="Age"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 sm:space-y-3 pt-6">
                <button
                  onClick={() => {
                    // Validate before saving
                    for (let i = 0; i < passengerCount; i++) {
                      if (!passengers[i]?.name || !passengers[i].name.trim()) {
                        setError(`Passenger ${i + 1} name is required`);
                        return;
                      }
                    }
                    setError(null);
                    setIsEditingPassengers(false);
                  }}
                  className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-orange-600 to-orange-700 text-white font-bold rounded-lg sm:rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all shadow-lg hover:shadow-xl"
                >
                  ✅ Save Changes
                </button>
                <button
                  onClick={() => setIsEditingPassengers(false)}
                  className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-100 text-gray-800 font-semibold rounded-lg sm:rounded-xl hover:bg-gray-200 transition-colors"
                >
                  ← Back to Summary
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-white text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <CheckCircle size={40} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Booking Confirmed!</h2>
            <p className="text-green-100 text-sm">Your flight has been successfully booked</p>
          </div>

          {/* Booking Details */}
          <div className="p-8">
            {/* PNR Card */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 mb-6 text-center">
              <p className="text-sm text-gray-600 font-medium uppercase tracking-wide mb-2">Your PNR (Outbound)</p>
              <p className="text-4xl font-bold text-blue-600 font-mono tracking-wider">{bookingResult.outbound?.pnr}</p>
              <p className="text-xs text-gray-500 mt-2">Save this for your reference</p>
            </div>

            {/* Flight Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Airline</p>
                <p className="text-lg font-bold text-gray-800">{bookingResult.outbound?.airline}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Route</p>
                <p className="text-lg font-bold text-gray-800">{bookingResult.outbound?.route}</p>
              </div>
            </div>

            {/* Booking Date & Time */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
              <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-2">Booking Date & Time</p>
              <p className="text-sm font-semibold text-indigo-700">
                {new Date(bookingResult.outbound?.booking_time).toLocaleString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {/* Flight ID & Passenger Count */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
                <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-1">Flight ID</p>
                <p className="text-sm font-bold text-sky-700">{bookingResult.outbound?.flight_id}</p>
              </div>
              <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
                <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-1">No. of Passengers</p>
                <p className="text-2xl font-bold text-sky-700">{bookingResult.outbound?.passenger_count || passengerCount}</p>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-3">Price Breakdown</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Per Passenger:</span>
                  <span className="font-semibold text-gray-700">₹{((bookingResult.totalPrice || 0) / (bookingResult.outbound?.passenger_count || passengerCount)).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Number of Passengers:</span>
                  <span className="font-semibold text-gray-700">× {bookingResult.outbound?.passenger_count || passengerCount}</span>
                </div>
                <div className="h-px bg-orange-300 my-2"></div>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-gray-700">Total Amount Paid:</span>
                  <span className="text-xl font-bold text-orange-600">₹{(bookingResult.totalPrice || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Remaining Balance */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 mb-6">
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1">Remaining Wallet</p>
              <p className="text-2xl font-bold text-blue-600">₹{bookingResult.remainingBalance.toLocaleString('en-IN')}</p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setIsEditingPassengers(true)}
                className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl"
              >
                ✏️ Edit Passenger Details
              </button>

              {bookingResult.outbound?.downloadUrl && (
                <button
                  onClick={async () => {
                    try {
                      setDownloading((d) => ({ ...d, outbound: true }));
                      const resp = await bookingAPI.downloadTicket(bookingResult.outbound._id);
                      const url = window.URL.createObjectURL(new Blob([resp.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `ticket_${bookingResult.outbound.pnr}.pdf`);
                      document.body.appendChild(link);
                      link.click();
                      link.parentNode.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    } catch (e) {
                      console.error('Download error', e);
                    } finally {
                      setDownloading((d) => ({ ...d, outbound: false }));
                    }
                  }}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl text-center flex items-center justify-center gap-2"
                >
                  {downloading.outbound ? 'Downloading...' : '📥 Download Outbound Ticket'}
                </button>
              )}

              {bookingResult.return?.downloadUrl && (
                <button
                  onClick={async () => {
                    try {
                      setDownloading((d) => ({ ...d, return: true }));
                      const resp = await bookingAPI.downloadTicket(bookingResult.return._id);
                      const url = window.URL.createObjectURL(new Blob([resp.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `ticket_${bookingResult.return.pnr}.pdf`);
                      document.body.appendChild(link);
                      link.click();
                      link.parentNode.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    } catch (e) {
                      console.error('Download error', e);
                    } finally {
                      setDownloading((d) => ({ ...d, return: false }));
                    }
                  }}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl text-center flex items-center justify-center gap-2"
                >
                  {downloading.return ? 'Downloading...' : '📥 Download Return Ticket'}
                </button>
              )}

              <button
                onClick={() => {
                  onClose();
                  setBookingResult(null);
                  navigate('/');
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-colors shadow-lg hover:shadow-xl"
              >
                ← Back to Home / Select Another Flight
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Booking form
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 transform transition-all">
        {/* Header with back button */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Plane size={24} />
            Complete Booking
          </h2>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
              title="Back"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
          {isEditingPassengers ? (
            <div className="p-6 sm:p-8">
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 font-semibold">Edit passenger names and ages</p>
              </div>
              <div className="space-y-4 mb-6">
                {Array.from({ length: passengerCount }).map((_, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">Passenger {idx + 1} Name *</label>
                      <input
                        type="text"
                        value={passengers[idx]?.name || ''}
                        onChange={(e) => handlePassengerChange(idx, 'name', e.target.value)}
                        placeholder="Full name as per ID"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">Age</label>
                      <input
                        type="number"
                        min="0"
                        value={passengers[idx]?.age || ''}
                        onChange={(e) => handlePassengerChange(idx, 'age', e.target.value)}
                        placeholder="Age"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3 pt-4">
                <button
                  onClick={() => setIsEditingPassengers(false)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
                >
                  ✓ Done Editing
                </button>
                <button
                  onClick={() => setIsEditingPassengers(false)}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-800 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8 bg-gradient-to-b from-gray-50 to-white">
              <div className="bg-white border-2 border-blue-100 rounded-xl p-6 mb-6 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 text-lg">{flight.airline}</h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-gray-100 gap-2">
                    <span className="text-xs text-gray-500 font-semibold uppercase">Flight ID</span>
                    <span className="font-bold text-gray-800 text-right">{flight.flight_id}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-gray-100 gap-2">
                    <span className="text-xs text-gray-500 font-semibold uppercase">Route</span>
                    <span className="font-semibold text-gray-800 text-right">{flight.departure_city} → {flight.arrival_city}</span>
                  </div>
                  {flight.departure_date && (
                    <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-gray-100 gap-2">
                      <span className="text-xs text-gray-500 font-semibold uppercase">Flight Date</span>
                      <span className="font-semibold text-gray-800 text-right">
                        {new Date(flight.departure_date).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  {flight.departure_time && (
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-xs text-gray-500 font-semibold uppercase">Departure Time</span>
                      <span className="font-semibold text-gray-800">{flight.departure_time}</span>
                    </div>
                  )}
                  {flight.arrival_time && (
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-xs text-gray-500 font-semibold uppercase">Arrival Time</span>
                      <span className="font-semibold text-gray-800">{flight.arrival_time}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-gray-100 gap-2">
                    <span className="text-xs text-gray-500 font-semibold uppercase">Number of Passengers</span>
                    <span className="font-bold text-lg text-purple-600">{passengerCount}</span>
                  </div>
                  {/* Price Display */}
                  {returnFlight ? (
                    <>
                      {/* Round Trip - Show Both Legs */}
                      <div className="bg-blue-50 rounded-lg p-3 flex justify-between items-center mt-4 gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-gray-700">Outbound ({passengerCount} passenger{passengerCount > 1 ? 's' : ''})</span>
                        <span className="text-lg sm:text-2xl font-bold text-blue-600">₹{outboundPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 flex justify-between items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-gray-700">Return ({passengerCount} passenger{passengerCount > 1 ? 's' : ''})</span>
                        <span className="text-lg sm:text-2xl font-bold text-green-600">₹{returnPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3 flex justify-between items-center gap-2 mt-2 border-2 border-orange-200">
                        <span className="text-xs sm:text-sm font-semibold text-gray-700">Total Amount</span>
                        <span className="text-lg sm:text-2xl font-bold text-orange-600">₹{totalPrice.toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* One Way - Show Single Price */}
                      <div className="bg-blue-50 rounded-lg p-3 flex justify-between items-center mt-4 gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-gray-700">Price per Passenger</span>
                        <span className="text-lg sm:text-2xl font-bold text-blue-600">₹{flight.current_price.toLocaleString('en-IN')}</span>
                      </div>
                      {passengerCount > 1 && (
                        <div className="bg-orange-50 rounded-lg p-3 flex justify-between items-center gap-2">
                          <span className="text-xs sm:text-sm font-semibold text-gray-700">Total for {passengerCount} Passengers</span>
                          <span className="text-lg sm:text-2xl font-bold text-orange-600">₹{outboundPrice.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Wallet Balance Alert */}
              <div className={`mb-6 rounded-lg p-4 flex items-start gap-3 ${
                walletBalance >= totalPrice
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                {walletBalance >= totalPrice ? (
                  <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                ) : (
                  <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                )}
                <div className="flex-1">
                  <p className={`text-xs font-semibold uppercase ${walletBalance >= totalPrice ? 'text-green-700' : 'text-red-700'}`}>
                    Wallet Balance
                  </p>
                  <p className={`text-lg font-bold mt-1 ${walletBalance >= totalPrice ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{walletBalance.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Required for {passengerCount} passenger{passengerCount > 1 ? 's' : ''}: <span className="font-semibold text-orange-600">₹{totalPrice.toLocaleString('en-IN')}</span>
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-600 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleBooking} className="space-y-4">
                <div className="space-y-3">
                  {Array.from({ length: passengerCount }).map((_, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">Passenger {idx + 1} Name *</label>
                        <input
                          type="text"
                          value={passengers[idx]?.name || ''}
                          onChange={(e) => handlePassengerChange(idx, 'name', e.target.value)}
                          placeholder="Full name as per ID"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">Age</label>
                        <input
                          type="number"
                          min="0"
                          value={passengers[idx]?.age || ''}
                          onChange={(e) => handlePassengerChange(idx, 'age', e.target.value)}
                          placeholder="Age"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                {/* Buttons */}
                <div className="space-y-2 sm:space-y-3 pt-4 sm:pt-6">
                  <button
                    type="submit"
                    disabled={loading || walletBalance < totalPrice}
                    className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading && <Loader size={18} className="animate-spin" />}
                    {loading ? 'Processing...' : '✈️ Confirm Booking'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-100 text-gray-800 font-semibold rounded-lg sm:rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    ← Back / Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
