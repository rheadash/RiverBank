var mongoose = require('mongoose');
var Schema = mongoose.Schema;

savingSchema = new Schema( {
	name: String, // will be "Saving1", "Checking1", "Saving2", etc.
	nth_account: Number, // tells whether account is user's nth saving account
	username: String, // connects account to User
	unique_id: String, // connects account to transaction history
						// will always be name + " " + username
	balance: Number
}),
Saving = mongoose.model('Saving', savingSchema);

module.exports = Saving;