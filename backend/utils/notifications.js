const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
    }
});

// Send booking confirmation email
async function sendBookingConfirmationEmail(booking) {
    try {
        const { guestDetails, pricing, payment, bookingReference } = booking;

        const mailOptions = {
            from: `"Trip Holiday" <${process.env.SMTP_USER || 'noreply@tripholiday.in'}>`,
            to: guestDetails.email,
            subject: `Booking Confirmation - ${bookingReference}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #FF7F27, #FF9F50); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
                        .booking-details { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; }
                        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                        .total { font-size: 1.3em; font-weight: bold; color: #FF7F27; margin-top: 10px; }
                        .footer { background: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; }
                        .button { background: #FF7F27; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 Booking Confirmed!</h1>
                            <p>Thank you for choosing Trip Holiday</p>
                        </div>
                        <div class="content">
                            <h2>Hello ${guestDetails.name},</h2>
                            <p>Your booking has been confirmed. Here are the details:</p>

                            <div class="booking-details">
                                <h3>Booking Information</h3>
                                <div class="detail-row">
                                    <span>Booking Reference:</span>
                                    <strong>${bookingReference}</strong>
                                </div>
                                <div class="detail-row">
                                    <span>Package:</span>
                                    <span>Dubai Luxury Escape</span>
                                </div>
                                <div class="detail-row">
                                    <span>Travelers:</span>
                                    <span>${booking.travelers.adults.count} Adult(s), ${booking.travelers.children.count} Child(ren)</span>
                                </div>
                            </div>

                            <div class="booking-details">
                                <h3>Payment Details</h3>
                                <div class="detail-row">
                                    <span>Total Amount:</span>
                                    <span>₹${pricing.totalAmount.toLocaleString('en-IN')}</span>
                                </div>
                                <div class="detail-row">
                                    <span>Amount Paid:</span>
                                    <strong style="color: green;">₹${payment.paidAmount.toLocaleString('en-IN')}</strong>
                                </div>
                                ${payment.pendingAmount > 0 ? `
                                <div class="detail-row">
                                    <span>Pending Amount:</span>
                                    <strong style="color: orange;">₹${payment.pendingAmount.toLocaleString('en-IN')}</strong>
                                </div>
                                <p style="background: #fff3cd; padding: 10px; border-left: 4px solid orange; margin-top: 10px;">
                                    <strong>⚠️ Payment Reminder:</strong><br>
                                    Please complete the remaining payment of ₹${payment.pendingAmount.toLocaleString('en-IN')} before your travel date.
                                    You will receive a payment link via email and SMS.
                                </p>
                                ` : ''}
                            </div>

                            <div style="text-align: center; margin: 20px 0;">
                                <a href="http://localhost:5000/api/bookings/${booking._id}" class="button">View Booking Details</a>
                            </div>

                            <p><strong>What's Next?</strong></p>
                            <ul>
                                <li>You will receive detailed itinerary within 24 hours</li>
                                <li>Our team will contact you to finalize travel arrangements</li>
                                ${payment.pendingAmount > 0 ? '<li>Complete the pending payment before travel date</li>' : ''}
                                <li>Keep your booking reference handy for all communications</li>
                            </ul>

                            <p>If you have any questions, feel free to contact us at:</p>
                            <p>📞 Phone: 7042252130<br>
                            📧 Email: Info@tripholiday.in</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2025 Trip Holiday. All rights reserved.</p>
                            <p>IT Park, Industrial Area Phase 8B, Sector 74, Mohali - Punjab, 160055</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Booking confirmation email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending booking confirmation email:', error);
        return { success: false, error: error.message };
    }
}

// Send pending payment reminder email
async function sendPendingPaymentReminderEmail(booking) {
    try {
        const { guestDetails, payment, bookingReference } = booking;

        if (payment.pendingAmount <= 0) {
            return { success: false, error: 'No pending payment' };
        }

        const dueDate = new Date(booking.createdAt);
        dueDate.setDate(dueDate.getDate() + 7); // 7 days from booking

        const mailOptions = {
            from: `"Trip Holiday" <${process.env.SMTP_USER || 'noreply@tripholiday.in'}>`,
            to: guestDetails.email,
            subject: `Payment Reminder - Booking ${bookingReference}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #FF7F27, #FF9F50); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
                        .alert-box { background: #fff3cd; border-left: 4px solid orange; padding: 15px; margin: 15px 0; border-radius: 5px; }
                        .amount { font-size: 2em; color: #FF7F27; font-weight: bold; text-align: center; margin: 20px 0; }
                        .button { background: #FF7F27; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
                        .footer { background: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>⏰ Payment Reminder</h1>
                        </div>
                        <div class="content">
                            <h2>Hello ${guestDetails.name},</h2>

                            <div class="alert-box">
                                <strong>⚠️ Pending Payment Alert</strong><br>
                                You have a pending payment for your Dubai Luxury Escape booking.
                            </div>

                            <p><strong>Booking Reference:</strong> ${bookingReference}</p>

                            <div class="amount">
                                ₹${payment.pendingAmount.toLocaleString('en-IN')}
                            </div>

                            <p style="text-align: center; color: #666;">Pending Amount</p>

                            <p><strong>Payment Due Date:</strong> ${dueDate.toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</p>

                            <div style="text-align: center; margin: 20px 0;">
                                <a href="http://localhost:5000/api/bookings/${booking._id}" class="button">Pay Now</a>
                            </div>

                            <p><strong>Why complete the payment?</strong></p>
                            <ul>
                                <li>Ensure your booking is fully confirmed</li>
                                <li>Avoid last-minute payment hassles</li>
                                <li>Get detailed itinerary and travel documents</li>
                            </ul>

                            <p>For assistance, contact us:</p>
                            <p>📞 Phone: 7042252130<br>
                            📧 Email: Info@tripholiday.in</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2025 Trip Holiday. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Payment reminder email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending payment reminder email:', error);
        return { success: false, error: error.message };
    }
}

// Send SMS notification (using a mock function - replace with actual SMS service like Twilio or MSG91)
async function sendSMS(phoneNumber, message) {
    try {
        // TODO: Integrate with SMS service (Twilio, MSG91, etc.)
        // For now, just log the SMS
        console.log(`SMS to ${phoneNumber}: ${message}`);

        // Example for Twilio integration:
        /*
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = require('twilio')(accountSid, authToken);

        const result = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
        });

        return { success: true, messageId: result.sid };
        */

        // Mock success response
        return { success: true, messageId: 'MOCK_SMS_ID', mock: true };
    } catch (error) {
        console.error('Error sending SMS:', error);
        return { success: false, error: error.message };
    }
}

// Send booking confirmation SMS
async function sendBookingConfirmationSMS(booking) {
    const { guestDetails, payment, bookingReference } = booking;

    let message = `Trip Holiday: Your booking is confirmed! Reference: ${bookingReference}. `;
    message += `Amount Paid: Rs.${payment.paidAmount}. `;

    if (payment.pendingAmount > 0) {
        message += `Pending: Rs.${payment.pendingAmount}. `;
    }

    message += `For details, check your email or call 7042252130.`;

    return await sendSMS(guestDetails.phone, message);
}

// Send pending payment reminder SMS
async function sendPendingPaymentReminderSMS(booking) {
    const { guestDetails, payment, bookingReference } = booking;

    if (payment.pendingAmount <= 0) {
        return { success: false, error: 'No pending payment' };
    }

    const message = `Trip Holiday: Payment reminder for booking ${bookingReference}. ` +
                   `Pending amount: Rs.${payment.pendingAmount}. ` +
                   `Please complete payment. Call 7042252130 for help.`;

    return await sendSMS(guestDetails.phone, message);
}

module.exports = {
    sendBookingConfirmationEmail,
    sendPendingPaymentReminderEmail,
    sendBookingConfirmationSMS,
    sendPendingPaymentReminderSMS,
    sendSMS
};
