# Flight Booking System - Frontend & Backend Integration Guide

## ✅ System Architecture & Integration Complete

The entire Flight Booking System is now fully integrated with working API connections from frontend to backend.

---

## 🏗️ System Architecture

### Frontend Stack
- **React 18** - UI framework
- **Tailwind CSS** - Responsive styling
- **Axios** - API client with interceptors
- **Lucide React** - Icon library
- **Vite** - Build tool
- **Context API** - Global state management (UserContext)

### Backend Stack
- **Express.js 5.2** - REST API framework
- **MongoDB** - Database (Mongoose ODM)
- **PDFKit** - PDF generation
- **Cors** - Cross-origin requests
- **Dotenv** - Environment configuration

---

## 🔌 API Configuration

### Base URL
```
http://localhost:5000/api
```

### API Client Location
`frontend/src/api/client.js` - Centralized API client with:
- Axios instance with default config
- Request/Response interceptors
- Organized API methods by domain (flights, bookings, wallet)
- Error handling

---

## 📊 Data Flow & Features

### 1. **Flight Search & Booking Flow**

**Page**: `FlightSearch.jsx`

**Steps**:
1. Component mount → Auto-seed flights via `POST /api/flights/seed`
2. User enters departure/arrival cities
3. Click "Search" → Call `GET /api/flights/search?from=&to=`
4. Display flight results in `FlightResultCard` component
5. User clicks "Book Now" → Open `BookingModal`
6. Enter passenger name → Submit booking
7. Backend processes:
   - Records booking attempt in `BookingAttempt` collection
   - Applies dynamic pricing (3 attempts in 5 min = 10% increase)
   - Deducts from wallet atomically
   - Generates unique PNR
   - Creates PDF ticket
   - Saves booking to database
8. Success screen displays PNR and download link
9. Wallet balance updates in real-time

**API Endpoints Used**:
- `POST /api/flights/seed` - Seed 12 flights
- `GET /api/flights` - Get all flights (10)
- `GET /api/flights/search?from=Delhi&to=Mumbai` - Search flights
- `POST /api/bookings` - Create booking

---

### 2. **Wallet Management**

**Component**: `WalletDisplay.jsx`

**Features**:
- Display current balance with ₹ symbol
- Refresh button to sync from backend
- Updates automatically after booking
- Default balance: ₹50,000

**API Endpoints**:
- `GET /api/wallet?userId=user123` - Fetch balance
- `POST /api/wallet/deduct` - Deduct amount (used internally during booking)

---

### 3. **Booking History & PDF Download**

**Page**: `BookingHistory.jsx`

**Features**:
- Fetch all user bookings
- Display flight details, passenger info, PNR, amount paid, booking date
- Download ticket PDF button
- Loading, error, and empty states
- Responsive grid layout

**API Endpoints**:
- `GET /api/bookings?userId=user123` - Get user's bookings
- `GET /api/bookings/:bookingId/ticket` - Download PDF

---

### 4. **Global State Management**

**Context**: `UserContext.jsx`

**Manages**:
- `userId` - Current user ID (mocked as 'user123')
- `walletBalance` - Current wallet balance
- `loadingWallet` - Loading state for balance fetch
- `fetchWalletBalance()` - Refetch balance from backend
- `updateWalletBalance(newBalance)` - Update balance after booking

**Usage**:
```jsx
import { useUser } from '../context/UserContext';

function MyComponent() {
  const { userId, walletBalance, updateWalletBalance } = useUser();
  // Use in component...
}
```

---

## 🔒 Business Logic Implementation

### Dynamic Pricing
- **Trigger**: Same user books same flight 3+ times within 5 minutes
- **Action**: Increase `current_price` by 10%
- **Reset**: After 10 minutes without booking, reset to `base_price`
- **Storage**: BookingAttempt collection with TTL index (15 min auto-delete)

### Wallet Safety
- **Atomic Transactions**: MongoDB sessions ensure deduction + booking consistency
- **Pre-check**: Verify balance before showing booking form
- **Error Handling**: Rollback if deduction fails
- **Default Balance**: ₹50,000 for new users

### PDF Ticket Generation
- **Trigger**: After successful booking
- **Content**: Passenger name, airline, flight ID, route, PNR, price, date/time, booking ID
- **Storage**: `backend/tickets/` directory with TTL cleanup
- **Download**: Stream PDF from `/api/bookings/:bookingId/ticket`

---

## 🚀 How to Run

### Prerequisites
```bash
# Node.js v16+ and MongoDB running locally or connection string in .env
```

### Backend Setup
```bash
cd "d:\Flight Booking System\backend"
npm install
echo "MONGO_URI=mongodb://localhost:27017/flight-booking" > .env
echo "PORT=5000" >> .env
node server.js
# Should log: "Server running on port 5000"
```

### Frontend Setup
```bash
cd "d:\Flight Booking System\frontend"
npm install
npm run dev
# Opens on http://localhost:5174
```

### First-Time Setup
1. Open frontend app
2. FlightSearch component auto-seeds flights
3. Enter from/to cities and click "Search"
4. Results appear with dynamic prices
5. Click "Book Now" on any flight
6. Enter passenger name and confirm
7. Booking success → Download ticket
8. Navigate to "My Bookings" to see history

---

## 📁 Project Structure

```
Flight Booking System/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── flightController.js
│   │   ├── bookingController.js
│   │   └── walletController.js
│   ├── models/
│   │   ├── Flight.js
│   │   ├── Booking.js
│   │   ├── BookingAttempt.js
│   │   └── User.js
│   ├── routes/
│   │   ├── flightRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── walletRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   ├── flightService.js
│   │   ├── pricingService.js
│   │   ├── walletService.js
│   │   └── pdfService.js
│   ├── tickets/ (PDF storage)
│   ├── server.js
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── client.js (API client)
    │   ├── context/
    │   │   └── UserContext.jsx (Global state)
    │   ├── components/
    │   │   ├── FlightSearch.jsx (Main search page)
    │   │   ├── BookingHistory.jsx (Booking history page)
    │   │   ├── BookingModal.jsx (Booking form)
    │   │   └── WalletDisplay.jsx (Wallet widget)
    │   ├── App.jsx (Route switcher)
    │   ├── main.jsx (Entry point with UserProvider)
    │   └── index.css (Tailwind + globals)
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

---

## 🔄 Complete User Journey

1. **Launch App** → FlightSearch page loads, auto-seeds flights
2. **Search** → Enter cities, click Search
3. **Select Flight** → Click "Book Now" on desired flight
4. **Booking Modal** → Enter passenger name, see price & wallet balance
5. **Confirm** → Click "Confirm Booking"
6. **Backend Processing**:
   - Check wallet balance
   - Record booking attempt (for dynamic pricing)
   - Apply dynamic pricing rules
   - Deduct from wallet (atomic transaction)
   - Generate PNR
   - Create PDF ticket
   - Save booking to database
7. **Success Screen** → Display PNR, price paid, remaining balance
8. **Download Ticket** → Click button to download PDF
9. **View History** → Click "My Bookings" to see all bookings
10. **Download Again** → From history page, click "Download Ticket" on any booking

---

## ✨ Key Features Implemented

- ✅ Flight search with dynamic filtering
- ✅ Real-time price updates and dynamic pricing
- ✅ Secure wallet transactions (atomic MongoDB sessions)
- ✅ Automatic PNR generation
- ✅ Professional PDF ticket generation
- ✅ Booking history with full details
- ✅ PDF download from history
- ✅ Real-time wallet balance display
- ✅ Error handling and validation
- ✅ Loading and empty states
- ✅ Responsive Tailwind UI
- ✅ Global state management (UserContext)
- ✅ Centralized API client with interceptors

---

## 🐛 Troubleshooting

### Backend won't start
```
Error: Cannot connect to MongoDB
→ Ensure MongoDB is running or update MONGO_URI in .env
```

### Frontend can't reach backend
```
Error: Network Error / CORS error
→ Check backend is running on http://localhost:5000
→ Verify CORS is enabled in server.js
```

### PDF download fails
```
Error: Ticket PDF not found
→ Ensure backend/tickets/ directory exists
→ Check server is not running in read-only filesystem
```

### Wallet balance doesn't update
```
→ Try refresh button in WalletDisplay
→ Check userId matches in backend and frontend
```

---

## 📝 Environment Variables

### Backend (.env)
```
MONGO_URI=mongodb://localhost:27017/flight-booking
PORT=5000
NODE_ENV=development
```

### Frontend
```
# Optional in vite.config.js
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🎯 Next Steps (Optional Enhancements)

- Add user authentication (JWT)
- Implement filters (price range, airline, time)
- Add seat selection
- Email confirmation notifications
- Payment gateway integration
- Admin dashboard for pricing management
- Analytics and reporting
- Multi-language support
- Dark mode

---

**System Status**: ✅ **FULLY INTEGRATED & TESTED**

All frontend components are connected to backend APIs with proper error handling, loading states, and business logic implementation.
