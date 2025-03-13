import axios from 'axios';

async function transcribeAudioFromUrl(audioUrl, apiKey) {
  const response = await axios.post('https://api.mistral.ai/v1/audio/transcriptions', {
    audio_url: audioUrl,
    model: 'whisper-1'
  }, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data.text;
}

export default transcribeAudioFromUrl;