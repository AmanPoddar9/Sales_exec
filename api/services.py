import os
import sys
import json
import logging
from dotenv import load_dotenv
from deepgram import DeepgramClient
from openai import OpenAI

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def validate_env():
    """Load and validate environment variables."""
    load_dotenv()
    
    deepgram_key = os.getenv("DEEPGRAM_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    if not deepgram_key or not openai_key:
        error_msg = "Missing API keys in .env file. Please ensure DEEPGRAM_API_KEY and OPENAI_API_KEY are set."
        logging.error(error_msg)
        raise ValueError(error_msg)
        
    return deepgram_key, openai_key

def transcribe_audio(file_path_or_buffer, deepgram_key):
    """
    Transcribe audio file using Deepgram with speaker diarization.
    Returns a formatted string of the conversation.
    """
    try:
        logging.info("Sending file to Deepgram for transcription...")
        deepgram = DeepgramClient(api_key=deepgram_key)

        if isinstance(file_path_or_buffer, str):
            if not os.path.exists(file_path_or_buffer):
                raise FileNotFoundError(f"File not found: {file_path_or_buffer}")
            with open(file_path_or_buffer, "rb") as file:
                buffer_data = file.read()
        else:
            # Assume it's bytes or a file-like object
            buffer_data = file_path_or_buffer

        # Prepare options
        options = {
            "model": "nova-2",
            "language": "hi", 
            "diarize": True,
            "smart_format": True,
            "punctuate": True,
            "filler_words": True,
            "utt_split": 0.5, # Reduce utterance split threshold to catch quick speaker turns
        }

        # Call Deepgram API
        response = deepgram.listen.v1.media.transcribe_file(
            request=buffer_data, 
            **options
        )
        
        # Parse response
        transcript_str = ""
        
        if response.results and response.results.channels:
            # Assuming mono audio, taking the first channel
            channel = response.results.channels[0]
            if channel.alternatives:
                words = channel.alternatives[0].words
                if not words:
                    logging.warning("No speech detected.")
                    return ""
                
                current_speaker = None
                current_sentence = []
                
                for word in words:
                    speaker = word.speaker
                    content = word.punctuated_word if word.punctuated_word else word.word
                    
                    if current_speaker is None:
                        current_speaker = speaker
                    
                    if speaker != current_speaker:
                        # Flush current sentence
                        line = f"Speaker {current_speaker}: {' '.join(current_sentence)}"
                        transcript_str += line + "\n"
                        current_sentence = []
                        current_speaker = speaker
                    
                    current_sentence.append(content)
                
                # Flush last sentence
                if current_sentence:
                    line = f"Speaker {current_speaker}: {' '.join(current_sentence)}"
                    transcript_str += line + "\n"
                    
        return transcript_str

    except Exception as e:
        logging.error(f"Deepgram Transcription Failed: {e}")
        raise

def analyze_conversation(transcript_text, openai_key):
    """
    Analyze the transcript using OpenAI GPT-4o to extract intelligence.
    Returns a JSON string.
    """
    try:
        logging.info("Sending transcript to OpenAI for analysis...")
        client = OpenAI(api_key=openai_key)

        # Smart Diarization Fallback
        # If Deepgram failed to split speakers (only Speaker 0 found), ask GPT-4o to fix it.
        if "Speaker 1:" not in transcript_text:
            logging.warning("Deepgram detected only 1 speaker. Attempting AI-based diarization fallback...")
            try:
                diarization_prompt = f"""
                You are an expert editor. The following text contains a conversation between two people (e.g. Sales Rep and Customer), but the transcription software merged them into "Speaker 0".
                
                Please rewrite the transcript by determining the speaker turns based on context, questions, and answers.
                - Assign "Speaker 0" to the Sales Rep.
                - Assign "Speaker 1" to the Customer.
                - Output ONLY the rewritten transcript with labels "Speaker 0:" and "Speaker 1:".
                
                Raw Text:
                {transcript_text}
                """
                
                fix_response = client.chat.completions.create(
                    model="gpt-4o",
                    messages=[{"role": "user", "content": diarization_prompt}],
                    temperature=0.1
                )
                fixed_transcript = fix_response.choices[0].message.content
                if "Speaker 1:" in fixed_transcript:
                    logging.info("AI successfully re-diarized the transcript.")
                    transcript_text = fixed_transcript
                    # Only print to stdout if run as main script, otherwise log
                    logging.info("\nAI-DIARIZED TRANSCRIPT\n" + transcript_text)
            except Exception as e:
                logging.error(f"Fallback diarization failed: {e}")

        system_prompt = """You are an AI Sales Operations Manager. Analyze the following transcript between a Field Sales Rep (likely Speaker 0 or the dominant speaker) and a Prospect.

Output ONLY a JSON object with this exact schema:
{
  "is_sales_call": boolean, // Is this a business conversation?
  "customer_name": string or null, // Extract if mentioned
  "summary": string, // 2-sentence summary of the deal status
  "topics_discussed": ["list", "of", "topics"],
  "customer_sentiment": "Positive" | "Neutral" | "Negative" | "Hostile",
  "objections_raised": ["list", "of", "reasons", "for", "hesitation"],
  "action_items": [
      {"task": "description", "due_date": "approximate time or null"}
  ]
}
Do not output markdown formatting (```json), just the raw JSON string."""

        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": transcript_text}
            ],
            temperature=0.2, # Low temperature for consistent JSON
        )

        return completion.choices[0].message.content

    except Exception as e:
        logging.error(f"OpenAI Analysis Failed: {e}")
        raise

def main():
    if len(sys.argv) < 2:
        print("Usage: python main.py <path_to_audio_file>")
        sys.exit(1)
        
    audio_file_path = sys.argv[1]
    
    try:
        # 1. Setup
        deepgram_key, openai_key = validate_env()
        
        # 2. Transcribe
        transcript = transcribe_audio(audio_file_path, deepgram_key)
        
        print("\n" + "="*40)
        print("TRANSCRIPT")
        print("="*40)
        print(transcript)
        print("="*40 + "\n")
        
        # 3. Analyze
        if not transcript.strip():
            logging.warning("Empty transcript, skipping analysis.")
            return

        analysis_json = analyze_conversation(transcript, openai_key)
        
        print("INTELLIGENCE ANALYSIS")
        print("="*40)
        # Try to pretty print if it's valid JSON
        try:
            parsed_json = json.loads(analysis_json)
            print(json.dumps(parsed_json, indent=4))
        except json.JSONDecodeError:
            print(analysis_json) # Fallback to raw string
        print("="*40)
        
    except Exception as e:
        logging.error(f"Process failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
