const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    cryptoType: { type: String, required: true },
    txHash: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    date: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    principal: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    isAdmin: { type: Boolean, default: false },
    transactions: [transactionSchema],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);