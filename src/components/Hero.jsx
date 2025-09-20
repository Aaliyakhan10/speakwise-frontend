import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';
import { sendTranscriptToBackend, requestMicPermission } from '../api';
import axios from 'axios';
import '../index.css';

const initialResponse = {
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

// Utility to get supported MIME type for MediaRecorder
const getSupportedMimeType = () => {
  const possibleTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg'
  ];
  for (const mimeType of possibleTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return '';
};

const Hero = () => {
  const [isListening, setIsListening] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [aiResponse, setAiResponse] = useState(initialResponse);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [transcript, setTranscript] = useState('');
  const transcriptRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const checkAndRequestPermission = async () => {
      const granted = await requestMicPermission();
      setHasMicPermission(granted);
    };
    checkAndRequestPermission();
  }, []);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  const startListening = async () => {
    setTranscript('');
    setAiResponse(initialResponse);
    setIsAnalysing(false);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('ondataavailable fired, data size:', event.data.size);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('MediaRecorder stopped');
        console.log('Total chunks collected:', audioChunksRef.current.length);
        const totalSize = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.size, 0);
        console.log('Total size of all chunks:', totalSize);

        await handleStopRecording();
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
      };

      mediaRecorder.start();
      console.log('MediaRecorder started with mimeType:', mimeType);
      setIsListening(true);
    } catch (err) {
      console.error('Mic access error:', err);
      setIsListening(false);
      alert('Microphone access denied or not available.');
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      // DO NOT call handleStopRecording here!
    }
  };

  const handleStopRecording = async () => {
    setIsLoading(true);
    try {
      if (audioChunksRef.current.length === 0) {
        throw new Error('Recorded audio is empty. Please try again.');
      }

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      console.log('Uploading audio blob size:', audioBlob.size, 'type:', audioBlob.type);

      const uploadRes = await axios.post(
        'https://api.assemblyai.com/v2/upload',
        audioBlob,
        {
          headers: {
            authorization: import.meta.env.VITE_ASSEMBLY_API_KEY,
            'Content-Type': 'application/octet-stream'
          }
        }
      );

      const audioUrl = uploadRes.data.upload_url;

      // Request transcription
      const transcriptRes = await axios.post(
        'https://api.assemblyai.com/v2/transcript',
        { audio_url: audioUrl },
        {
          headers: {
            authorization: import.meta.env.VITE_ASSEMBLY_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      const transcriptId = transcriptRes.data.id;

      // Poll for transcription result
      let completedTranscript = null;
      while (!completedTranscript) {
        const pollingRes = await axios.get(
          `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
          {
            headers: { authorization: import.meta.env.VITE_ASSEMBLY_API_KEY }
          }
        );

        if (pollingRes.data.status === 'completed') {
          completedTranscript = pollingRes.data;
        } else if (pollingRes.data.status === 'error') {
          throw new Error('Transcription failed: ' + pollingRes.data.error);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      setTranscript(completedTranscript.text);

      // Send transcript to your backend for AI analysis
      const aiResult = await sendTranscriptToBackend(completedTranscript.text);
      setAiResponse(aiResult);
      setIsAnalysing(true);
    } catch (error) {
      console.error('Error during recording/transcription:', error);
      alert(error.message || 'An error occurred during recording or transcription.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetListening = () => {
    setTranscript('');
    setIsListening(false);
    setAiResponse(initialResponse);
    setIsAnalysing(false);
    audioChunksRef.current = [];
  };

  return (
    <div className="w-full flex flex-col items-center justify-start">
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
          <div className="loader"></div>
        </div>
      )}

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

      <div
        ref={transcriptRef}
        className="w-[90%] h-64 md:max-h-[60vh] overflow-y-scroll bg-teal-300 my-5 p-4 rounded"
      >
        {transcript || 'Start speaking...'}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
        <button disabled={isListening} onClick={startListening} className="btn">
          Start
        </button>
        <button disabled={!isListening} onClick={stopListening} className="btn">
          Stop & Analyse
        </button>
        <button disabled={isListening} onClick={resetListening} className="btn">
          Reset
        </button>
      </div>

      {isAnalysing && (
        <div className="mt-6 w-[60%] bg-white p-4 shadow-md rounded text-gray-800">
          <h2 className="text-xl font-bold mb-2">AI Analysis</h2>
          <p><strong>Sentiment:</strong> {aiResponse.sentiment}</p>
          <p><strong>Emotion:</strong> {aiResponse.emotion}</p>
          <p><strong>Intent:</strong> {aiResponse.intent}</p>
          <p><strong>Summary:</strong> {aiResponse.summary}</p>
          <p><strong>Speech Pace:</strong> {aiResponse.speechPaceEstimate}</p>
          <p>
            <strong>Clarity:</strong> {aiResponse.clarity.clear ? 'Clear' : 'Unclear'} — {aiResponse.clarity.reason}
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
        </div>
      )}
      <script async="async" data-cfasync="false" src="//pl27686786.revenuecpmgate.com/e368d2dd8e67a7337067d7719385532e/invoke.js"></script>
<div id="container-e368d2dd8e67a7337067d7719385532e"></div>
    </div>
  );
};

export default Hero;
