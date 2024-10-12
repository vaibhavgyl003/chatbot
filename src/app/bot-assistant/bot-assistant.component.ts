import { Component } from '@angular/core';
import { AudioService } from '../services/audio.service';
import { OpenAiService } from '../services/openai.service';
import { TextToSpeechService } from '../services/text-to-speech.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}
@Component({
  selector: 'app-bot-assistant',
  templateUrl: './bot-assistant.component.html',
  styleUrls: ['./bot-assistant.component.css'],
})

export class BotAssistantComponent {
  isRecording = false;
  // chatHistory: { role: string; content: string }[] = [];
  chatHistory: ChatMessage[] = [];
  userInput: string = '';
  selectedLanguage: string = 'en';
  isChatbotVisible = false;
  responseMode: 'text' | 'image' = 'text';
  selectedImage: string | null = null;
  isOcrPopupVisible = false;


  constructor(
    private audioService: AudioService,
    private openAiService: OpenAiService,
    private textToSpeechService: TextToSpeechService
  ) {}

  toggleChatbot() {
    this.isChatbotVisible = !this.isChatbotVisible;
    document.body.classList.toggle('show-chatbot');
  }
  openOcrPopup() {
    this.isOcrPopupVisible = true;
    this.isChatbotVisible = !this.isChatbotVisible;
  }

  closeOcrPopup() {
    this.isOcrPopupVisible = false;
    this.isChatbotVisible = !this.isChatbotVisible;
  }

  setResponseMode(mode: 'text' | 'image') {
    this.responseMode = mode;
  }

  async toggleRecording() {
    if (this.isRecording) {
      const audioBlob = await this.audioService.stopRecording();
      this.isRecording = false;
      this.processAudio(audioBlob);
    } else {
      this.audioService.startRecording();
      this.isRecording = true;
    }
  }

  listenToResponse(response: string) {
    this.textToSpeechService.cancel();
    const decodedResponse = this.textToSpeechService.decodeHtmlEntities(response);
    this.textToSpeechService.speak(decodedResponse);
  }

  async processAudio(audioBlob: Blob) {
    const transcribedText = await this.openAiService.transcribeAudio(
      audioBlob,
      this.selectedLanguage
    );
    await this.getChatResponse(transcribedText);
  }
  handleFileUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImage = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeSelectedImage() {
    this.selectedImage = null;
  }

  async sendMessage() {
    if (this.userInput.trim() || this.selectedImage) {
      const userMessage: ChatMessage = {
        role: 'user',
        content: this.userInput.trim(),
        imageUrl: this.selectedImage || undefined
      };

      this.chatHistory.push(userMessage);
      this.userInput = '';
      const imageCopy = this.selectedImage;
      this.selectedImage = null;
      await this.getChatResponse(userMessage.content, imageCopy);
    }
  }

  async getChatResponse(userMessage: string, imageData: string | null = null) {
    this.chatHistory.push({
      role: 'assistant',
      content: 'working...'
    });

    try {
      let response: string;
      if (this.responseMode === 'image') {
        response = await this.openAiService.generateImage(userMessage);
        this.chatHistory.pop();
        this.chatHistory.push({
          role: 'assistant',
          content: 'Here\'s the generated image:',
          imageUrl: response
        });
      } else {
        if (imageData) {
          console.log(imageData)
          response = await this.openAiService.analyzeImage(imageData, userMessage);

        } else {
          response = await this.openAiService.getChatResponse(userMessage, this.chatHistory);
        }

        this.chatHistory.pop();

        const [description, tableText, postTableText] = this.splitResponse(response);

        if (description) {
          this.chatHistory.push({
            role: 'assistant',
            content: this.formatMessage(description),
          });
        }

        if (tableText) {
          this.chatHistory.push({
            role: 'assistant',
            content: this.generateTableHtml(tableText),
          });
        }

        if (postTableText) {
          this.chatHistory.push({
            role: 'assistant',
            content: this.formatMessage(postTableText),
          });
        }
      }
    } catch (error) {
      console.error('Error getting chat response:', error);
      this.chatHistory.pop(); // Remove 'working...' message
      this.chatHistory.push({
        role: 'assistant',
        content: 'An error occurred while processing your request. Please try again.'
      });
    }
  }

  addImageToChat(imageUrl: string) {
    this.chatHistory.push({
      role: 'user',
      content: `<img src="${imageUrl}" alt="Uploaded Image" style="max-width: 100%; height: auto;" />`,
    });
    // You can add logic here to send the image to OpenAI for analysis if needed
    // For example:
    // this.analyzeImage(imageUrl);
  }

  splitResponse(response: string): [string, string, string] {
    const tableStartIndex = response.indexOf('|');
    if (tableStartIndex === -1) {
      return [response, '', ''];
    }

    const lines: string[] = response.split('\n');
    const tableLines: string[] = [];
    const descriptionLines: string[] = [];
    const postTableLines: string[] = [];
    let isTable = false;

    lines.forEach(line => {
      if (line.includes('|')) {
        isTable = true;
        tableLines.push(line);
      } else {
        if (isTable) {
          postTableLines.push(line);
        } else {
          descriptionLines.push(line);
        }
      }
    });

    const description = descriptionLines.join('\n').trim();
    const tableText = tableLines.join('\n').trim();
    const postTableText = postTableLines.join('\n').trim();

    return [description, tableText, postTableText];
  }

  generateTableHtml(tableText: string): string {
    const rows = tableText.split('\n').map(row => row.trim());

    let html = '<table class="">';

    rows.forEach(row => {
      if (row !== '') {
        html += '<tr>';
        row.split('|').forEach(cell => {
          html += `<td>${this.escapeHtml(cell.trim())}</td>`;
        });
        html += '</tr>';
      }
    });

    html += '</table>';

    return html;
  }

  ngOnDestroy(): void {
    this.textToSpeechService.cancel();
  }

  escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }


  formatMessage(message: string): string {
    const escapedMessage = this.escapeHtml(message);
    return escapedMessage
      .replace(/&#039;/g, "'")
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/#/g, '');
  }
}




