import { Injectable } from '@angular/core';
import axios from 'axios';

@Injectable({
  providedIn: 'root'
})
export class OpenAiService {
  public apiKey = '';

  async transcribeAudio(audioBlob: Blob, language: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'text');
    formData.append('language', language);

    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async getChatResponse(transcribedText: string, chatHistory: any[]): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: '',
      },
      ...chatHistory,
      { role: 'user', content: transcribedText },
    ];

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o',
      messages: messages,
    }, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    return response.data.choices[0].message.content;
  }
  async analyzeImage(imageData: string, prompt: string): Promise<string> {
    try {
      console.log('Analyzing image with prompt:', prompt);
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o',  //'gpt-4-vision-preview'
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageData,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('API Response:', response.data);
      return response.data.choices[0].message.content;
    }catch (error) {
      // @ts-ignore
      console.error('Error in analyzeImage:', error.response ? error.response.data : error.message);
      // @ts-ignore
      throw new Error('Failed to analyze image: ' + (error.response ? error.response.data.error.message : error.message));
    }
  }

  async generateImage(prompt: string): Promise<string> {
    const response = await axios.post('https://api.openai.com/v1/images/generations', {
      model: 'dall-e-3',
      prompt: prompt,
    }, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    return response.data.data[0].url;
  }


}
