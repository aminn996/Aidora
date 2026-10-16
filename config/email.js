const nodemailer = require('nodemailer');

// Check if email is configured
const isEmailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;

// Email transporter configuration
let transporter = null;

if (isEmailConfigured) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

// Email templates
const emailTemplates = {
  bookingConfirmed: (customer, provider, service, booking) => ({
    to: customer.email,
    subject: `✅ Your booking with ${provider.name} is confirmed!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Booking Confirmed! 🎉</h2>
        <p>Hi ${customer.name},</p>
        <p><strong>${provider.name}</strong> has confirmed your booking request.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Booking Details</h3>
          <p><strong>Service:</strong> ${service.title || service.name}</p>
          <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${booking.slot || 'To be confirmed'}</p>
          <p><strong>Price:</strong> TND ${booking.price?.toFixed(2) || '0.00'}</p>
          <p><strong>Provider:</strong> ${provider.name}</p>
          ${provider.phone ? `<p><strong>Contact:</strong> ${provider.phone}</p>` : ''}
        </div>
        
        <p>Please make sure to be available at the scheduled time.</p>
        <p>If you need to cancel or reschedule, please contact us as soon as possible.</p>
        
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Best regards,<br>
          <strong>Aidora Team</strong>
        </p>
      </div>
    `,
  }),

  bookingDeclined: (customer, provider, service, booking) => ({
    to: customer.email,
    subject: `❌ Your booking with ${provider.name} was declined`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6b6b;">Booking Declined</h2>
        <p>Hi ${customer.name},</p>
        <p>Unfortunately, <strong>${provider.name}</strong> has declined your booking request for the following service:</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Service Details</h3>
          <p><strong>Service:</strong> ${service.title || service.name}</p>
          <p><strong>Requested Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
          <p><strong>Time Slot:</strong> ${booking.slot || 'To be confirmed'}</p>
        </div>
        
        <p>Don't worry! You can try booking with another provider or request a different time slot.</p>
        <p><a href="${process.env.FRONTEND_URL}/services" style="display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 10px;">Browse Other Services</a></p>
        
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Best regards,<br>
          <strong>Aidora Team</strong>
        </p>
      </div>
    `,
  }),

  newBookingNotification: (provider, customer, service, booking) => ({
    to: provider.email,
    subject: `📌 New Booking Request from ${customer.name}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2196F3;">New Booking Request! 📅</h2>
        <p>Hi ${provider.name},</p>
        <p><strong>${customer.name}</strong> has requested a booking for your service:</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Booking Details</h3>
          <p><strong>Service:</strong> ${service.title || service.name}</p>
          <p><strong>Customer:</strong> ${customer.name}</p>
          <p><strong>Contact:</strong> ${customer.email}</p>
          ${customer.phone ? `<p><strong>Phone:</strong> ${customer.phone}</p>` : ''}
          <p><strong>Requested Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
          <p><strong>Time Slot:</strong> ${booking.slot || 'To be confirmed'}</p>
          <p><strong>Price:</strong> TND ${booking.price?.toFixed(2) || '0.00'}</p>
          ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
        </div>
        
        <p>Please review and respond to this booking request as soon as possible.</p>
        <p><a href="${process.env.FRONTEND_URL}/provider/bookings" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 10px;">View Bookings</a></p>
        
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Best regards,<br>
          <strong>Aidora Team</strong>
        </p>
      </div>
    `,
  }),
};

// Send email function - Only sends if configured
const sendEmail = async (emailType, data) => {
  // If email is not configured, silently skip
  if (!isEmailConfigured) {
    console.log(`ℹ️  Email not configured - skipping ${emailType}`);
    return true;
  }

  try {
    const emailOptions = emailTemplates[emailType](
      data.customer,
      data.provider,
      data.service,
      data.booking
    );

    await transporter.sendMail(emailOptions);
    console.log(`✅ Email sent: ${emailType} to ${emailOptions.to}`);
    return true;
  } catch (error) {
    console.error(`❌ Email error (${emailType}):`, error.message);
    // Don't throw error - let booking proceed even if email fails
    return false;
  }
};

module.exports = { sendEmail, transporter, emailTemplates, isEmailConfigured };
