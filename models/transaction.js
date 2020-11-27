var mongoose = require('mongoose');
var Schema = mongoose.Schema;

transactionSchema = new Schema({
    account_name: String, // is "[account type] " + "[]]nth number]" + " " + username
    type: String, // can be withdrawal, deposit, or transfer
    unique_id: Number, // is 1 for first transaction of any account
    timestamp: String, // gives time and date
    amount: Number, // positive if deposit, negative if withdrawal or transfer
    filepath: String // url to cheque image; for deposits; empty for withdrawals & transfers
})

Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;