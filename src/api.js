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

export async function requestMicPermission() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      
        console.log("Microphone access granted:", stream);
        return true;
      } catch (err) {
      
        console.error("Microphone access denied or error:", err);
        return false;
      }
    }
