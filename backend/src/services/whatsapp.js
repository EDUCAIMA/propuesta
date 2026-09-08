import axios from 'axios';

const WHAPI_URL = 'https://gate.whapi.cloud';
const WHAPI_TOKEN = process.env.WHAPI_TOKEN;

/**
 * Send a message via Whapi
 */
export const sendMessage = async (to, body) => {
  if (!WHAPI_TOKEN) {
    console.warn('WHAPI_TOKEN not set. Simulating message send to:', to, body);
    return { message_id: 'simulated_' + Date.now() };
  }

  try {
    const response = await axios.post(
      `${WHAPI_URL}/messages/text`,
      {
        typing_time: 0,
        to: `${to}@s.whatsapp.net`,
        body: body
      },
      {
        headers: {
          'Authorization': `Bearer ${WHAPI_TOKEN}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending WhatsApp message via Whapi:', error?.response?.data || error.message);
    throw error;
  }
};

/**
 * Download media (e.g. an incoming image) from Whapi as a base64 data URI
 */
export const downloadMedia = async (mediaId, mimeType = 'image/jpeg') => {
  if (!WHAPI_TOKEN) {
    console.warn('WHAPI_TOKEN not set. Cannot download media', mediaId);
    return null;
  }
  try {
    const response = await axios.get(`${WHAPI_URL}/media/${mediaId}`, {
      headers: { 'Authorization': `Bearer ${WHAPI_TOKEN}` },
      responseType: 'arraybuffer'
    });
    const contentType = response.headers['content-type'] || mimeType;
    const base64 = Buffer.from(response.data).toString('base64');
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('Error downloading media via Whapi:', error?.response?.data || error.message);
    return null;
  }
};

/**
 * Set webhook URL via Whapi
 */
export const setWebhook = async (webhookUrl) => {
  if (!WHAPI_TOKEN) {
      console.warn('WHAPI_TOKEN not set. Skipping webhook configuration.');
      return;
  }

  try {
    await axios.patch(
      `${WHAPI_URL}/settings`,
      {
        webhooks: [
          {
            url: webhookUrl,
            events: [
              { type: 'messages', action: 'insert' }
            ]
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${WHAPI_TOKEN}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`Webhook set successfully to ${webhookUrl}`);
  } catch (error) {
    console.error('Error setting Whapi webhook:', error?.response?.data || error.message);
  }
};
/**
 * Check connection status with Whapi
 */
export const checkStatus = async () => {
  if (!WHAPI_TOKEN) return { status: 'unconfigured' };
  try {
    const response = await axios.get(`${WHAPI_URL}/health`, {
      headers: { 'Authorization': `Bearer ${WHAPI_TOKEN}` }
    });
    return { status: 'connected', details: response.data };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
};
