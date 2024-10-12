import { Component, Output, EventEmitter } from '@angular/core';
import { OpenAiService } from '../services/openai.service';

@Component({
  selector: 'app-ocr-popup',
  templateUrl: './ocr-popup.component.html',
  styleUrls: ['./ocr-popup.component.css']
})
export class OcrPopupComponent {
  @Output() close = new EventEmitter<void>();
  @Output() imageProcessed = new EventEmitter<string>();

  selectedImage: string | null = null;
  ocrResult: string | null = null;
  isProcessing: boolean = false;

  constructor(private openAiService: OpenAiService) {}

  getPopupTitle(): string {
    if (this.isProcessing) {
      return "Processing your file";
    } else if (this.selectedImage && !this.ocrResult) {
      return "Image uploaded";
    } else if (this.ocrResult) {
      return "";
    } else {
      return "Upload your file";
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.handleFile(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const dropArea = event.target as HTMLElement;
    dropArea.classList.add('drag-over');
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const dropArea = event.target as HTMLElement;
    dropArea.classList.remove('drag-over');
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const dropArea = event.target as HTMLElement;
    dropArea.classList.remove('drag-over');
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  handleFile(file: File) {
    if (file && (file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImage = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload a valid JPEG, JPG, or PNG file.');
    }
  }

  removeImage() {
    this.selectedImage = null;
    this.ocrResult = null;
  }

  async processImage() {
    if (this.selectedImage) {
      this.isProcessing = true;
      const ocrMessage = {
        content: "Please read the image being uploaded and give the text you understand. Your response should only contain text written in the image and nothing else",
        imageUrl: this.selectedImage
      };

      await this.getOcrResult(ocrMessage.content, ocrMessage.imageUrl);
      this.isProcessing = false;
    }
  }

  async getOcrResult(userMessage: string, imageData: string | null = null) {
    if (imageData) {
      try {
        this.ocrResult = await this.openAiService.analyzeImage(imageData, userMessage);
      } catch (error) {
        console.error('Error processing image:', error);
        this.ocrResult = "An error occurred while processing the image. Please try again.";
      }
    } else {
      this.ocrResult = "Invalid Results. Please try again after a reload!";
    }
  }

  closePopup() {
    this.close.emit();
  }
}
