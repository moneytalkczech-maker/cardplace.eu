import Tesseract from "tesseract.js";

export interface OcrResult {
  text: string;
  confidence: number;
  words: { text: string; confidence: number }[];
}

class OcrService {
  private static instance: OcrService;

  static getInstance(): OcrService {
    if (!OcrService.instance) {
      OcrService.instance = new OcrService();
    }
    return OcrService.instance;
  }

  async recognize(image: HTMLImageElement): Promise<OcrResult> {
    try {
      const result = await Tesseract.recognize(image, "eng+ces", {
        logger: () => {}, // suppress progress logs
      });

      const words = (result.data as any).words?.map((w: any) => ({
        text: w.text,
        confidence: w.confidence,
      })) || [];

      return {
        text: result.data.text.trim(),
        confidence: result.data.confidence,
        words,
      };
    } catch (err) {
      console.error("OCR failed:", err);
      return { text: "", confidence: 0, words: [] };
    }
  }

  /** Extracts likely card name from OCR text by filtering noise */
  extractCardName(ocrText: string): string {
    // Remove common OCR noise
    return ocrText
      .replace(/[^a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ\s-]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .split(/\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 2)
      .sort((a, b) => b.length - a.length)[0] || "";
  }
}

export default OcrService;
