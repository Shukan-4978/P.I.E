const sendSMSOTP = async (to, code) => {
  // Clean and format the "to" number
  let targetNumber = to.replace(/\s+/g, ''); // Remove spaces
  if (!targetNumber.startsWith('+')) {
    // Default to +91 for India if no country code and 10 digits
    if (targetNumber.length === 10) {
      targetNumber = '+91' + targetNumber;
    } else {
      targetNumber = '+' + targetNumber;
    }
  }

  // Remove the '+' for platforms that don't want it (like Fast2SMS for Indian numbers)
  const plainNumber = targetNumber.replace('+', '');

  try {
    const platform = process.env.SMS_PLATFORM || 'fast2sms';
    console.log(`[SMS] Attempting to send OTP to ${targetNumber} using ${platform}...`);

    if (platform === 'fast2sms') {
      // Fast2SMS is a popular low-cost platform for Indian developers
      // Requires a valid Fast2SMS API key from fast2sms.com
      const apiKey = process.env.FAST2SMS_API_KEY;
      if (!apiKey || apiKey.startsWith('rzp_test_')) {
        throw new Error('Invalid or unconfigured Fast2SMS key in .env (Razorpay test key detected).');
      }
      
      const response = await fetch(`https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=otp&variables_values=${code}&numbers=${plainNumber}`, {
        method: 'GET'
      });

      const data = await response.json();
      if (data.return) {
        console.log(`[SMS] Fast2SMS: Successfully sent OTP to ${targetNumber}`);
        return true;
      } else {
        throw new Error(data.message || 'Fast2SMS error');
      }
    } else if (platform === 'twilio') {
      // Twilio Global Integration
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        throw new Error('Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) are missing in .env');
      }

      const client = require('twilio')(accountSid, authToken);
      const message = await client.messages.create({
        body: `Your P.I.E verification code is: ${code}. Valid for 10 minutes.`,
        from: fromNumber,
        to: targetNumber
      });

      console.log(`[SMS] Twilio: Successfully sent OTP to ${targetNumber}. Message SID: ${message.sid}`);
      return true;
    } else if (platform === 'textbelt') {
      // Textbelt (1 free SMS per day per IP)
      const response = await fetch('https://textbelt.com/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: targetNumber,
          message: `Your P.I.E verification code is: ${code}. Valid for 10 minutes.`,
          key: 'textbelt', 
        }),
      });

      const data = await response.json();
      if (data.success) {
        console.log(`[SMS] Textbelt: Successfully sent! Quota remaining: ${data.quotaRemaining}`);
        return true;
      } else {
        throw new Error(data.error || 'Textbelt limit reached');
      }
    } else {
      throw new Error('Unsupported SMS platform');
    }

  } catch (error) {
    console.warn(`[SMS ERROR] ${error.message}. Falling back to console log.`);
    console.log(`
      ----------------------------------------
      📱 [SMS MOCK] TO: ${targetNumber}
      💬 MESSAGE: Your P.I.E verification code is: ${code}
      ----------------------------------------
    `);
    return true; // Return true so the user flow isn't broken during development
  }
};

module.exports = { sendSMSOTP };
