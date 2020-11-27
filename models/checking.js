var mongoose = require('mongoose');
var Schema = mongoose.Schema;

checkingSchema = new Schema( {
	name: String, // will be "Saving1", "Checking1", "Saving2", etc.
	nth_account: Number, // tells whether account is user's nth checking account
	username: String, // connects account to User
	unique_id: String, // connects account to transaction history
						// will always be name + " " + username
	balance: Number
}),
Checking = mongoose.model('Checking', checkingSchema);

module.exports = Checking;