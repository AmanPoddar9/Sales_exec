import { IncomingForm } from 'formidable';
import fs from 'fs';
import { createClient } from '@deepgram/sdk';
import OpenAI from 'openai';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!deepgramApiKey || !openaiApiKey) {
    return res.status(500).json({ error: 'Missing API keys configuration' });
  }

  const form = new IncomingForm();

  try {
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Handle different file structures from formidable depending on version/config
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // 1. Transcribe with Deepgram
    const deepgram = createClient(deepgramApiKey);
    const fileBuffer = fs.readFileSync(file.filepath);

    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      fileBuffer,
      {
        model: 'nova-2',
        language: 'hi', // Optimized for Hindi/English field sales as per context
        smart_format: true,
        diarize: true,
        punctuate: true,
        filler_words: true,
        utt_split: 0.5,
      }
    );

    if (error) {
      console.error('Deepgram Error:', error);
      throw new Error('Transcription failed');
    }

    // Process transcript to get Speaker format
    let transcriptText = '';
    const words = result.results?.channels[0]?.alternatives[0]?.words || [];
    
    if (words.length > 0) {
      let currentSpeaker = null;
      let currentSentence = [];

      words.forEach((word) => {
        const speaker = word.speaker;
        const content = word.punctuated_word || word.word;

        if (currentSpeaker === null) currentSpeaker = speaker;

        if (speaker !== currentSpeaker) {
          transcriptText += `Speaker ${currentSpeaker}: ${currentSentence.join(' ')}\n`;
          currentSentence = [];
          currentSpeaker = speaker;
        }
        currentSentence.push(content);
      });
      
      if (currentSentence.length > 0) {
        transcriptText += `Speaker ${currentSpeaker}: ${currentSentence.join(' ')}\n`;
      }
    }

    if (!transcriptText) {
      return res.status(200).json({ 
        transcription: "", 
        analysis: { 
          summary: "No speech detected.", 
          is_sales_call: false,
          topics_discussed: [],
          customer_sentiment: "Neutral",
          objections_raised: [],
          action_items: []
        } 
      });
    }

    // 2. Analyze with OpenAI
    const openai = new OpenAI({ apiKey: openaiApiKey });
    const systemPrompt = `You are an AI Sales Operations Manager. Analyze the following transcript between a Field Sales Rep (likely Speaker 0 or the dominant speaker) and a Prospect.

Output ONLY a JSON object with this exact schema:
{
  "is_sales_call": boolean, 
  "customer_name": string or null, 
  "summary": string, 
  "topics_discussed": ["list", "of", "topics"],
  "customer_sentiment": "Positive" | "Neutral" | "Negative" | "Hostile",
  "objections_raised": ["list", "of", "reasons", "for", "hesitation"],
  "action_items": [
      {"task": "description", "due_date": "approximate time or null"}
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: transcriptText }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    return res.status(200).json({
      transcription: transcriptText,
      analysis: analysis
    });

  } catch (err) {
    console.error('Processing Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
