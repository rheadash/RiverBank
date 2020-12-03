var express = require('express');
var router = express.Router();
var User = require('../models/user');
var Checking = require('../models/checking');
var Saving = require('../models/saving');
var Transaction = require('../models/transaction');
var multer = require('multer');
const path = require('path');
const mkdirp = require('mkdirp');
const { Mongoose } = require('mongoose');

router.get('/', (req, res, next) => {
	return res.render('index.ejs');
});


router.post('/', (req, res, next) => {
	console.log(req.body);
	var personInfo = req.body;

	if (!personInfo.email || !personInfo.username || !personInfo.password || !personInfo.passwordConf) {
		res.send();
	} else {
		if (personInfo.password == personInfo.passwordConf) {

			User.findOne({$or: [{email: personInfo.email}, {username: personInfo.username}]}, (err, data) => {
				if (!data) {
					var c;
					User.findOne({}, (err, data) => {

						if (data) {
							console.log("if");
							c = data.unique_id + 1;
						} else {
							c = 1;
						}

						var newPerson = new User({
							unique_id: c,
							email: personInfo.email,
							username: personInfo.username,
							password: personInfo.password,
							passwordConf: personInfo.passwordConf
						});

						var newChecking = new Checking({
							name: "Checking" + 1,
							nth_account: 1,
							username: personInfo.username, // connects account to User
							unique_id: "Checking" + 1 + " " + personInfo.username,
							balance: 100
						})

						var newSaving = new Saving({
							name: "Saving" + 1,
							nth_account: 1,
							username: personInfo.username, // connects account to User
							unique_id: "Saving" + 1 + " " + personInfo.username,
							balance: 100
						})

						newPerson.save((err, Person) => {
							if (err)
								console.log(err);
							else
								console.log('new user saved');
						});

						newChecking.save((err, Checking) => {
							if (err)
								console.log(err);
							else
								console.log('new checking account saved');
						});

						newSaving.save((err, Saving) => {
							if (err)
								console.log(err);
							else
								console.log('new saving account saved');
						});

					}).sort({ _id: -1 }).limit(1);
					res.send({ "Success": "You are regestered,You can login now." });
				} else {
					res.send({ "Success": "Email is already used." });
				}

			});
		} else {
			res.send({ "Success": "password is not matched" });
		}
	}
});

router.get('/login', (req, res, next) => {
	return res.render('login.ejs');
});
router.get('/atm-login', (req, res, next) => {
	return res.render('atmLogin.ejs');
});

router.post('/login', (req, res, next) => {
	//console.log(req.body);
	User.findOne({ email: req.body.email }, (err, data) => {
		if (data) {

			if (data.password == req.body.password) {
				//console.log("Done Login");
				req.session.userId = data.unique_id;
				//console.log(req.session.userId);
				res.send({ "Success": "Success!" });

			} else {
				res.send({ "Success": "Wrong password!" });
			}
		} else {
			res.send({ "Success": "This Email Is not regestered!" });
		}
	});
});

// Handle ATM login
router.post('/atm-login', (req, res, next) => {
	User.findOne({ email: req.body.email }, (err, data) => {
		if (data) {
			if (data.password == req.body.password) {
				req.session.userId = data.unique_id;
				res.send({ "Success": "Success!" });

			} else {
				res.send({ "Success": "Wrong password!" });
			}
		} else {
			res.send({ "Success": "This Email Is not regestered!" });
		}
	});
});

router.get('/profile', (req, res, next) => {
	console.log("profile");
	User.findOne({ unique_id: req.session.userId }, (err, userData) => {
		Checking.find({ username: userData.username }, (err, checkingAccs) => {
			Saving.find({ username: userData.username }, (err, savingsAccs) => {
				console.log("found accounts");
				if (!userData) {
					res.redirect('/');
				} else {
					return res.render('data.ejs', { "name": userData.username, "email": userData.email,
						"checkingAccs": checkingAccs, "savingsAccs": savingsAccs });
				}
			});
		});
	});
});

router.get('/historyDropbox', (req, res, next) => {
	console.log("accessing history dropbox page");
	User.findOne({ unique_id: req.session.userId }, (err, userData) => {
		Checking.find({ username: userData.username }, (err, checkingAccs) => {
			Saving.find({ username: userData.username }, (err, savingsAccs) => {
				console.log(userData.username);
				if (!userData) {
					res.redirect('/');
				}
				else {
					var accounts = checkingAccs.concat(savingsAccs);
					res.render('historyDropbox.ejs', {"accounts" : accounts});
				}
			});
		});
	});
});

router.post('/historyDropbox', (req, res, next) => {
	var account = String(req.body.account);
	var accountName = account.split(" ")[0];
	var balance;
	if (account.includes("Checking")) {
		Checking.findOne({unique_id: account}, (err, foundAccount) => {
			balance = foundAccount.balance;
		});
	}
	else {
		Saving.findOne({unique_id: account}, (err, foundAccount) => {
			balance = foundAccount.balance;
		});
	}

	console.log("transaction history");
	User.findOne({ unique_id: req.session.userId }, (err, userData) => {
		Transaction.find({account_name: account}, (err, transactionHistory) => {
			if (!userData) {
				res.redirect('/');
			} 
			else {
				return res.render('history.ejs', {
					"name": userData.username,
					"email": userData.email,
					"accountname": accountName,
					"balance": balance,
					"transactions": transactionHistory
				});
			}
		});
	});
});


router.get('/history', (req, res, next) => {
	
});

// ATM main page
router.get('/atm', (req, res, next) => {
	User.findOne({ unique_id: req.session.userId }, (err, userData) => {
		Checking.find({ username: userData.username }, (err, checkingAccs) => {
			Saving.find({ username: userData.username }, (err, savingsAccs) => {
				if (!userData) {
					res.redirect('/');
				} else {
					return res.render('atmMain.ejs', { "name": userData.username, "email": userData.email,
						"checkingAccs": checkingAccs, "savingsAccs": savingsAccs });
				}
			});
		});
	});
});

// ATM Withdraw
router.post('/atm-withdraw', (req, res, next) => {
	// Make sure requested amount is a valid number
	console.log("atm-withdraw")
	
	const amount = Number(req.body.amount);
	if (isNaN(amount) || amount <= 0) {
		return res.status(400).send("Please enter a positive number.");
	}

	// Find user
	User.findOne({ unique_id: req.session.userId }, (err, userData) => {
		// Find the account
		if (req.body.accountType === "checking") {
			Checking.findOne({ username: userData.username, unique_id: req.body.accountId }, (err, doc) => withdrawCallback(doc, amount));
		}
		else if (req.body.accountType === "saving") {
			Saving.findOne({ username: userData.username, unique_id: req.body.accountId }, (err, doc) => withdrawCallback(doc, amount));
		}
	
		function withdrawCallback(accountDoc, amount) {
			if (!accountDoc) {
				res.status(400).send("Could not find the account");
			}
			else {
				// Deduct the amount
				accountDoc.balance -= amount;
				if (accountDoc.balance < 0) {
					res.status(400).send("Account does not have enough money");
				}
				else {
					// Save new amount to DB
					accountDoc.save((err, doc) => {
						res.status(200).send("Withdrew $" + req.body.amount + " from the account" );
					});

					var c;
					Transaction.find({account_name: accountDoc.unique_id}, (err, existingTransaction) => {
						if (existingTransaction.length == 0) {
							c = 1;
						}
						else {
							c = existingTransaction.length + 1;
						}

						var newTransaction = new Transaction({
							account_name: accountDoc.unique_id,
							type: "Withdrawal", 
							unique_id: c, // is 1 for first transaction of any account
							timestamp: getTimestamp(), // gives time and date
							amount: amount * -1,
						})

						newTransaction.save((err, Transaction) => {
							if (err)
								console.log(err);
							else
								console.log('new transaction saved');
						});
			
					});
				}
			}
		}
	});
});


router.get('/logout', (req, res, next) => {
	console.log("logout")
	if (req.session) {
		// delete session object
		req.session.destroy((err) => {
			if (err) {
				return next(err);
			} else {
				return res.redirect('/');
			}
		});
	}
});

router.get('/forgetpass', (req, res, next) => {
	res.render("forget.ejs");
});

router.get('/accountcreate', (req, res, next) => {
	console.log("accessing new account page");
	res.render("accountcreate.ejs");
});

router.get('/transfer', (req, res, next) => {
	console.log("accessing transfer page");
	User.findOne({ unique_id: req.session.userId }, (err, userData) => {
		Checking.find({ username: userData.username }, (err, checkingAccs) => {
			Saving.find({ username: userData.username }, (err, savingsAccs) => {
				console.log(userData.username);
				
				if (!userData) {
					res.redirect('/');
				}
				else {
					var accounts = checkingAccs.concat(savingsAccs);
					res.render('transfer.ejs', {"accounts" : accounts});
				}
			});
		});
	});
});

router.post('/transfer', (req, res, next) => {
	console.log("post/transfer");
	var amount = Number(req.body.amount);
	var from = req.body.from;
	var to = req.body.to;
	
	console.log(from);
	console.log(to);

	// error handling
	if (isNaN(amount) || amount <= 0) {
		return res.status(400).send("Please enter a positive number.");
	}

	if (from === to) {
		return res.status(400).send("From and To accounts should be different.");
	}

	if (from.includes("Checking") && to.includes("Checking")) {
		console.log("from checking to checking");
		Checking.findOne({unique_id: from}, (err, fromAccount) => {
			Checking.findOne({unique_id: to}, (err, toAccount) => completeTransfer(fromAccount, toAccount, amount))
		});
	}
	else if (from.includes("Checking") && to.includes("Saving")){
		console.log("from checking to saving");
		Checking.findOne({unique_id: from}, (err, fromAccount) => {
			Saving.findOne({unique_id: to}, (err, toAccount) => completeTransfer(fromAccount, toAccount, amount))
		});
	}

	else if (from.includes("Saving") && to.includes("Checking")){
		console.log("from saving to checking");
		Saving.findOne({unique_id: from}, (err, fromAccount) => {
			Checking.findOne({unique_id: to}, (err, toAccount) => completeTransfer(fromAccount, toAccount, amount))
		});
	}
	else if (from.includes("Saving") && to.includes("Saving")){
		console.log("from saving to saving");
		Saving.findOne({unique_id: from}, (err, fromAccount) => {
			Saving.findOne({unique_id: to}, (err, toAccount) => completeTransfer(fromAccount, toAccount, amount))
		});
	}

	function completeTransfer(fromAccount, toAccount, amount) {
		console.log("inside completeTransfer()");
		console.log("from balance: " + fromAccount.balance);
		console.log("to balance: " + toAccount.balance);

		if (fromAccount.balance < amount) {
			return res.status(400).send("$" + amount + " is greater than balance of $" + fromAccount.balance + " in " + fromAccount.name);
		}
		else {
			fromAccount.balance -= amount;
			toAccount.balance += amount;
			fromAccount.save((err, doc) => {
				res.status(200).send("Transferred out $" + req.body.amount + " from the account" + fromAccount.name);
			});
			toAccount.save((err, doc) => {
				
			});

			// save fromAccount transaction
			var c;
			Transaction.find({account_name: fromAccount.unique_id}, (err, existingTransaction) => {
				if (existingTransaction.length == 0) {
					c = 1;
				}
				else {
					c = existingTransaction.length + 1;
				}

				var newTransaction = new Transaction({
					account_name: fromAccount.unique_id,
					type: "Transfer", 
					unique_id: c, // is 1 for first transaction of any account
					timestamp: getTimestamp(), // gives time and date
					amount: amount * -1,
				})

				newTransaction.save((err, Transaction) => {
					if (err)
						console.log(err);
					else
						console.log('new transaction saved');
				});
	
			});

			// save toAccount transaction
			var c;
			Transaction.find({account_name: toAccount.unique_id}, (err, existingTransaction) => {
				if (existingTransaction.length == 0) {
					c = 1;
				}
				else {
					c = existingTransaction.length + 1;
				}

				var newTransaction = new Transaction({
					account_name: toAccount.unique_id,
					type: "Transfer", 
					unique_id: c, // is 1 for first transaction of any account
					timestamp: getTimestamp(), // gives time and date
					amount: amount,
				})

				newTransaction.save((err, Transaction) => {
					if (err)
						console.log(err);
					else
						console.log('new transaction saved');
				});
	
			});
			
			
		}
	}
});

router.get('/closeaccount', (req, res, next) => {
	console.log("accessing close accounts page");
	User.findOne({ unique_id: req.session.userId }, (err, userData) => {
		Checking.find({ username: userData.username }, (err, checkingAccs) => {
			Saving.find({ username: userData.username }, (err, savingsAccs) => {
				console.log(userData.username);
				if (!userData) {
					res.redirect('/');
				}
				else {
					var accounts = checkingAccs.concat(savingsAccs);
					res.render('closeaccount.ejs', {"accounts" : accounts});
				}
			});
		});
	});
});

router.post('/closeaccount', (req, res, next) => {
	console.log("post close account");
	var account = String(req.body.account);
	console.log(account);	
	
	Transaction.deleteMany({ account_name: account }).then(function(){ 
		console.log("Transaction data deleted"); // Success 
	}).catch(function(error){ 
		console.log("Transaction deletion " + error); // Failure 
	}); 	
	
	if (account.includes("Checking")) {
		Checking.deleteMany({ unique_id: account }).then(function(){ 
			console.log("checking data deleted"); // Success 
		}).catch(function(error){ 
			console.log("checking deletion " + error); // Failure 
		}); 
	}
	else if (account.includes("Saving")) {
		Saving.deleteMany({ unique_id: account }).then(function(){ 
			console.log("saving data deleted"); // Success 
		}).catch(function(error){ 
			console.log("saving deletion " + error); // Failure 
		}); 
	}
	res.redirect('/closeaccount');
});


router.get('/deposit', (req, res, next) => {
	User.findOne({ unique_id: req.session.userId }, (err, userData) => {
		Checking.find({ username: userData.username }, (err, checkingAccs) => {
			Saving.find({ username: userData.username }, (err, savingsAccs) => {
				if (!userData) {
					res.redirect('/');
				} else {
					return res.render('deposit.ejs', { "name": userData.username, "email": userData.email,
						"checkingAccs": checkingAccs, "savingsAccs": savingsAccs });
				}
			});
		});
	});
});

//Deposit
const storage = multer.diskStorage({
	destination: function(req, file, cb) {
		const path = './uploads/';
		mkdirp(path, err => cb(err, path));
	},
	filename: function(req, file, cb) {
		// Assign file name including current Unix timestamp
		cb(null, 'image-' + Date.now() + path.extname(file.originalname));
	}
});
const upload = multer({ storage: storage });

router.post('/data-deposit', upload.single("image"), (req, res, next) => {
	// req.file contains the image

	// Make sure requested amount is a valid number
	const amount = Number(req.body.amount);
	if (isNaN(amount) || amount <= 0) {
		return res.status(400).send("Please enter a positive number.");
	}

	// Find user
	User.findOne({ unique_id: req.session.userId }, (err, userData) => {
		// Find the account
		if (req.body.accountType === "checking") {
			Checking.findOne({ username: userData.username, unique_id: req.body.accountId }, (err, doc) => depositCallback(doc, amount));
		}
		else if (req.body.accountType === "saving") {
			Saving.findOne({ username: userData.username, unique_id: req.body.accountId }, (err, doc) => depositCallback(doc, amount));
		}
	
		function depositCallback(accountDoc, amount) {
			if (!accountDoc) {
				res.status(400).send("Could not find the account");
			}
			else {
				// Add the amount
				accountDoc.balance += amount;
				// Save new amount to DB
				accountDoc.save((err, doc) => {
					res.status(200).send("Deposited $" + req.body.amount + " from the account" );
				});

				var c;
				Transaction.find({account_name: req.body.accountId}, (err, existingTransaction) => {
					if (existingTransaction.length == 0) {
						c = 1;
					}
					else {
						c = existingTransaction.length + 1;
					}

					var newTransaction = new Transaction({
						account_name: req.body.accountId,
						type: "Deposit", 
						unique_id: c, // is 1 for first transaction of any account
						timestamp: getTimestamp(), // gives time and date
						amount: amount,
						filepath: req.file.path
					})

					newTransaction.save((err, Transaction) => {
						if (err)
							console.log(err);
						else
							console.log('new transaction saved');
					});
		
				});
			}
		}
	});
});

router.get('/newchecking', (req, res, next) => {
	User.findOne({ unique_id: req.session.userId }, (err, userData) => {
		if (!userData) {
			res.redirect('/');
		}
		else {
			var c;
			Checking.find({username: userData.username}, (err, existingChecking) => {
				if (existingChecking.length == 0) {
					c = 1;
				}
				else {
					c = existingChecking[existingChecking.length - 1].nth_account + 1;
				}
				var newChecking = new Checking({
					name: "Checking" + c,
					nth_account: c,
					username: userData.username, // connects account to User
					unique_id: "Checking" + c + " " + userData.username,
					balance: 100
				})
		
				newChecking.save((err, Checking) => {
					if (err)
						console.log(err);
					else
						console.log('new checking account saved');
				});
			});
		}
		
	});
	res.render("newchecking.ejs");
});

router.get('/newsaving', (req, res, next) => {
	User.findOne({ unique_id: req.session.userId }, (err, userData) => {
		if (!userData) {
			res.redirect('/');
		}
		else {
			var c;
			Saving.find({username: userData.username}, (err, existingSaving) => {
				if (existingSaving.length == 0) {
					c = 1;
				}
				else {
					c = existingSaving[existingSaving.length -1].nth_account + 1;
				}
				var newSaving = new Saving({
					name: "Saving" + c,
					nth_account: c,
					username: userData.username, // connects account to User
					unique_id: "Saving" + c + " " + userData.username,
					balance: 100
				})
		
				newSaving.save((err, Saving) => {
					if (err)
						console.log(err);
					else
						console.log('new saving account saved');
				});
			});
		}
		
	});
	res.render("newsaving.ejs");
});

router.post('/forgetpass', (req, res, next) => {
	//console.log('req.body');
	//console.log(req.body);
	User.findOne({ email: req.body.email }, (err, data) => {
		console.log(data);
		if (!data) {
			res.send({ "Success": "This Email Is not regestered!" });
		} else {
			// res.send({"Success":"Success!"});
			if (req.body.password == req.body.passwordConf) {
				data.password = req.body.password;
				data.passwordConf = req.body.passwordConf;

				data.save((err, Person) => {
					if (err)
						console.log(err);
					else
						console.log('Success');
					res.send({ "Success": "Password changed!" });
				});
			} else {
				res.send({ "Success": "Password does not matched! Both Password should be same." });
			}
		}
	});

});


router.post('/customer-transfer', (req ,res, next) => {
	//res.send("inside customer trasnfer");
	let userId = req.session.userId;
	let transferReceipient = req.body.receipientUsername;


	//find this second user
	User.findOne({username: transferReceipient}, function(err, foundUser){
		if(err){
			console.log("err in finding User", err);
		}else{
			console.log("users username: ", foundUser.username);
			Checking.find({username: foundUser.username}, function(err, foundCheckings){
				if(err){
					console.log("error in found Checkings", err)
				}else{
					console.log("found checkings", foundCheckings);
					Saving.find({username: foundUser.username}, function(err, foundSavings){
						if(err){
							console.log("ERROR in found savings", err);
						}else{
							console.log("found savings", foundSavings);
							//find logged accounts 
							User.findOne({unique_id: userId}, function(err, foundOwnUser){
								if(err){
									console.log("error in own user", err)
								}else{
									console.log("own user username", foundOwnUser.username);
									Checking.find({username: foundOwnUser.username}, function(err, foundOwnCheckings){
										if(err){
											console.log("err in foundOwnChecking", err);
										}else{
											console.log("foundOwnCheckings", foundOwnCheckings);
											Saving.find({username: foundOwnUser.username}, function(err, foundOwnSavings){
												if(err){
													console.log("error in foundOwnSavings", err);
												}else{
													console.log("foundOwnSavings", foundOwnSavings);
													var accounts1 = foundOwnCheckings.concat(foundOwnSavings);
													console.log("accounts1",accounts1);
													var accounts2 = foundCheckings.concat(foundSavings);
													console.log("accounts2",accounts2);
													res.render("transferhandler.ejs", {"accounts1": accounts1, "accounts2": accounts2});
												}
											});
										}
									});
								}
							});
						}
					});
				}
			});
		}
	});
});


router.post("/customer-transfer-handler", (req,res,next) => {
	res.send("got thru")
});

function getTimestamp() {
	let date_ob = new Date();
	// current date
	// adjust 0 before single digit date
	let date = ("0" + date_ob.getDate()).slice(-2);

	// current month
	let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

	// current year
	let year = date_ob.getFullYear();

	// current hours
	let hours = date_ob.getHours();

	// current minutes
	let minutes = date_ob.getMinutes();

	// current seconds
	let seconds = date_ob.getSeconds();

	let timestamp = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;

	return timestamp;
	
}

module.exports = router;