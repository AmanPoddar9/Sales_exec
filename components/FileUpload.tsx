import React, { useCallback } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled) return;
      
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('audio/')) {
          onFileSelect(file);
        } else {
          alert('Please upload a valid audio file.');
        }
      }
    },
    [disabled, onFileSelect]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 
        ${disabled ? 'opacity-50 cursor-not-allowed border-slate-300 bg-slate-50' : 'border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer bg-white'}`}
    >
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="p-4 bg-indigo-100 rounded-full text-indigo-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-medium text-slate-700">Drop your sales recording here</p>
          <p className="text-sm text-slate-500 mt-1">or click to browse (MP3, WAV, M4A)</p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;