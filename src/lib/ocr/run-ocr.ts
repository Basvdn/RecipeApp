import { createWorker, OEM } from "tesseract.js";

export async function runOcr(
  image: Blob,
  onProgress?: (progress: number) => void
): Promise<string> {
  const worker = await createWorker("eng+nld", OEM.LSTM_ONLY, {
    workerPath: "/tesseract/worker.min.js",
    corePath: "/tesseract/core",
    langPath: "/tesseract/lang-data",
    logger: (message) => {
      if (message.status === "recognizing text" && onProgress) {
        onProgress(message.progress);
      }
    },
  });

  try {
    const {
      data: { text },
    } = await worker.recognize(image);
    return text;
  } finally {
    await worker.terminate();
  }
}
