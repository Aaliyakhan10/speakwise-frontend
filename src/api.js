import axios from "axios";

export const sendTranscriptToBackend = async (transcript) => {
  try {
    const res = await axios.post(
      "http://localhost:8080/analyseAi",
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
