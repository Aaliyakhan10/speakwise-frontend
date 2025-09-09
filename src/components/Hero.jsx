import React, { useEffect, useRef, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

// ✅ Import Font Awesome icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';
import { sendTranscriptToBackend } from '../api';
import '../index.css';
import axios from 'axios';
const initialResponse={
    sentiment: '',
  emotion: '',
  intent: '',
  topics: [],
  summary: '',
  grammarMistakes: [],
  fillerWords: [],
  speechPaceEstimate: '',
  clarity: {
    clear: false,
    reason: ''
  }
  };

const Hero = () => {
  const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const [isListening, setIsListening] = useState(false);
    const [isAnalysing, setIsAnalysing] = useState(false);
  const transcriptRef = useRef(null);
  const [aiResponse, setAiResponse] = useState(initialResponse);
   const [isLoading, setIsLoading] = useState(false);

const Speech = window.SpeechRecognition || window.webkitSpeechRecognition || browserSupportsSpeechRecognition;

if (!Speech) {
  alert("Speech Recognition is not supported in this browser.");
}


  useEffect(() => {
  
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);


useEffect(() => {
  const checkHealth = async () => {
    const api_url = `${import.meta.env.VITE_BACKEND_URL}/health`;

    try {
      const res = await axios.get(api_url);

      console.log(res.data);
    } catch (error) {
      console.error("Error backend:", error);
    }
  };

  checkHealth();
}, []);

  

  const startListening = () => {
    // resetTranscript();
    SpeechRecognition.startListening({ continuous: true, language: 'en-IN' });
    setIsListening(true);
    setAiResponse(initialResponse);
    setIsAnalysing(false);
  };

  const stopListening = async () => {
    SpeechRecognition.stopListening();
    setIsListening(false);
    console.log(transcript);
    try {
      setIsLoading(true);
    const result = await sendTranscriptToBackend(transcript);
    console.log("Backend Analysis Result:", result);
    setIsAnalysing(true);
    setAiResponse(result);
  } catch (error) {
    console.error("Failed to send transcript for analysis.");
   
  }finally{
    setIsLoading(false);
  }
  };

  const pauseListening = () => {
    SpeechRecognition.stopListening();
    setIsListening(false);
  };
const resetListening = () => {
    resetTranscript();
    setIsListening(false);
  };
  return (
    <div className='w-full  flex flex-col items-center justify-start'>
      {isLoading && (<div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <div className="loader"></div>
    </div>)
    }

     
      <p className="text-xl font-medium mb-4 flex items-center gap-2">
        {isListening ? (
          <>
            <FontAwesomeIcon icon={faMicrophone} className="text-green-600 animate-pulse" />
            Listening...
          </>
        ) : (
          <>
            <FontAwesomeIcon icon={faMicrophoneSlash} className="text-red-600" />
            Mic Off
          </>
        )}
      </p>

      {/*  Transcript Box */}
      <div
        ref={transcriptRef}
        className="w-[50%] h-[50%] bg-teal-300 my-5 overflow-y-auto p-4 rounded"
      >
        {transcript || "Start speaking..."}
      </div>

      {/*  Controls */}
      <div>
        <button disabled={isListening} onClick={startListening}   className={`p-3 m-4 rounded-2xl text-2xl font-semibold bg-teal-100 text-blue-950 transition-opacity duration-300 ${
    isListening ? 'opacity-50 cursor-not-allowed' : ''
  }`}>
          Start
        </button>
        <button disabled={!isListening} onClick={pauseListening}   className={`p-3 m-4 rounded-2xl text-2xl font-semibold bg-teal-100 text-blue-950 transition-opacity duration-300 ${
    !isListening ? 'opacity-50 cursor-not-allowed' : ''
  }`}>
          Pause
        </button>
        <button disabled={!isListening} onClick={stopListening}   className={`p-3 m-4 rounded-2xl text-2xl font-semibold bg-teal-100 text-blue-950 transition-opacity duration-300 ${
    !isListening ? 'opacity-50 cursor-not-allowed' : ''
  }`}>
          Stop & Analyse
        </button>
         <button disabled={isListening} onClick={resetListening}   className={`p-3 m-4 rounded-2xl text-2xl font-semibold bg-teal-100 text-blue-950 transition-opacity duration-300 ${
    isListening ? 'opacity-50 cursor-not-allowed' : ''
  }`}>
          Reset
        </button>
      </div>
     {isAnalysing ?
      (<div className="mt-6 w-[60%] bg-white p-4 shadow-md rounded text-gray-800">
  <h2 className="text-xl font-bold mb-2">AI Analysis</h2>
  <p><strong>Sentiment:</strong> {aiResponse.sentiment}</p>
  <p><strong>Emotion:</strong> {aiResponse.emotion}</p>
  <p><strong>Intent:</strong> {aiResponse.intent}</p>
  <p><strong>Summary:</strong> {aiResponse.summary}</p>
  <p><strong>Speech Pace:</strong> {aiResponse.speechPaceEstimate}</p>
  <p>
    <strong>Clarity:</strong> {aiResponse.clarity.isClear ? 'Clear' : 'Unclear'} — {aiResponse.clarity.reason}
  </p>

  <div className="mt-2">
    <strong>Topics:</strong>
    <ul className="list-disc ml-5">
      {aiResponse.topics.map((topic, index) => (
        <li key={index}>{topic}</li>
      ))}
    </ul>
  </div>

  <div className="mt-2">
    <strong>Grammar Mistakes:</strong>
    {aiResponse.grammarMistakes.length === 0 ? (
      <p>None</p>
    ) : (
      <ul className="list-disc ml-5">
        {aiResponse.grammarMistakes.map((mistake, index) => (
          <li key={index}>
            <strong>Error:</strong> {mistake.error} <br />
            <strong>Suggestion:</strong> {mistake.suggestion}
          </li>
        ))}
      </ul>
    )}
     
  </div>
     

  <div className="mt-2">
    <strong>Filler Words:</strong>
    {aiResponse.fillerWords.length === 0 ? <p>None</p> : aiResponse.fillerWords.join(', ')}
  </div>
</div>):""
}

    </div>
  );
};

export default Hero;
