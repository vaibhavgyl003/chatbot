import { Injectable } from '@angular/core';

declare var responsiveVoice: any;

@Injectable({
  providedIn: 'root'
})
export class TextToSpeechService {

  constructor() { }

  speak(text: string): void {
    responsiveVoice.speak(text, 'Hindi Female');
  }

  cancel(): void {
    responsiveVoice.cancel();
  }
  
  decodeHtmlEntities(text: string): string {
    const cleanText = text.replace(/[#\*]/g, '');
    const decodedText = cleanText
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&039;/g, "'")
    return decodedText;
  }
  
}

