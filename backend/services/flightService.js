const Flight = require('../models/Flight');

// Programmatically generate demo flights for seeding
const generateSampleFlights = (options = {}) => {
  const {
    departureCities = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'],
    airlines = ['Air India', 'SpiceJet', 'Vistara', 'IndiGo', 'Akasa', 'GoAir'],
    flightsPerDeparture = 100,
    minuteStep = 15,
    totalFlights = null,
  } = options;

  const flights = [];
  // Build time slots across 24h in minuteStep increments
  const slots = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += minuteStep) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }

  let globalCounter = 1000;

  departureCities.forEach((depCity, depIdx) => {
    // arrival cities: all other cities
    const arrivalCities = departureCities.filter(c => c !== depCity);
    let slotIdx = depIdx % slots.length;

    for (let i = 0; i < flightsPerDeparture; i++) {
      const arrCity = arrivalCities[i % arrivalCities.length];
      const depTime = slots[slotIdx % slots.length];
      // duration 60-240 minutes (1-4 hours)
      const durationMin = 60 + ((i * 37) % 180);
      const [dh, dm] = depTime.split(':').map(Number);
      
      // Create departure date: today or next 7 days (cycling)
      const departureDate = new Date();
      departureDate.setDate(departureDate.getDate() + (i % 7));
      departureDate.setHours(dh, dm, 0, 0);
      
      const arrDate = new Date(departureDate.getTime() + durationMin * 60000);
      const arrTime = `${String(arrDate.getHours()).padStart(2, '0')}:${String(arrDate.getMinutes()).padStart(2, '0')}`;

      const airline = airlines[(depIdx + i) % airlines.length];
      const code = airline.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,3);
      const flight_id = `${code}${globalCounter}`;

      // Ensure base_price in range ₹2000 - ₹3000 as per assignment
      const basePrice = 2000 + ((depIdx * 7 + i * 13) % 1001); // results 2000..3000
      const currentPrice = Math.round(basePrice * (1 + ((i % 10) * 0.02)));

      flights.push({
        flight_id,
        airline,
        departure_city: depCity,
        arrival_city: arrCity,
        departure_date: departureDate,
        departure_time: depTime,
        arrival_time: arrTime,
        base_price: basePrice,
        current_price: currentPrice,
        last_price_update: new Date(),
      });

      globalCounter++;
      slotIdx++;

      // If totalFlights requested, stop once reached
      if (totalFlights && flights.length >= totalFlights) return flights;
    }
  });

  return flights;
};

// Seed flights into database (programmatic)
const seedFlights = async () => {
  try {
    const existingFlights = await Flight.countDocuments();
    const departureCities = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai'];
    const targetTotal = 20; // Seed exactly 20 flights to match assignment

    if (existingFlights >= targetTotal) {
      return { success: false, message: 'Sufficient flights already exist in database' };
    }

    const sampleFlights = generateSampleFlights({ departureCities, flightsPerDeparture: 5, minuteStep: 15, totalFlights: targetTotal });
    // Ensure we only insert up to targetTotal
    const toInsert = sampleFlights.slice(0, targetTotal);
    const flights = await Flight.insertMany(toInsert);
    return { success: true, message: `${flights.length} flights seeded successfully`, data: flights };
  } catch (error) {
    throw new Error(`Error seeding flights: ${error.message}`);
  }
};

// Get all flights
const getAllFlights = async () => {
  try {
    // Return all flights so frontend can derive available arrival cities
    const flights = await Flight.find().sort({ departure_city: 1, departure_time: 1 });
    return flights;
  } catch (error) {
    throw new Error(`Error fetching flights: ${error.message}`);
  }
};

// Search flights by departure and arrival city
const searchFlights = async (from, to) => {
  try {
    const query = {};
    
    if (from) {
      query.departure_city = { $regex: from, $options: 'i' };
    }
    
    if (to) {
      query.arrival_city = { $regex: to, $options: 'i' };
    }
    
    // Return up to 10 flights from DB as required by the assignment
    const flights = await Flight.find(query).sort({ departure_time: 1 }).limit(10);
    return flights;
  } catch (error) {
    throw new Error(`Error searching flights: ${error.message}`);
  }
};

module.exports = {
  seedFlights,
  getAllFlights,
  searchFlights,
};
