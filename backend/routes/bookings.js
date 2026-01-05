const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const {
    sendBookingConfirmationEmail,
    sendPendingPaymentReminderEmail,
    sendBookingConfirmationSMS,
    sendPendingPaymentReminderSMS
} = require('../utils/notifications');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'your_razorpay_key_id',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_key_secret'
});

// Create a new booking
router.post('/create', async (req, res) => {
    try {
        const bookingData = req.body;

        // Create new booking document
        const booking = new Booking(bookingData);
        await booking.save();

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            bookingId: booking._id,
            bookingReference: booking.bookingReference
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create booking',
            error: error.message
        });
    }
});

// Create Razorpay order
router.post('/create-razorpay-order', async (req, res) => {
    try {
        const { amount, bookingId } = req.body;

        // Create Razorpay order
        const options = {
            amount: amount * 100, // Amount in paise
            currency: 'INR',
            receipt: `booking_${bookingId}`,
            notes: {
                bookingId: bookingId
            }
        };

        const order = await razorpay.orders.create(options);

        // Update booking with Razorpay order ID
        await Booking.findByIdAndUpdate(bookingId, {
            'payment.razorpayOrderId': order.id
        });

        res.status(200).json({
            success: true,
            order: order,
            key: process.env.RAZORPAY_KEY_ID || 'your_razorpay_key_id'
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment order',
            error: error.message
        });
    }
});

// Verify Razorpay payment
router.post('/verify-payment', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingId,
            paidAmount,
            paymentMethod
        } = req.body;

        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_key_secret')
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }

        // Update booking with payment details
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        booking.payment.razorpayPaymentId = razorpay_payment_id;
        booking.payment.razorpaySignature = razorpay_signature;
        booking.payment.paidAmount += paidAmount;
        booking.payment.pendingAmount = booking.pricing.totalAmount - booking.payment.paidAmount;
        booking.payment.method = paymentMethod;

        // Add transaction record
        booking.payment.transactions.push({
            amount: paidAmount,
            status: 'success',
            paymentId: razorpay_payment_id,
            method: paymentMethod
        });

        // Update payment status
        if (booking.payment.pendingAmount <= 0) {
            booking.payment.status = 'completed';
            booking.bookingStatus = 'confirmed';
        } else {
            booking.payment.status = 'partial';
            booking.payment.isPartialPayment = true;
        }

        await booking.save();

        // Send email and SMS notifications
        try {
            const emailResult = await sendBookingConfirmationEmail(booking);
            const smsResult = await sendBookingConfirmationSMS(booking);

            booking.notifications.emailSent = emailResult.success;
            booking.notifications.smsSent = smsResult.success;
            await booking.save();

            console.log('Notifications sent:', { email: emailResult.success, sms: smsResult.success });
        } catch (notificationError) {
            console.error('Error sending notifications:', notificationError);
            // Don't fail the payment verification if notifications fail
        }

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            booking: {
                bookingReference: booking.bookingReference,
                paidAmount: booking.payment.paidAmount,
                pendingAmount: booking.payment.pendingAmount,
                status: booking.payment.status
            }
        });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            success: false,
            message: 'Payment verification failed',
            error: error.message
        });
    }
});

// Get booking details by ID
router.get('/:bookingId', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.status(200).json({
            success: true,
            booking: booking
        });
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch booking',
            error: error.message
        });
    }
});

// Get user bookings
router.get('/user/:email', async (req, res) => {
    try {
        const bookings = await Booking.find({
            'guestDetails.email': req.params.email
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            bookings: bookings
        });
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings',
            error: error.message
        });
    }
});

// Send pending payment reminder
router.post('/send-reminder/:bookingId', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (booking.payment.pendingAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'No pending payment for this booking'
            });
        }

        // Send email and SMS reminders
        try {
            const emailResult = await sendPendingPaymentReminderEmail(booking);
            const smsResult = await sendPendingPaymentReminderSMS(booking);

            booking.notifications.pendingPaymentReminderSent = true;
            await booking.save();

            res.status(200).json({
                success: true,
                message: 'Payment reminder sent successfully',
                notifications: {
                    email: emailResult.success,
                    sms: smsResult.success
                }
            });
        } catch (error) {
            throw error;
        }
    } catch (error) {
        console.error('Error sending reminder:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send reminder',
            error: error.message
        });
    }
});

// Update booking status
router.patch('/:bookingId/status', async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findById(req.params.bookingId);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        booking.bookingStatus = status;
        await booking.save();

        res.status(200).json({
            success: true,
            message: 'Booking status updated successfully',
            booking: booking
        });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update booking status',
            error: error.message
        });
    }
});

// Cancel booking
router.post('/:bookingId/cancel', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if booking can be cancelled
        if (booking.bookingStatus === 'completed' || booking.bookingStatus === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'This booking cannot be cancelled'
            });
        }

        booking.bookingStatus = 'cancelled';

        // TODO: Implement refund logic if payment was made
        // This would depend on your refund policy

        await booking.save();

        res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel booking',
            error: error.message
        });
    }
});

module.exports = router;
