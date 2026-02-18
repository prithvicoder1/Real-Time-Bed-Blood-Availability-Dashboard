const sendSMS = async (options) => {
    // In a real application, you would use Twilio, SNS, or another SMS gateway here.
    // For this hackathon/demo, we will simulate sending an SMS by logging to the console.

    console.log('================================================');
    console.log(`[Mock SMS Gateway]`);
    console.log(`To: ${options.phone}`);
    console.log(`Message: ${options.message}`);
    console.log('================================================');

    return Promise.resolve({ success: true, messageId: 'mock-sms-' + Date.now() });
};

module.exports = sendSMS;
