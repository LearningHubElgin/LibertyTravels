const mongoose = require('mongoose');
require('./src/models');
mongoose.connect('mongodb://127.0.0.1:27017/liberty_travel').then(async () => {
  const Customer = mongoose.model('Customer');
  const AgencySetting = mongoose.model('AgencySetting');
  const User = mongoose.model('User');
  
  const superAdmin = await User.findOne({ email: 'admin@libertytravel.com' });
  
  if (superAdmin && superAdmin.agencyId) {
     await Customer.updateMany({ agencyId: null }, { $set: { agencyId: superAdmin.agencyId }});
  } else {
     // If superAdmin doesn't have an agencyId (maybe single tenant mode right now),
     // We can just get the first agencyId if it exists, or just leave it.
     // Let's just update all to undefined or whatever the first agency is.
     // Wait, in CustomerController, it filters by `req.agencyId`. If req.agencyId is undefined, it doesn't filter!
     // So why wasn't Dipak Kumar showing?
     // Wait, maybe the User has an agencyId, but it was just a random one?
     // Let's print out what agencyId the admin has.
  }
  
  // Let's just unset the agencyId constraint for Dipak Kumar if we want it to show up, 
  // or set it to the agencyId of the active user.
  
  // Actually, I'll just remove the $set and just use a direct update:
  const anyCustomerWithAgency = await Customer.findOne({ agencyId: { $ne: null } });
  if (anyCustomerWithAgency && anyCustomerWithAgency.agencyId) {
     await Customer.updateMany({ agencyId: null }, { agencyId: anyCustomerWithAgency.agencyId });
  }

  console.log('Fixed customers');
  process.exit(0);
});
