import * as tf from "@tensorflow/tfjs";

interface BoundingBox {
  confidence: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

export interface DetectionResult {
  detected: boolean;
  confidence: number;
  boxCount: number;
}

class CardDetectionService {
  private static instance: CardDetectionService;
  private model: tf.GraphModel | null = null;
  private modelLoading: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): CardDetectionService {
    if (!CardDetectionService.instance) {
      CardDetectionService.instance = new CardDetectionService();
    }
    return CardDetectionService.instance;
  }

  async loadModel(): Promise<void> {
    if (this.model) return;
    if (this.modelLoading) return this.modelLoading;

    this.modelLoading = new Promise<void>((resolve, reject) => {
      tf.loadGraphModel("/model/model.json")
        .then((m) => { this.model = m; resolve(); })
        .catch((err) => { this.modelLoading = null; reject(err); });
    });

    return this.modelLoading;
  }

  isLoaded(): boolean {
    return this.model !== null;
  }

  private preprocess(image: HTMLImageElement) {
    const [h, w] = [image.height, image.width];
    const size = Math.max(h, w);
    const input = tf.tidy(() => {
      const img = tf.browser.fromPixels(image) as tf.Tensor3D;
      const padded = img.pad([[0, size - h], [0, size - w], [0, 0]]);
      return tf.image.resizeBilinear(padded as tf.Tensor3D, [640, 640]).div(255.0).expandDims(0);
    });
    return { input, scaleX: w / size, scaleY: h / size };
  }

  async detectCardPresence(image: HTMLImageElement): Promise<DetectionResult> {
    if (!this.model) {
      try {
        await this.loadModel();
      } catch {
        return { detected: false, confidence: 0, boxCount: 0 };
      }
    }
    if (!this.model) return { detected: false, confidence: 0, boxCount: 0 };

    const { input, scaleX, scaleY } = this.preprocess(image);
    try {
      const pred = this.model.predict(input) as tf.Tensor;
      const transposed = pred.squeeze([0]);
      const boxesData = transposed.slice([0, 0], [4, -1]).transpose();
      const scoresData = tf.max(transposed.slice([4, 0], [1, -1]), 0);

      const [boxesArr, scoresArr] = await Promise.all([
        boxesData.data(),
        scoresData.data(),
      ]);

      let bestConfidence = 0;
      let count = 0;
      for (let i = 0; i < scoresArr.length; i++) {
        if (scoresArr[i] > 0.3) {
          count++;
          if (scoresArr[i] > bestConfidence) {
            bestConfidence = scoresArr[i];
          }
        }
      }

      return {
        detected: count > 0,
        confidence: Math.round(bestConfidence * 100),
        boxCount: count,
      };
    } catch (err) {
      console.error("Card detection error:", err);
      return { detected: false, confidence: 0, boxCount: 0 };
    } finally {
      tf.dispose([input]);
    }
  }
}

export default CardDetectionService;
