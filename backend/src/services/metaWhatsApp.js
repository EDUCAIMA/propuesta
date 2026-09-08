import axios from 'axios';

const META_VERSION = 'v20.0';
const META_ACCESS_TOKEN = process.env.META_TOKEN;
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;

/**
 * Send a message via Meta Official API
 */
export const sendMessageMeta = async (to, body) => {
  if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) {
    console.warn('META credentials not set. Falling back to simulation.');
    return { id: 'meta_simulated_' + Date.now() };
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/${META_VERSION}/${META_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: body }
      },
      {
        headers: {
          'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending WhatsApp message via Meta:', error?.response?.data || error.message);
    throw error;
  }
};
