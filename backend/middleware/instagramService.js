//instagramService.js
import axios from 'axios';

const GRAPH_API_VERSION = 'v24.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

class InstagramService {


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
        "id,created_time,is_unsupported,from,to,message,attachments{mime_type,file_url,image_data,video_data}",
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

  async fetchConversations({ pageId, accessToken, limit = 20 }) {
  const url = `${GRAPH_API_BASE}/${pageId}/conversations`;

  const params = {
    access_token: accessToken,
    platform: "instagram",
    limit,
    fields: "id,participants"
  };

  const res = await axios.get(url, { params });
  return res.data?.data || [];
}

async fetchLatestMessages({
  igConversationId,
  accessToken,
  limit = 50,
}) {
  const res = await axios.get(
    `${GRAPH_API_BASE}/${igConversationId}/messages`,
    {
      params: {
        access_token: accessToken,
        limit,
        fields:
          "id,created_time,is_unsupported,from,to,message,attachments{mime_type,file_url,image_data,video_data}",
      },
    }
  );

  return {
    messages: res.data?.data || [],
  };
}





}

export default new InstagramService();
