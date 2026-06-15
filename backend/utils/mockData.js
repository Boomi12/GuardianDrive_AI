export const mockDestinations = {
  mysore: {
    name: "Mysore",
    attractions: [
      { name: "Mysore Palace", type: "Heritage", location: "Manoj Vihar, Mysore", rating: 4.8, description: "Grand architecture with spectacular Sunday night lighting and historical museum." },
      { name: "Chamundi Hill Temple", type: "Spiritual", location: "Chamundi Hills", rating: 4.6, description: "Beautiful ancient temple with panoramic city views and a giant Nandi statue." },
      { name: "Brindavan Gardens", type: "Nature", location: "KRS Dam", rating: 4.3, description: "Scenic terraced gardens featuring colorful musical fountain shows in the evening." }
    ],
    restaurants: [
      { name: "Hotel Mylari", cuisine: "South Indian", location: "Nazarbad", rating: 4.7, budget: "Low" },
      { name: "Gufha Restaurant", cuisine: "Multi-cuisine", location: "Devaraja Mohalla", rating: 4.2, budget: "Medium" },
      { name: "The Olive Garden", cuisine: "Italian / Indian", location: "Windflower Resort", rating: 4.5, budget: "High" }
    ],
    restStops: [
      { name: "Highway Nest Food Plaza", type: "Food Court", location: "Bangalore-Mysore Expressway", facilities: ["Restrooms", "Fast Food", "Ample Parking"] },
      { name: "Cafe Coffee Day - Highway Stop", type: "Cafe", location: "Mandya", facilities: ["Clean Restrooms", "Coffee", "AC Lounge"] }
    ],
    haltingPlaces: [
      { name: "The Windflower Resort & Spa", type: "Resort", rating: 4.6, pricePerNight: "₹8,000/night" },
      { name: "Radisson Blu Plaza Hotel", type: "Luxury", rating: 4.7, pricePerNight: "₹10,500/night" }
    ],
    fuelChargingStops: [
      { name: "Tata Power EV Fast Charger", type: "EV", status: "Active", location: "Radisson Blu Parking" },
      { name: "HP CL Petrol Pump - Mysore Road", type: "Fuel", status: "Active", location: "Mysore Bypass" }
    ]
  },
  coorg: {
    name: "Coorg",
    attractions: [
      { name: "Abbey Falls", type: "Nature", location: "Madikeri", rating: 4.5, description: "Stunning waterfall nestled inside lush coffee plantations and spice gardens." },
      { name: "Raja's Seat", type: "Scenic Viewpoint", location: "Madikeri", rating: 4.4, description: "Historic seasonal garden and sunset viewpoint of the misty Coorg valleys." },
      { name: "Namdroling Golden Temple", type: "Spiritual", location: "Bylakuppe", rating: 4.8, description: "Large Tibetan settlement with magnificent golden Buddha statues and temple complex." }
    ],
    restaurants: [
      { name: "Coorg Cuisine", cuisine: "Kodava Local", location: "Madikeri", rating: 4.6, budget: "Medium" },
      { name: "Raintree Restaurant", cuisine: "Fine Dining / Local", location: "Madikeri", rating: 4.3, budget: "High" },
      { name: "East End Hotel", cuisine: "Biryani / South Indian", location: "Madikeri", rating: 4.1, budget: "Low" }
    ],
    restStops: [
      { name: "Coorg Spices Hub & Cafe", type: "Rest Stop", location: "Kushalnagar", facilities: ["Restrooms", "Spice Shopping", "Tea & Snacks"] },
      { name: "Cafe Coffee Day", type: "Cafe", location: "Suntikoppa", facilities: ["Clean Washrooms", "Parking", "WiFi"] }
    ],
    haltingPlaces: [
      { name: "The Tamara Coorg", type: "Luxury Resort", rating: 4.9, pricePerNight: "₹18,000/night" },
      { name: "Club Mahindra Madikeri", type: "Family Resort", rating: 4.5, pricePerNight: "₹9,500/night" }
    ],
    fuelChargingStops: [
      { name: "Zeon EV Charging Station", type: "EV", status: "Active", location: "Club Mahindra Parking" },
      { name: "Indian Oil Petrol Station", type: "Fuel", status: "Active", location: "Madikeri Main Road" }
    ]
  },
  bangalore: {
    name: "Bangalore",
    attractions: [
      { name: "Lalbagh Botanical Garden", type: "Nature", location: "Mavalli", rating: 4.5, description: "Historic 240-acre botanical garden featuring a majestic Victorian glasshouse." },
      { name: "Bangalore Palace", type: "Heritage", location: "Vasanth Nagar", rating: 4.4, description: "Tudor-style royal estate with grand wood-carved interiors and beautiful gardens." },
      { name: "Nandi Hills", type: "Scenic Viewpoint", location: "Chikkaballapur", rating: 4.6, description: "A popular mountaintop fortress offering breathtaking sunrise and sea-of-clouds views." }
    ],
    restaurants: [
      { name: "Vidyarthi Bhavan", cuisine: "South Indian", location: "Basavanagudi", rating: 4.6, budget: "Low" },
      { name: "Toit Brewpub", cuisine: "Continental / Brewery", location: "Indiranagar", rating: 4.5, budget: "High" },
      { name: "Nagarjuna Restaurant", cuisine: "Andhra Style", location: "Residency Road", rating: 4.3, budget: "Medium" }
    ],
    restStops: [
      { name: "Shell Select Lounge", type: "Premium Stop", location: "Devenahalli", facilities: ["24/7 Snacks", "Ultra Clean Washrooms", "Air & Water Station"] },
      { name: "A2B Adyar Ananda Bhavan", type: "Veg Restaurant Stop", location: "Bangalore Outer Ring", facilities: ["Restrooms", "Fast Service", "Clean dining"] }
    ],
    haltingPlaces: [
      { name: "Taj West End", type: "Luxury Heritage", rating: 4.8, pricePerNight: "₹22,000/night" },
      { name: "ITC Gardenia", type: "Luxury", rating: 4.7, pricePerNight: "₹16,000/night" }
    ],
    fuelChargingStops: [
      { name: "BESCOM Fast EV Charger", type: "EV", status: "Active", location: "Kanakapura Road Metro Station" },
      { name: "Shell Fuel Station - Indiranagar", type: "Fuel", status: "Active", location: "100 Feet Road" }
    ]
  },
  chikkamagaluru: {
    name: "Chikkamagaluru",
    attractions: [
      { name: "Mullayanagiri Peak", type: "Adventure / Scenic", location: "Baba Budan Range", rating: 4.7, description: "Highest peak in Karnataka featuring hiking trails amidst mist-laden coffee valleys." },
      { name: "Hebbe Falls", type: "Nature", location: "Kemmangundi", rating: 4.5, description: "Enchanting forest waterfall flowing in two stages, accessible via adventurous forest jeep ride." },
      { name: "Baba Budangiri", type: "Spiritual / Scenic", location: "Baba Budan Range", rating: 4.4, description: "Historic mountain shrine sacred to both Hindus and Muslims, offering scenic views." }
    ],
    restaurants: [
      { name: "Town House Restaurant", cuisine: "South Indian", location: "Main Road", rating: 4.1, budget: "Low" },
      { name: "The Peeriot", cuisine: "Indian & Continental", location: "Kadur Road", rating: 4.3, budget: "Medium" },
      { name: "Odyssey Restaurant", cuisine: "Multi-cuisine", location: "The Serai Resort", rating: 4.6, budget: "High" }
    ],
    restStops: [
      { name: "CCD - Global Village Road", type: "Cafe", location: "Chikkamagaluru Entry", facilities: ["Washrooms", "Premium Coffee", "Green Lounge"] },
      { name: "Hassan Highway Food Plaza", type: "Food Stop", location: "Hassan Bypass", facilities: ["Clean Restrooms", "Veg Restaurants", "Parking"] }
    ],
    haltingPlaces: [
      { name: "The Serai Chikkamagaluru", type: "Luxury Resort", rating: 4.7, pricePerNight: "₹16,500/night" },
      { name: "Trivik Hotels & Resorts", type: "Luxury Resort", rating: 4.8, pricePerNight: "₹14,500/night" }
    ],
    fuelChargingStops: [
      { name: "Ather Grid EV Charger", type: "EV", status: "Active", location: "Town Center Parking" },
      { name: "HP Petrol Pump", type: "Fuel", status: "Active", location: "Chikkamagaluru Bypass" }
    ]
  },
  ooty: {
    name: "Ooty",
    attractions: [
      { name: "Ooty Botanical Gardens", type: "Nature", location: "Ooty Town", rating: 4.5, description: "Lush terraced lawns, exotic plant species, and a 20-million-year-old fossilized tree trunk." },
      { name: "Doddabetta Peak", type: "Scenic Viewpoint", location: "Kotagiri Road", rating: 4.3, description: "Highest point in the Nilgiri hills with a telescope observatory house for valley views." },
      { name: "Ooty Lake", type: "Nature", location: "Lake Road", rating: 4.1, description: "Picturesque lake offering motor and row boat rentals surrounded by tall eucalyptus trees." }
    ],
    restaurants: [
      { name: "Shinkows Chinese Restaurant", cuisine: "Authentic Chinese", location: "Commissioner Road", rating: 4.5, budget: "Medium" },
      { name: "Place to Bee", cuisine: "Italian / Cafe", location: "Club Road", rating: 4.4, budget: "Medium" },
      { name: "Earl's Secret", cuisine: "Anglo-Indian / Continental", location: "King's Cliff", rating: 4.6, budget: "High" }
    ],
    restStops: [
      { name: "Hill View Tea Stop", type: "Tea Shop", location: "Coonoor Road", facilities: ["Restrooms", "Scenic Seating", "Local Tea & Chocolates"] },
      { name: "Nilgiri Highway Nest", type: "Food Plaza", location: "Mettupalayam-Ooty Road", facilities: ["Washrooms", "Tea stall", "Ample parking"] }
    ],
    haltingPlaces: [
      { name: "Savoy - IHCL SeleQtions", type: "Heritage Luxury", rating: 4.7, pricePerNight: "₹14,000/night" },
      { name: "Destiny The Farmstay", type: "Resort", rating: 4.5, pricePerNight: "₹9,000/night" }
    ],
    fuelChargingStops: [
      { name: "Tata Power Fast EV Charger", type: "EV", status: "Active", location: "Savoy Hotel Parking" },
      { name: "Bharat Petroleum Pump", type: "Fuel", status: "Active", location: "Ooty-Coonoor Highway" }
    ]
  }
};

export const defaultMockDestination = {
  name: "General Destination",
  attractions: [
    { name: "Scenic City viewpoint", type: "Scenic", location: "City Center", rating: 4.2, description: "Overlooks the city skyline, perfect for photography." },
    { name: "Public Historic Park", type: "Nature", location: "Down Town", rating: 4.4, description: "Historic park with walking paths and local vendor stalls." }
  ],
  restaurants: [
    { name: "Highway Diner", cuisine: "Multi-cuisine", location: "Highway Junction", rating: 4.1, budget: "Medium" },
    { name: "Central Veg Plaza", cuisine: "South Indian", location: "Central Market", rating: 4.3, budget: "Low" }
  ],
  restStops: [
    { name: "Expressway Rest Area", type: "Rest Stop", location: "Highway Mile 50", facilities: ["Washrooms", "Quick snacks", "Parking"] }
  ],
  haltingPlaces: [
    { name: "Guardian Inn Hotel", type: "Hotel", rating: 4.2, pricePerNight: "₹4,500/night" }
  ],
  fuelChargingStops: [
    { name: "National Highway Charging Point", type: "EV", status: "Active", location: "Exit 15" },
    { name: "IOCL Petrol Pump", type: "Fuel", status: "Active", location: "Exit 16" }
  ]
};
