import axios from "axios";

export const sendTranscriptToBackend = async (transcript) => {
  const api_url = `${import.meta.env.VITE_BACKEND_URL}/analyseAi`;
  try {
    const res = await axios.post(
      api_url,
      {
        speech: transcript, 
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return res.data; 
  } catch (error) {
    console.error("Error sending transcript:", error);
    throw error;
  }
};
