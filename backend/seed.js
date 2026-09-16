require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Department = require('./models/Department');
const Category = require('./models/Category');
const User = require('./models/User');

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/grievance_portal');
  const departments = await Department.insertMany([
    { name: 'Public Works', description: 'Roads, streets, lighting, and civic infrastructure' },
    { name: 'Water & Sanitation', description: 'Water supply, drainage, and sanitation services' },
    { name: 'Transport', description: 'Public transport and traffic concerns' }
  ], { ordered: false }).catch(() => Department.find());
  await Category.insertMany([
    { name: 'Roads & Infrastructure', description: 'Potholes, streetlights, and public assets' },
    { name: 'Water Supply', description: 'Water quality, availability, and connections' },
    { name: 'Sanitation', description: 'Waste collection and cleanliness' },
    { name: 'Public Transport', description: 'Buses, stops, and transit services' }
  ], { ordered: false }).catch(() => Category.find());
  await User.findOneAndUpdate(
    { email: 'admin@civicdesk.local' },
    { name: 'Civic Desk Admin', email: 'admin@civicdesk.local', password: await bcrypt.hash('Admin123!', 10), role: 'admin' },
    { upsert: true, new: true }
  );
  console.log(`Seeded ${departments.length} departments and admin@civicdesk.local / Admin123!`);
  await mongoose.disconnect();
})();
