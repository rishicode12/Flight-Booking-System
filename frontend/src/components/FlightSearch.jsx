import React, { useState, useEffect } from 'react';
import { Plane, Hotel, Map, ChevronDown, User, Loader, AlertCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { flightAPI } from '../api/client';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import BookingModal from './BookingModal';
import WalletDisplay from './WalletDisplay';

// --- Sub- ---

const TabItem = ({ icon: Icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all ${
        active
          ? 'bg-blue-900 text-white rounded-t-lg'
          : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-t-lg'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
};

const RadioOption = ({ label, checked, onChange, value }) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${checked ? 'border-blue-600' : 'border-gray-400 group-hover:border-blue-400'}`}>
        {checked && <div className="w-2 h-2 rounded-full bg-blue-600" />}
      </div>
      <input
        type="radio"
        className="hidden"
        value={value}
        checked={checked}
        onChange={onChange}
      />
      <span className={`text-sm ${checked ? 'font-bold text-gray-800' : 'text-gray-600 group-hover:text-gray-800'}`}>{label}</span>
    </label>
  );
};

const SearchInputCard = ({ label, value, subtext, active, onClick, extraClass = '', customContent }) => {
  return (
    <div
      onClick={onClick}
      className={`h-full flex flex-col p-4 border-r border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors relative ${
        active ? 'bg-blue-50' : 'bg-white'
      } ${extraClass}`}
    >
      <span className="text-sm text-gray-500 font-medium mb-1">{label}</span>
      {customContent ? (
        customContent
      ) : (
        <span className={`text-3xl font-black text-black truncate leading-tight ${!value ? 'text-gray-400' : ''}`}>
          {value || 'Select'}
        </span>
      )}
      <span className="text-sm text-gray-500 truncate mt-1">{subtext}</span>
      
      {active && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 transform scale-x-100 transition-transform" />}
    </div>
  );
};

const FlightResultCard = ({ flight, onBookClick, onSelectReturn, isSelectedReturn, tripType }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden mb-4">
      <div className="flex flex-col md:flex-row items-center justify-between p-6">
        {/* Flight Info */}
        <div className="flex-1 mb-4 md:mb-0">
          <h3 className="text-lg font-bold text-gray-800 mb-2">{flight.airline}</h3>
          <div className="flex items-center gap-4 text-gray-600">
            <div>
              <p className="text-xs text-gray-500 uppercase">From</p>
              <p className="font-semibold">{flight.departure_city}</p>
              <p className="text-sm text-blue-600 font-bold">{flight.departure_time || '--:--'}</p>
            </div>
            <Plane size={20} className="text-blue-600" />
            <div>
              <p className="text-xs text-gray-500 uppercase">To</p>
              <p className="font-semibold">{flight.arrival_city}</p>
              <p className="text-sm text-green-600 font-bold">{flight.arrival_time || '--:--'}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Flight ID: {flight.flight_id}</p>
        </div>

        {/* Price & Book Button */}
        <div className="flex flex-col items-center md:items-end gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-500">Price per passenger</p>
            <p className="text-3xl font-bold text-blue-600">₹{flight.current_price.toLocaleString('en-IN')}</p>
            {flight.base_price !== flight.current_price && (
              <p className="text-xs text-orange-600 mt-1">Base: ₹{flight.base_price.toLocaleString('en-IN')} (Dynamic pricing)</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onBookClick(flight)}
              className="px-6 py-2 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors"
            >
              Book Now
            </button>
            {/* Only show "Set as Return" button for round trip flights */}
            {tripType === 'roundTrip' && (
              <button
                onClick={() => onSelectReturn && onSelectReturn(flight)}
                className={`px-4 py-2 rounded-full border ${isSelectedReturn ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-200 hover:bg-gray-100'}`}
                title="Select as return"
              >
                {isSelectedReturn ? 'Return Selected' : 'Set as Return'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Calendar Date Picker Component
const CalendarDatePicker = ({ selectedDate, onDateSelect, onClose, minDate }) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    return selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
  });

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateDisabled = (date) => {
    if (!minDate) return false;
    const checkDate = new Date(date);
    const minCheckDate = new Date(minDate + 'T00:00:00');
    return checkDate < minCheckDate;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (day) => {
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateString = selected.toISOString().split('T')[0];
    onDateSelect(dateString);
    onClose();
  };

  const days = [];
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthName = currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-2xl z-[9999] p-4 w-80">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <button onClick={handlePrevMonth} className="px-3 py-1 hover:bg-gray-100 rounded text-gray-600 font-bold">
            ←
          </button>
          <span className="font-bold text-gray-800">{monthName}</span>
          <button onClick={handleNextMonth} className="px-3 py-1 hover:bg-gray-100 rounded text-gray-600 font-bold">
            →
          </button>
        </div>
        
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-bold text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} />;
            }
            const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dateString = dateObj.toISOString().split('T')[0];
            const isDisabled = isDateDisabled(dateObj);
            const isSelected = selectedDate === dateString;

            return (
              <button
                key={day}
                onClick={() => !isDisabled && handleDateClick(day)}
                disabled={isDisabled}
                className={`
                  p-2 rounded text-sm font-bold transition-colors
                  ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-blue-100 text-gray-800'}
                  ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
      <button
        onClick={onClose}
        className="w-full py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded transition-colors"
      >
        Close
      </button>
    </div>
  );
};

// Clock-based Time Picker Component
const ClockTimePicker = ({ selectedTime, onTimeSelect, onClose }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const [hour, setHour] = useState(selectedTime ? selectedTime.split(':')[0] : '06');
  const [minute, setMinute] = useState(selectedTime ? selectedTime.split(':')[1] : '00');

  const handleConfirm = () => {
    const timeString = `${hour}:${minute}`;
    onTimeSelect(timeString);
    onClose();
  };

  return (
    <div className="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-2xl z-[9999] p-6 w-72">
      <div className="mb-6">
        {/* Time Display */}
        <div className="bg-blue-600 text-white text-center py-4 rounded-lg mb-6">
          <div className="text-4xl font-bold">{hour}:{minute}</div>
        </div>

        {/* Hour Selector */}
        <div className="mb-6">
          <label className="text-xs font-bold text-gray-600 mb-2 block">Hour</label>
          <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
            {hours.map(h => (
              <button
                key={h}
                onClick={() => setHour(h)}
                className={`
                  p-2 rounded font-bold text-sm transition-colors
                  ${hour === h ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-blue-100 text-gray-800'}
                `}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        {/* Minute Selector */}
        <div className="mb-6">
          <label className="text-xs font-bold text-gray-600 mb-2 block">Minute</label>
          <div className="grid grid-cols-4 gap-2">
            {minutes.map(m => (
              <button
                key={m}
                onClick={() => setMinute(m)}
                className={`
                  p-3 rounded font-bold text-sm transition-colors
                  ${minute === m ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-blue-100 text-gray-800'}
                `}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
        >
          Confirm
        </button>
      </div>
    </div>
  );
};

const FlightSearch = ({ onNavigate = () => {} }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { userId, setUserId } = useUser();
  const [tripType, setTripType] = useState('oneWay');
  const [searchFrom, setSearchFrom] = useState('Delhi');
  const [searchTo, setSearchTo] = useState('');
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD format
  const [departureTime, setDepartureTime] = useState(''); // HH:MM format
  const [returnDate, setReturnDate] = useState('');
  const [flights, setFlights] = useState([]);
  const [allFlights, setAllFlights] = useState([]); // Store all flights for city extraction
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [bookingModal, setBookingModal] = useState({ isOpen: false, flight: null });
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [cities, setCities] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [newUserInput, setNewUserInput] = useState('');
  const [showDepartureDatePicker, setShowDepartureDatePicker] = useState(false);
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);
  const [showTimePickerClock, setShowTimePickerClock] = useState(false);
  const [travellers, setTravellers] = useState(1);
  const [selectedReturnFlight, setSelectedReturnFlight] = useState(null);

  // Seed flights and extract cities on component mount
  useEffect(() => {
    const initializeFlights = async () => {
      // Try to seed flights (silently ignore if they already exist)
      try {
        await flightAPI.seedFlights();
      } catch (err) {
        // Silently ignore seed errors - flights may already exist
      }
      
      // Always fetch all flights to extract unique cities
      try {
        const response = await flightAPI.getAllFlights();
        const flightsList = response.data.data || [];
        setAllFlights(flightsList);
        
        // Extract unique cities
        const uniqueCities = new Set();
        flightsList.forEach(flight => {
          uniqueCities.add(flight.departure_city);
          uniqueCities.add(flight.arrival_city);
        });
        setCities(Array.from(uniqueCities).sort());
      } catch (err) {
        console.error('Error fetching flights:', err.message);
      }
    };
    initializeFlights();
  }, []);

  // Handle search with business logic
  const handleSearch = async () => {
    if (!searchFrom || !searchTo) {
      setError('Please select both departure and arrival cities');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      let response;
      if (searchFrom && searchTo) {
        // Search with filters
        response = await flightAPI.searchFlights(searchFrom, searchTo);
      } else {
        // Get all flights
        response = await flightAPI.getAllFlights();
      }
      let flightsList = response.data.data || [];
      
      // Filter by departure time if selected
      if (departureTime) {
        // Exact match first
        let matched = flightsList.filter(flight => flight.departure_time === departureTime);
        // If no exact matches, attempt to find flights within +/- 60 minutes
        if (matched.length === 0) {
          const timeToMinutesSafe = (t) => {
            if (!t) return null;
            const [hh, mm] = t.split(':').map(Number);
            if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
            return hh * 60 + mm;
          };
          const target = timeToMinutesSafe(departureTime);
          if (target !== null) {
            matched = flightsList.filter(f => {
              const ft = timeToMinutesSafe(f.departure_time);
              return ft !== null && Math.abs(ft - target) <= 60;
            });
          } else {
            matched = [];
          }
        }
        flightsList = matched;
      }
      
      setFlights(flightsList);
      if (flightsList.length === 0) {
        setError(`No flights found from ${searchFrom} to ${searchTo}${departureTime ? ` at ${departureTime}` : ''}. Try different cities or times.`);
      }
    } catch (err) {
      setError(err.message || 'Failed to search flights');
    } finally {
      setLoading(false);
    }
  };

  // Auto-search when filters change (update results when time/cities change)
  useEffect(() => {
    if (searchFrom && searchTo) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departureTime, searchFrom, searchTo]);

  // Clear selected return when switching to one-way
  useEffect(() => {
    if (tripType !== 'roundTrip') setSelectedReturnFlight(null);
  }, [tripType]);

  // Helpers for time comparisons
  const timeToMinutes = (t) => { const [hh, mm] = (t || '').split(':').map(Number); return (hh || 0) * 60 + (mm || 0); };

  // Get available arrival cities based on selected departure city and optional time filter
  const getAvailableArrivalCities = () => {
    let candidates = allFlights.filter(flight => flight.departure_city === searchFrom);
    if (departureTime) {
      const target = timeToMinutes(departureTime);
      const exact = candidates.filter(f => f.departure_time === departureTime);
      if (exact.length > 0) {
        candidates = exact;
      } else {
        // fallback within +/- 60 minutes
        candidates = candidates.filter(f => Math.abs(timeToMinutes(f.departure_time) - target) <= 60);
      }
    }
    return candidates.map(flight => flight.arrival_city)
      .filter((city, index, arr) => arr.indexOf(city) === index)
      .sort();
  };

  // Format date to readable string
  const formatDateDisplay = (dateString) => {
    if (!dateString) return { day: 'Select', month: '', year: '', dayName: '' };
    const date = new Date(dateString + 'T00:00:00');
    const day = date.getDate();
    const month = date.toLocaleDateString('en-IN', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    const dayName = date.toLocaleDateString('en-IN', { weekday: 'short' });
    return { day, month, year, dayName };
  };

  const departureDisplay = formatDateDisplay(departureDate);
  const returnDisplay = formatDateDisplay(returnDate);
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-blue-50 p-4 md:p-8 flex flex-col items-center font-sans">
        
      {/* Navigation Bar Placeholder (to match the feel of a full app) */}
      <nav className="w-full max-w-7xl flex justify-between items-center mb-8 px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center text-white font-bold cursor-pointer" onClick={() => navigate('/')}>F</div>
          <span className="text-xl font-bold text-blue-900 cursor-pointer" onClick={() => navigate('/')}>FlightJet</span>
        </div>
        <div className="flex gap-6 text-sm font-medium text-gray-600">
          <span className="text-blue-600 cursor-pointer" onClick={() => navigate('/')}>Search</span>
          <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate('/bookings')}>My Bookings</span>
          <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate('/profile')}>My Account</span>
        </div>
        <div className="flex items-center gap-3">
          <WalletDisplay />
          
          {/* Profile and Logout */}
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
            title="View profile"
          >
            <User size={18} />
            <span className="text-sm font-semibold text-blue-900">{user?.name || 'User'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
            <span className="text-sm font-semibold">Logout</span>
          </button>
        </div>
      </nav>

      {/* Header Text */}
      <div className="w-full max-w-6xl mb-8 text-center px-2">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-800">
          Hi there, plan your journey with ease – <span className="text-green-600">Flights</span>
        </h1>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-lg relative z-10 mb-8">
        
        {/* Only show Flights tab - removed Hotels & Sight Seeing */}
        <div className="flex px-8 pt-6 gap-2 bg-white rounded-t-xl border-b border-gray-100">
          <TabItem 
            icon={Plane} 
            label="Flights" 
            active={true} 
            onClick={() => {}} 
          />
        </div>

        {/* Form Content */}
        <div className="p-8">
          
          {/* Trip Type & Currency */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="flex gap-8 mb-4 md:mb-0">
              <RadioOption 
                label="One Way" 
                value="oneWay" 
                checked={tripType === 'oneWay'} 
                onChange={() => setTripType('oneWay')} 
              />
              <RadioOption 
                label="Round Trip" 
                value="roundTrip" 
                checked={tripType === 'roundTrip'} 
                onChange={() => setTripType('roundTrip')} 
              />
              {/* <RadioOption 
                label="Multi City" 
                value="multiCity" 
                checked={tripType === 'multiCity'} 
                onChange={() => setTripType('multiCity')} 
              /> */}
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <span className="text-xs font-medium text-gray-500 hidden md:block">Book Domestic Flights</span>
              <button className="flex items-center gap-1 text-sm font-bold text-gray-800 hover:text-blue-600">
                INR <ChevronDown size={14} />
              </button>
            </div>
          </div>

          {/* Search Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 border border-gray-200 rounded-xl overflow-visible mb-8 shadow-sm relative z-20">
            
            {/* From - City Dropdown */}
            <div className="md:col-span-2 relative z-40">
              <div
                className="h-full flex flex-col p-4 border-r border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors bg-blue-50"
                onClick={() => {
                  setShowFromDropdown(!showFromDropdown);
                  setShowToDropdown(false);
                }}
              >
                <span className="text-sm text-gray-500 font-medium mb-1">From</span>
                <span className="text-2xl font-black text-black truncate leading-tight">{searchFrom || 'Select'}</span>
                <span className="text-xs text-gray-500 truncate mt-1">Departure</span>
              </div>
              
              {/* From Dropdown Menu */}
              {showFromDropdown && cities.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-2xl z-50 max-h-64 overflow-y-auto">
                  {cities.map(city => (
                    <div
                      key={city}
                      onClick={() => {
                        setSearchFrom(city);
                        setSearchTo('');
                        setShowFromDropdown(false);
                      }}
                      className={`px-4 py-3 cursor-pointer hover:bg-blue-100 transition-colors ${searchFrom === city ? 'bg-blue-50 font-bold text-blue-600' : ''}`}
                    >
                      {city}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* To - City Dropdown (filtered based on From) */}
            <div className="md:col-span-2 relative z-40">
              <div
                className="h-full flex flex-col p-4 border-r border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={() => {
                  setShowToDropdown(!showToDropdown);
                  setShowFromDropdown(false);
                }}
              >
                <span className="text-sm text-gray-500 font-medium mb-1">To</span>
                <span className={`text-2xl font-black truncate leading-tight ${searchTo ? 'text-black' : 'text-gray-400'}`}>
                  {searchTo || 'Going to?'}
                </span>
                <span className="text-xs text-gray-500 truncate mt-1">Arrival</span>
              </div>
              
              {/* To Dropdown Menu */}
              {showToDropdown && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-2xl z-50 max-h-64 overflow-y-auto">
                  {getAvailableArrivalCities().length > 0 ? (
                    getAvailableArrivalCities().map(city => (
                      <div
                        key={city}
                        onClick={() => {
                          setSearchTo(city);
                          setShowToDropdown(false);
                        }}
                        className={`px-4 py-3 cursor-pointer hover:bg-blue-100 transition-colors ${searchTo === city ? 'bg-blue-50 font-bold text-blue-600' : ''}`}
                      >
                        {city}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-sm">No destinations from {searchFrom}</div>
                  )}
                </div>
              )}
            </div>

            {/* Departure Date Picker */}
            <div className="md:col-span-2 relative z-30">
              <button
                onClick={() => {
                  setShowDepartureDatePicker(!showDepartureDatePicker);
                  setShowReturnDatePicker(false);
                  setShowTimePickerClock(false);
                }}
                type="button"
                className="h-full w-full flex flex-col p-4 border-r border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors bg-white text-left"
              >
                <span className="text-sm text-gray-500 font-medium mb-1">Departure</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-black">{departureDisplay.day}</span>
                  <span className="text-lg font-medium text-black">{departureDisplay.month}</span>
                  <span className="text-xs font-medium text-gray-500">'{departureDisplay.year}</span>
                </div>
                <span className="text-xs text-gray-500 truncate mt-1">{departureDisplay.dayName}</span>
              </button>
              {showDepartureDatePicker && (
                <CalendarDatePicker
                  selectedDate={departureDate}
                  onDateSelect={setDepartureDate}
                  onClose={() => setShowDepartureDatePicker(false)}
                  minDate={new Date().toISOString().split('T')[0]}
                />
              )}
            </div>

            {/* Departure Time Picker */}
            <div className="md:col-span-2 relative z-30">
              <button
                onClick={() => {
                  setShowTimePickerClock(!showTimePickerClock);
                  setShowDepartureDatePicker(false);
                  setShowReturnDatePicker(false);
                }}
                type="button"
                className="h-full w-full flex flex-col p-4 border-r border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors bg-white text-left"
              >
                <span className="text-sm text-gray-500 font-medium mb-1">Dep. Time</span>
                <span className="text-2xl font-black text-black">
                  {departureTime || 'Any time'}
                </span>
                <span className="text-xs text-gray-500 truncate mt-1">
                  {departureTime ? 'Click to change' : 'Select time'}
                </span>
              </button>
              {showTimePickerClock && (
                <ClockTimePicker
                  selectedTime={departureTime}
                  onTimeSelect={setDepartureTime}
                  onClose={() => setShowTimePickerClock(false)}
                />
              )}
            </div>

            {/* Return Date Picker (for Round Trip) */}
            <div className="md:col-span-2 relative">
              {tripType === 'roundTrip' ? (
                <>
                  <div
                    onClick={() => {
                      setShowReturnDatePicker(!showReturnDatePicker);
                      setShowDepartureDatePicker(false);
                      setShowTimePickerClock(false);
                    }}
                    className="h-full flex flex-col p-4 border-r border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors bg-white"
                  >
                    <span className="text-sm text-gray-500 font-medium mb-1">Return</span>
                    {returnDate ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-black">{returnDisplay.day}</span>
                        <span className="text-lg font-medium text-black">{returnDisplay.month}</span>
                        <span className="text-xs font-medium text-gray-500">'{returnDisplay.year}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-gray-400 mt-2 leading-snug">Add return date</span>
                    )}
                    {returnDate && <span className="text-xs text-gray-500 truncate mt-1">{returnDisplay.dayName}</span>}
                  </div>
                  {showReturnDatePicker && (
                    <CalendarDatePicker
                      selectedDate={returnDate}
                      onDateSelect={setReturnDate}
                      onClose={() => setShowReturnDatePicker(false)}
                      minDate={departureDate || new Date().toISOString().split('T')[0]}
                    />
                  )}
                </>
              ) : (
                <div className="h-full flex flex-col p-4 border-r border-gray-200 bg-white">
                  <span className="text-sm text-gray-500 font-medium mb-1">Return</span>
                  <span className="text-sm font-medium text-gray-400 mt-2 leading-snug">
                    Not applicable for one-way trips
                  </span>
                </div>
              )}
            </div>

            {/* Travellers */}
            <div className="md:col-span-2">
              <div className="h-full flex flex-col p-4 bg-white">
                <span className="text-sm text-gray-500 font-medium mb-1">Travellers</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setTravellers(prev => Math.max(1, prev - 1))}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold"
                    aria-label="Decrease travellers"
                  >
                    −
                  </button>
                  <div className="text-center">
                    <div className="text-3xl font-black text-black">{travellers}</div>
                    <div className="text-sm font-medium text-gray-700">Passenger{travellers>1?'s':''}</div>
                  </div>
                  <button
                    onClick={() => setTravellers(prev => Math.min(9, prev + 1))}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold"
                    aria-label="Increase travellers"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-gray-500 mt-2">Economy</span>
              </div>
            </div>
          </div>

          {/* Bottom Options & Search Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full md:w-auto px-12 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-2xl font-bold rounded-full shadow-lg hover:from-blue-600 hover:to-blue-700 hover:shadow-xl uppercase tracking-wider transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader size={24} className="animate-spin" />}
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

        </div>
        
        {/* Deal/Offer Side Tab (Visual Flourish) */}
        {/* <div className="absolute top-1/2 -right-12 transform -translate-y-1/2 rotate-90 hidden xl:block">
            <button className="bg-blue-900 text-white px-6 py-2 rounded-t-lg font-bold shadow-md hover:bg-blue-800 text-sm tracking-wide">
                Deals and Offers
            </button>
        </div> */}
      </div>

      {/* Search Results */}
      {searched && (
        <div className="w-full max-w-6xl">
          {loading && (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <Loader size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Searching for flights...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl shadow-lg p-6 mb-4">
              <div className="flex items-start gap-4">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="text-red-800 font-semibold">Search error</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && flights.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Available Flights ({flights.length})
              </h2>

              {tripType === 'roundTrip' && selectedReturnFlight && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-semibold">Selected Return Flight</p>
                    <p className="font-bold text-gray-800">{selectedReturnFlight.airline} — {selectedReturnFlight.departure_city} → {selectedReturnFlight.arrival_city} ({selectedReturnFlight.departure_time || '--:--'})</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedReturnFlight(null)} className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50">Clear</button>
                  </div>
                </div>
              )}
              {flights.map((flight) => (
                <FlightResultCard
                  key={flight._id}
                  flight={flight}
                  tripType={tripType}
                  onBookClick={(selectedFlight) =>
                    setBookingModal({ isOpen: true, flight: selectedFlight })
                  }
                  onSelectReturn={(f) => setSelectedReturnFlight(prev => prev && prev._id === f._id ? null : f)}
                  isSelectedReturn={selectedReturnFlight?._id === flight._id}
                />
              ))}
            </div>
          )}

          {!loading && flights.length === 0 && !error && (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <Plane size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No flights found</p>
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        flight={bookingModal.flight}
        returnFlight={tripType === 'roundTrip' ? selectedReturnFlight : null}
        isOpen={bookingModal.isOpen}
        onClose={() => setBookingModal({ isOpen: false, flight: null })}
        passengerCount={travellers}
        onBookingSuccess={() => {
          setBookingModal({ isOpen: false, flight: null });
          handleSearch(); // Refresh flights
        }}
      />
    </div>
  );
};

export default FlightSearch;
