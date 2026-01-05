const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Can be null for guest bookings
    },
    guestDetails: {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            type: String,
            trim: true
        },
        passportNumber: {
            type: String,
            trim: true
        },
        passportExpiry: {
            type: Date
        }
    },
    packageDetails: {
        packageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Package'
        },
        packageType: {
            type: String,
            enum: ['with-flight', 'without-flight'],
            required: true
        },
        packageName: {
            type: String,
            default: 'Dubai Luxury Escape'
        },
        basePrice: {
            type: Number,
            required: true
        }
    },
    travelers: {
        adults: {
            count: {
                type: Number,
                required: true,
                min: 1
            },
            details: [{
                name: String,
                age: Number
            }]
        },
        children: {
            count: {
                type: Number,
                default: 0,
                min: 0
            },
            details: [{
                name: String,
                age: Number
            }]
        }
    },
    hotelDetails: {
        category: {
            type: String,
            enum: ['3star', '4star', '5star', 'boutique', 'resort']
        },
        roomCategory: {
            type: String,
            enum: ['standard', 'deluxe', 'suite', 'villa']
        },
        numRooms: {
            type: Number,
            min: 1
        },
        checkInDate: Date,
        checkOutDate: Date
    },
    vehicleDetails: {
        type: {
            type: String,
            enum: ['sedan', 'suv', 'tempo', 'bus', 'luxury']
        },
        price: {
            type: Number,
            default: 0
        }
    },
    flightDetails: {
        departureDate: Date,
        returnDate: Date,
        class: {
            type: String,
            enum: ['economy', 'premium-economy', 'business', 'first']
        }
    },
    pricing: {
        basePrice: {
            type: Number,
            required: true
        },
        travelersCharge: {
            type: Number,
            required: true
        },
        vehicleCharge: {
            type: Number,
            default: 0
        },
        hotelUpgrade: {
            type: Number,
            default: 0
        },
        activities: {
            type: Number,
            default: 0
        },
        taxes: {
            type: Number,
            default: 0
        },
        discount: {
            type: Number,
            default: 0
        },
        couponCode: {
            type: String,
            trim: true
        },
        totalAmount: {
            type: Number,
            required: true
        }
    },
    payment: {
        status: {
            type: String,
            enum: ['pending', 'partial', 'completed', 'failed', 'refunded'],
            default: 'pending'
        },
        method: {
            type: String,
            enum: ['credit-card', 'debit-card', 'upi', 'netbanking', 'wallet', 'emi', 'pay-later']
        },
        paidAmount: {
            type: Number,
            default: 0
        },
        pendingAmount: {
            type: Number,
            default: 0
        },
        isPartialPayment: {
            type: Boolean,
            default: false
        },
        razorpayOrderId: {
            type: String,
            trim: true
        },
        razorpayPaymentId: {
            type: String,
            trim: true
        },
        razorpaySignature: {
            type: String,
            trim: true
        },
        transactions: [{
            amount: Number,
            status: String,
            date: {
                type: Date,
                default: Date.now
            },
            paymentId: String,
            method: String
        }]
    },
    notifications: {
        emailSent: {
            type: Boolean,
            default: false
        },
        smsSent: {
            type: Boolean,
            default: false
        },
        pendingPaymentReminderSent: {
            type: Boolean,
            default: false
        }
    },
    bookingStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    specialRequests: {
        type: String,
        trim: true
    },
    activities: [{
        name: String,
        included: Boolean
    }],
    meals: {
        breakfast: {
            type: Boolean,
            default: true
        },
        lunch: {
            type: Boolean,
            default: false
        },
        dinner: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true
});

// Index for faster queries
bookingSchema.index({ 'guestDetails.email': 1 });
bookingSchema.index({ userId: 1 });
bookingSchema.index({ bookingStatus: 1 });
bookingSchema.index({ 'payment.status': 1 });
bookingSchema.index({ createdAt: -1 });

// Virtual for booking reference number
bookingSchema.virtual('bookingReference').get(function() {
    return `TH${this._id.toString().slice(-8).toUpperCase()}`;
});

// Method to calculate total travelers
bookingSchema.methods.getTotalTravelers = function() {
    return this.travelers.adults.count + this.travelers.children.count;
};

// Method to check if payment is complete
bookingSchema.methods.isPaymentComplete = function() {
    return this.payment.status === 'completed' || this.payment.pendingAmount === 0;
};

// Method to get pending payment details
bookingSchema.methods.getPendingPaymentDetails = function() {
    if (this.payment.pendingAmount > 0) {
        return {
            amount: this.payment.pendingAmount,
            dueDate: new Date(this.createdAt.getTime() + (7 * 24 * 60 * 60 * 1000)), // 7 days from booking
            bookingReference: this.bookingReference
        };
    }
    return null;
};

// Pre-save hook to ensure timestamps
bookingSchema.pre('save', function(next) {
    if (this.isNew) {
        this.payment.pendingAmount = this.pricing.totalAmount - this.payment.paidAmount;
    }
    next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
