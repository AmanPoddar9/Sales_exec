import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import AudioRecorder from './components/AudioRecorder'; // Import new component
import AnalysisView from './components/AnalysisView';
import { analyzeAudio } from './services/apiService';
import { AnalysisResult, AppState } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload'); // New Tab State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setAppState(AppState.IDLE);
    setAnalysisResult(null);
    setErrorMsg(null);
  };

  // Handle file from recorder
  const handleRecordingComplete = (file: File) => {
    setSelectedFile(file);
    // Auto-analyze or just set state? Let's just set state and let user click Analyze, 
    // or maybe show the file ready to analyze.
    // For better experience, let's treat it like a selected file.
    setAppState(AppState.IDLE);
    setAnalysisResult(null);
    setErrorMsg(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setAppState(AppState.PROCESSING);
    setErrorMsg(null);

    try {
      // Send directly to API
      const result = await analyzeAudio(selectedFile);
      
      setAnalysisResult(result);
      setAppState(AppState.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setAppState(AppState.ERROR);
      setErrorMsg(err.message || "An unexpected error occurred during analysis.");
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setAppState(AppState.IDLE);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="bg-indigo-600 p-2 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
             </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Field Sales Intelligence</h1>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">
            Powered by Deepgram & OpenAI
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Intro / Empty State */}
        {appState === AppState.IDLE && !selectedFile && (
           <div className="max-w-2xl mx-auto text-center mt-12 mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Turn Sales Calls into Strategy</h2>
              <p className="text-lg text-slate-600 mb-8">
                Upload your raw audio recordings. We'll transcribe the conversation and extract key insights, action items, and objections instantly.
              </p>
           </div>
        )}

        {/* Upload/Record Tabs */}
        {appState !== AppState.SUCCESS && (
        <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-slate-100 p-1 rounded-lg inline-flex w-full sm:w-auto">
                <button 
                    onClick={() => { setActiveTab('upload'); setSelectedFile(null); }}
                    className={`flex-1 sm:w-40 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'upload' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Upload File
                </button>
                <button 
                    onClick={() => { setActiveTab('record'); setSelectedFile(null); }}
                    className={`flex-1 sm:w-40 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'record' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Record Audio
                </button>
            </div>
        </div>
        )}

        {/* Action Area */}
        <div className="max-w-3xl mx-auto mb-10 transition-all duration-300">
           {appState !== AppState.SUCCESS && !selectedFile && (
               <>
                 {activeTab === 'upload' ? (
                    <FileUpload 
                        onFileSelect={handleFileSelect} 
                        disabled={appState === AppState.PROCESSING} 
                    />
                 ) : (
                    <AudioRecorder 
                        onRecordingComplete={handleRecordingComplete}
                    />
                 )}
               </>
           )}
        </div>

        {/* File Selected & Processing State */}
        {selectedFile && appState !== AppState.SUCCESS && (
          <div className="max-w-3xl mx-auto text-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 3-2 3-2zm0 0v-8" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900 truncate max-w-xs">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
             </div>

             {appState === AppState.PROCESSING ? (
               <div className="space-y-4">
                 <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden relative">
                    <div className="bg-indigo-600 h-2.5 rounded-full absolute top-0 left-0 w-full animate-progress-indeterminate"></div>
                 </div>
                 <p className="text-sm text-slate-600 animate-pulse">Analyzing audio content... This may take a moment.</p>
               </div>
             ) : (
                <div className="flex justify-center space-x-3">
                  <button 
                    onClick={handleAnalyze}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors focus:ring-4 focus:ring-indigo-100"
                  >
                    Start Analysis
                  </button>
                  <button 
                    onClick={handleReset}
                    className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
             )}
          </div>
        )}

        {/* Error State */}
        {appState === AppState.ERROR && errorMsg && (
          <div className="max-w-3xl mx-auto mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
             <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
             <div className="flex-1">
               <h3 className="text-sm font-bold text-red-800">Analysis Failed</h3>
               <p className="text-sm text-red-700 mt-1">{errorMsg}</p>
               <button onClick={handleReset} className="text-sm text-red-700 underline mt-2 hover:text-red-900">Try again</button>
             </div>
          </div>
        )}

        {/* Results View */}
        {appState === AppState.SUCCESS && analysisResult && (
           <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Analysis Results</h2>
                <button 
                  onClick={handleReset}
                  className="text-sm text-slate-500 hover:text-indigo-600 font-medium flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Analyze Another File
                </button>
             </div>
             <AnalysisView result={analysisResult} />
           </div>
        )}

      </main>

      <style>{`
        @keyframes progress-indeterminate {
          0% { left: -100%; width: 50%; }
          50% { left: 25%; width: 75%; }
          100% { left: 100%; width: 50%; }
        }
        .animate-progress-indeterminate {
          animation: progress-indeterminate 1.5s infinite linear;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default App;