import React from 'react';
import { AnalysisResult, ActionItem } from '../types';

interface AnalysisViewProps {
  result: AnalysisResult;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ result }) => {
  const { analysis, transcription } = result;

  const sentimentColor = {
    'Positive': 'bg-green-100 text-green-800 border-green-200',
    'Neutral': 'bg-slate-100 text-slate-800 border-slate-200',
    'Negative': 'bg-orange-100 text-orange-800 border-orange-200',
    'Hostile': 'bg-red-100 text-red-800 border-red-200',
  }[analysis.customer_sentiment] || 'bg-slate-100 text-slate-800';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Left Column: Intelligence Dashboard */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Sales Intelligence Report</h2>
              <p className="text-slate-500 text-sm">Processed by Gemini Native Audio Model</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${sentimentColor}`}>
              {analysis.customer_sentiment} Sentiment
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer Name</span>
              <p className="text-slate-900 font-medium mt-1">{analysis.customer_name || 'Not Identified'}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Call Type</span>
              <p className="text-slate-900 font-medium mt-1">{analysis.is_sales_call ? 'Sales / Business' : 'Other'}</p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Executive Summary</h3>
            <p className="text-slate-700 leading-relaxed bg-indigo-50/50 p-4 rounded-lg border border-indigo-50 text-sm">
              {analysis.summary}
            </p>
          </div>
        </div>

        {/* Action Items & Topics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
              <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Action Items
            </h3>
            {analysis.action_items.length > 0 ? (
              <ul className="space-y-3">
                {analysis.action_items.map((item: ActionItem, idx: number) => (
                  <li key={idx} className="flex items-start text-sm">
                    <input type="checkbox" className="mt-1 mr-3 h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" readOnly />
                    <div className="flex-1">
                      <span className="text-slate-700 block">{item.task}</span>
                      {item.due_date && (
                        <span className="text-xs text-indigo-500 font-medium">Due: {item.due_date}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 italic">No action items detected.</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Topics Discussed
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.topics_discussed.map((topic, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Objections */}
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
          <h3 className="text-sm font-bold text-red-700 mb-4 flex items-center">
             <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            Objections & Hurdles
          </h3>
          {analysis.objections_raised.length > 0 ? (
            <ul className="list-disc list-inside space-y-2">
              {analysis.objections_raised.map((obj, idx) => (
                <li key={idx} className="text-sm text-slate-700">{obj}</li>
              ))}
            </ul>
          ) : (
             <p className="text-sm text-slate-400 italic">No major objections detected.</p>
          )}
        </div>
      </div>

      {/* Right Column: Transcript */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden max-h-[800px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-900">Transcript</h3>
            <p className="text-xs text-slate-500 mt-1">AI-generated • Speaker labeled</p>
          </div>
          <div className="p-4 overflow-y-auto flex-1 space-y-4 text-sm leading-relaxed">
            {transcription.split('\n').map((line, idx) => {
              const isSpeaker1 = line.toLowerCase().includes('speaker 1') || line.toLowerCase().includes('prospect');
              return (
                <div key={idx} className={`p-3 rounded-lg ${isSpeaker1 ? 'bg-indigo-50 ml-4' : 'bg-slate-50 mr-4'}`}>
                  <p className="text-slate-800 whitespace-pre-wrap">{line}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;