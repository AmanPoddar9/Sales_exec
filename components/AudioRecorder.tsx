import React, { useState, useRef, useEffect } from 'react';

interface AudioRecorderProps {
  onRecordingComplete: (file: File) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' }); 
        const file = new File([blob], "recording.webm", { type: 'audio/webm' });
        onRecordingComplete(file);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingTime(0);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 transition-colors">
      <div className="mb-6 relative">
         {/* Pulse Effect */}
         {isRecording && (
             <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
         )}
         
         <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`relative inline-flex items-center justify-center w-20 h-20 rounded-full focus:outline-none focus:ring-4 focus:ring-offset-2 transition-all duration-200 ${
                isRecording 
                ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 text-white'
            }`}
         >
            {isRecording ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
            ) : (
                <svg className="w-8 h-8 pl-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                </svg>
            )}
         </button>
      </div>

      <div className="text-center">
        <h3 className="text-lg font-medium text-slate-900 mb-1">
            {isRecording ? 'Recording in progress...' : 'Record Conversation'}
        </h3>
        <p className={`text-2xl font-mono font-bold ${isRecording ? 'text-red-500' : 'text-slate-400'}`}>
            {formatTime(recordingTime)}
        </p>
        {!isRecording && (
             <p className="text-sm text-slate-500 mt-2">
                 Click the microphone to start recording.
             </p>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;
