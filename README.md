# Flight Booking System

A full-stack flight booking application built with React and Node.js, featuring dynamic pricing, wallet management, PDF ticket generation, and complete booking history tracking.

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Setup Instructions](#setup-instructions)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Features Implementation](#features-implementation)
- [Screenshots](#screenshots)

## 🎯 About

This project is a complete end-to-end flight booking system that allows users to search, book, and manage flight reservations. The system includes dynamic pricing based on booking patterns, an integrated wallet system for payments, automated PDF ticket generation, and comprehensive booking history management.

## ✨ Features

### Core Requirements ✅

1. **Flight Search Module**
   - Database-driven flight search (MongoDB)
   - 12+ seeded flights with complete details
   - Search by departure/arrival cities
   - Filter by departure time
   - Returns 10 flights per search query

2. **Dynamic Pricing Engine**
   - Surge pricing when same flight booked 3+ times within 5 minutes
   - Automatic 10% price increase after threshold
   - Price resets to base_price after 10 minutes of inactivity
   - Real-time price updates displayed in UI

3. **Wallet System**
   - Default wallet balance: ₹50,000
   - Automatic balance deduction on booking
   - Insufficient balance validation
   - Real-time balance updates in UI
   - Wallet balance visible across all pages

4. **PDF Ticket Generation**
   - Automatic PDF generation after booking
   - Modern, clean ticket design
   - Includes: Passenger details, flight info, route, price, PNR, booking date
   - Separate tickets for outbound and return flights (round trips)
   - Download tickets anytime from booking history

5. **Booking History**
   - Complete booking history page
   - Displays all flight details, amounts paid, dates, PNRs
   - Download ticket buttons for each booking
   - Filter by booking date
   - Responsive card-based layout

### Bonus Features 🎁

- ✅ **User Authentication** - Login/Register with JWT tokens
- ✅ **Responsive UI** - Built with TailwindCSS, mobile-friendly
- ✅ **Round Trip Bookings** - Support for round trip flights with separate tickets
- ✅ **Multi-passenger Support** - Book for 1-9 passengers per flight
- ✅ **Search by Cities** - Filter flights by departure/arrival cities
- ✅ **Time-based Filtering** - Filter flights by departure time
- ✅ **Clean Git History** - Well-structured commits
- ✅ **Error Handling** - Comprehensive error handling throughout
- ✅ **Modern UI/UX** - Clean, intuitive interface with smooth animations

## 🛠 Technology Stack

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **PDFKit** - PDF generation
- **bcryptjs** - Password hashing

## 📁 Project Structure

```
Flight Booking System/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── bookingController.js  # Booking operations
│   │   ├── flightController.js   # Flight operations
│   │   └── userController.js     # User operations
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT authentication
│   ├── models/
│   │   ├── Booking.js            # Booking schema
│   │   ├── Flight.js             # Flight schema
│   │   ├── User.js               # User schema
│   │   └── BookingAttempt.js     # Dynamic pricing tracking
│   ├── routes/
│   │   ├── authRoutes.js         # Auth endpoints
│   │   ├── bookingRoutes.js      # Booking endpoints
│   │   ├── flightRoutes.js       # Flight endpoints
│   │   └── walletRoutes.js       # Wallet endpoints
│   ├── services/
│   │   ├── authService.js        # Auth utilities
│   │   ├── pdfService.js         # PDF generation
│   │   ├── pricingService.js     # Dynamic pricing logic
│   │   └── walletService.js      # Wallet operations
│   ├── tickets/                  # Generated PDF tickets
│   ├── utils/
│   │   └── asyncHandler.js       # Async error wrapper
│   ├── .env                      # Environment variables
│   ├── package.json
│   └── server.js                 # Express server
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js         # API client configuration
│   │   ├── components/
│   │   │   ├── BookingHistory.jsx    # Booking history page
│   │   │   ├── BookingModal.jsx      # Booking form modal
│   │   │   ├── FlightSearch.jsx      # Flight search page
│   │   │   ├── ProtectedRoute.jsx    # Route protection
│   │   │   └── WalletDisplay.jsx     # Wallet balance display
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # Authentication context
│   │   │   └── UserContext.jsx       # User context
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx         # Login page
│   │   │   └── UserProfilePage.jsx   # User profile page
│   │   ├── App.jsx                # Main app component
│   │   ├── main.jsx               # Entry point
│   │   └── index.css              # Global styles
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## 📝 Requirements

### Database Requirements
- MongoDB (local or cloud instance)
- 12+ flights seeded with complete flight information
- Each flight includes: `flight_id`, `airline`, `departure_city`, `arrival_city`, `base_price` (₹2000-₹3000)

### Dynamic Pricing Rules
- Track booking attempts per flight per user
- If same flight booked 3+ times within 5 minutes → increase price by 10%
- After 10 minutes of inactivity → reset to `base_price`
- Price updates reflected in real-time

### Wallet Requirements
- Default balance: ₹50,000
- Deduct total price on successful booking
- Validate balance before booking
- Show clear error messages for insufficient balance

### PDF Ticket Requirements
- Generate PDF automatically after booking
- Include: Passenger name, airline, flight ID, route, price, booking date/time, PNR
- Downloadable via booking history
- Modern, readable design

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)
- **npm** or **yarn**

### Step 1: Clone the Repository

```bash
git clone https://github.com/rishicode12/Flight-Booking-System.git
cd Flight-Booking-System
```

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env  # or create manually
```

Configure your `.env` file:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/flight-booking
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

### Step 3: Database Setup

1. **Local MongoDB**: Ensure MongoDB is running on your machine
   ```bash
   # On Windows
   mongod
   
   # On Mac/Linux
   sudo systemctl start mongod
   ```

2. **MongoDB Atlas**: Update `MONGODB_URI` in `.env` with your Atlas connection string

3. **Seed Flights**: The flights will be seeded automatically on first API call, or you can manually trigger:
   ```bash
   # Start the server, then call the seed endpoint
   curl http://localhost:5000/api/flights/seed
   ```

### Step 4: Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install
```

### Step 5: Configure API URL (if needed)

The frontend is configured to connect to `http://localhost:5000/api` by default. To change this:

1. Create `.env` file in `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

## 🏃 Running the Application

### Start Backend Server

```bash
cd backend
npm start
# or for development with auto-reload
npm run dev
```

The backend server will start on `http://localhost:5000`

### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173` (or another port if 5173 is busy)

### Build for Production

```bash
# Frontend production build
cd frontend
npm run build

# Backend (no build step needed, runs directly)
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - Logout user

### Flights
- `GET /api/flights` - Get all flights
- `GET /api/flights/search?from=Delhi&to=Mumbai` - Search flights
- `POST /api/flights/seed` - Seed flights into database

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - Get user's bookings
- `GET /api/bookings/:bookingId` - Get booking by ID
- `GET /api/bookings/:bookingId/ticket` - Download ticket PDF

### Wallet
- `GET /api/wallet?userId=xxx` - Get wallet balance
- `POST /api/wallet/deduct` - Deduct balance (internal use)

## 🎨 Features Implementation

### 1. Flight Search Module

- **Database-driven**: All flights stored in MongoDB
- **12+ flights seeded**: Includes major Indian cities (Delhi, Mumbai, Bangalore, etc.)
- **Search functionality**: Filter by departure and arrival cities
- **Time filtering**: Filter flights by departure time
- **10 flights per search**: Returns exactly 10 flights from database

**Implementation Details:**
- Flights seeded with realistic data
- Indexed database queries for fast search
- Case-insensitive city search
- Real-time price display with dynamic pricing

### 2. Dynamic Pricing Engine

- **Booking attempt tracking**: Records each booking attempt in `BookingAttempt` collection
- **5-minute window**: Tracks attempts within 5-minute intervals
- **3+ attempts trigger**: Increases price by 10% after 3 attempts
- **Auto-reset**: Price resets to `base_price` after 10 minutes
- **TTL index**: Automatic cleanup of old booking attempts (15 minutes)

**Implementation Details:**
```javascript
// Price calculation logic
if (bookingAttempts >= 3) {
  current_price = base_price * 1.10  // 10% increase
}
// Auto-reset after 10 minutes of inactivity
```

### 3. Wallet System

- **Default balance**: ₹50,000 for all new users
- **Atomic transactions**: MongoDB sessions ensure data consistency
- **Balance validation**: Pre-booking validation with clear error messages
- **Real-time updates**: Balance updates immediately after booking
- **Secure deductions**: Atomic wallet operations prevent race conditions

**Implementation Details:**
- Wallet balance stored in User model
- Transaction-based deduction during booking
- Optimistic UI updates for instant feedback
- Error handling for insufficient balance

### 4. PDF Ticket Generation

- **Automatic generation**: PDF created after successful booking
- **Modern design**: Clean, professional ticket layout
- **Complete information**: All required fields included
- **Round trip support**: Separate tickets for outbound and return
- **Re-downloadable**: Tickets accessible from booking history

**Ticket Includes:**
- Passenger name(s) and details
- Airline and Flight ID
- Route (Departure → Arrival)
- Departure/Arrival times
- Flight date
- Final price paid
- Booking date and time
- Unique PNR (Passenger Name Record)

### 5. Booking History

- **Complete history**: All bookings displayed chronologically
- **Detailed view**: Flight info, passenger details, amounts, dates
- **PNR display**: Unique booking reference for each ticket
- **Download buttons**: Re-download tickets anytime
- **Round trip support**: Separate entries for outbound and return flights
- **Responsive design**: Works on all screen sizes

## 🖼 Screenshots

### Flight Search Page
- Search by cities with autocomplete
- Filter by departure time
- Select one-way or round trip
- View available flights with pricing

### Booking Modal
- Passenger details form
- Wallet balance display
- Price breakdown (outbound/return)
- Booking confirmation

### Booking History
- All bookings listed
- Flight details cards
- Download ticket buttons
- Booking dates and amounts

### PDF Ticket
- Professional ticket design
- All booking information
- Downloadable format

## 🔐 Authentication

The system includes complete user authentication:

- **Registration**: Create account with name, email, password
- **Login**: Secure login with JWT tokens
- **Protected Routes**: Booking and history pages require authentication
- **Session Management**: Token-based authentication with secure storage

## 🎯 Dynamic Pricing Example

1. User searches for "Delhi to Mumbai"
2. Selects flight and attempts booking 3 times within 5 minutes
3. Price increases from ₹2,500 to ₹2,750 (10% increase)
4. After 10 minutes, price resets to ₹2,500
5. Real-time price updates shown in UI

## 💰 Wallet Flow

1. User registers → Gets ₹50,000 default balance
2. Searches and selects flight → Sees current price
3. Enters booking details → System validates balance
4. Confirms booking → Balance deducted atomically
5. Wallet updates immediately → New balance shown in UI
6. Booking confirmed → PDF ticket generated

## 🔄 Round Trip Bookings

- Select outbound flight → Search for return flight
- Both flights booked together → Total price calculated
- Two separate tickets generated → One for each leg
- Different PNRs assigned → Outbound (XXXO) and Return (XXXR)
- Correct route display → Return shows reversed cities

## 🐛 Error Handling

- **Network errors**: Graceful error messages
- **Validation errors**: Clear field-specific messages
- **Insufficient balance**: Detailed error with required amount
- **Flight not found**: Helpful search suggestions
- **Server errors**: User-friendly error pages

## 📦 Dependencies

### Backend
- express
- mongoose
- jsonwebtoken
- bcryptjs
- pdfkit
- dotenv
- cors

### Frontend
- react
- react-router-dom
- axios
- tailwindcss
- lucide-react
- vite

## 🤝 Contributing

This is a technical assignment project. Contributions are welcome, but please ensure:

1. Code follows existing patterns
2. All features are tested
3. README is updated
4. Git commits are meaningful

## 📄 License

This project is created as a technical assignment for XTechnon.

## 👨‍💻 Author

**Rishi Code**
- GitHub: [@rishicode12](https://github.com/rishicode12)

## 🙏 Acknowledgments

- XTechnon for the technical assignment requirements
- MongoDB for the database solution
- React and Node.js communities for excellent documentation

---

**Note**: This project was built as a full-stack technical assignment demonstrating proficiency in React, Node.js, MongoDB, and modern web development practices.
