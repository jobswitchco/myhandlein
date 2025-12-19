//instagramService.js
import axios from 'axios';

const GRAPH_API_VERSION = 'v24.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

class InstagramService {

async fetchConversationsWithMessages(pageId, pageAccessToken, limit = 20) {
  try {
    const url = `${GRAPH_API_BASE}/${pageId}/conversations`;

    const params = {
      access_token: pageAccessToken,
      platform: "instagram",
      limit,
      fields: [
        "id",
        "participants",
        "messages.limit(10){name,created_time,is_unsupported,from,to,message,id,attachments{mime_type,file_url,image_data,name,id,size,video_data}}"
      ].join(",")
    };

    const response = await axios.get(url, { params });

    return response.data?.data || [];
  } catch (error) {
    console.error(
      "Error fetching conversations:",
      error.response?.data || error.message
    );
    throw new Error("Failed to fetch conversations from Instagram");
  }
}

// services/instagramService.js

async fetchOlderMessages({
  igConversationId,
  pageAccessToken,
  beforeCursor = null,
  limit = 20,
}) {
  try {
    const url = `${GRAPH_API_BASE}/${igConversationId}/messages`;

    const params = {
      access_token: pageAccessToken,
      limit,
      fields:
        "id,created_time,from,to,message,attachments{mime_type,file_url,image_data,video_data}",
    };

    if (beforeCursor) {
      params.before = beforeCursor;
    }

    const res = await axios.get(url, { params });

    return {
      messages: res.data?.data || [],
      paging: res.data?.paging || {},
    };
  } catch (err) {
    console.error(
      "Fetch older IG messages failed:",
      err.response?.data || err
    );
    throw err;
  }
}



 async sendMessage({ pageId, accessToken, payload }) {
    try {
      const res = await axios.post(
        `https://graph.facebook.com/v24.0/${pageId}/messages`,
        payload,
        {
          params: {
            access_token: accessToken,
          },
        }
      );

      return res.data;
    } catch (error) {
      console.error(
        "Instagram send message error:",
        error.response?.data || error
      );
      throw error;
    }
  }

}

export default new InstagramService();
