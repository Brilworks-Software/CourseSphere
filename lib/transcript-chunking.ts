/**
 * Transcript Chunking Service
 * Splits long transcripts into semantically coherent chunks for embedding and retrieval
 */

export interface TranscriptChunk {
  text: string;
  charStartPosition: number;
  charEndPosition: number;
  chunkOrder: number;
  wordCount: number;
}

/**
 * Estimate number of words from character count
 * Average English word: ~5 characters + 1 space
 */
function estimateWordCount(text: string): number {
  return Math.ceil(text.split(/\s+/).filter((w) => w.length > 0).length);
}

/**
 * Split text by sentences while preserving context
 * Returns array of sentences
 */
function splitBySentences(
  text: string,
): Array<{ text: string; start: number; end: number }> {
  const sentences: Array<{ text: string; start: number; end: number }> = [];
  let currentStart = 0;

  // Match sentences ending with . ! ? followed by space or end of text
  const sentenceRegex = /[^.!?]*[.!?]+(?=\s+|$)/g;
  let match;

  while ((match = sentenceRegex.exec(text)) !== null) {
    const sentenceText = match[0].trim();
    if (sentenceText.length > 0) {
      sentences.push({
        text: sentenceText,
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  return sentences;
}

/**
 * Split text by paragraphs (double newlines or significant whitespace)
 * Returns array of paragraphs with positions
 */
function splitByParagraphs(
  text: string,
): Array<{ text: string; start: number; end: number }> {
  const paragraphs: Array<{ text: string; start: number; end: number }> = [];

  // Split by double newlines or multiple whitespace
  const parts = text.split(/\n\n+|\r\n\r\n+/);
  let currentPos = 0;

  for (const part of parts) {
    if (part.trim().length === 0) {
      currentPos += part.length + 2; // Account for newlines
      continue;
    }

    const trimmedPart = part.trim();
    const startPos = text.indexOf(trimmedPart, currentPos);

    paragraphs.push({
      text: trimmedPart,
      start: startPos,
      end: startPos + trimmedPart.length,
    });

    currentPos = startPos + trimmedPart.length;
  }

  return paragraphs;
}

/**
 * Main chunking function: splits transcript into semantic chunks
 * Target: 2-5 minutes of speech (~500-1500 words)
 *
 * Strategy:
 * 1. Split by paragraphs first (preserve semantic boundaries)
 * 2. Group paragraphs until reaching 500-1500 words (optimal chunk size)
 * 3. If single paragraph > 1500 words, split by sentences within that paragraph
 *
 * @param transcript - The full transcript text
 * @param targetMinWords - Minimum words per chunk (default 500 ~2-3 min speech)
 * @param targetMaxWords - Maximum words per chunk (default 1500 ~5-7 min speech)
 * @returns Array of transcript chunks with metadata
 */
export function chunkTranscriptBySemantic(
  transcript: string,
  targetMinWords: number = 500,
  targetMaxWords: number = 1500,
): TranscriptChunk[] {
  if (!transcript || transcript.trim().length === 0) {
    return [];
  }

  const chunks: TranscriptChunk[] = [];
  const paragraphs = splitByParagraphs(transcript);

  if (paragraphs.length === 0) {
    return [];
  }

  let currentChunkText = "";
  let currentChunkStartPos = 0;
  let chunkOrder = 0;
  let charPosition = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    const paragraphWords = estimateWordCount(paragraph.text);

    // If this is the first paragraph in a chunk, initialize start position
    if (currentChunkText.length === 0) {
      currentChunkStartPos = paragraph.start;
    }

    let testText = currentChunkText
      ? currentChunkText + "\n\n" + paragraph.text
      : paragraph.text;
    const testWords = estimateWordCount(testText);

    // Case 1: Single paragraph > max words - split by sentences
    if (paragraphWords > targetMaxWords) {
      // First, finalize current chunk if it exists
      if (currentChunkText.length > 0) {
        const wordCount = estimateWordCount(currentChunkText);
        chunks.push({
          text: currentChunkText,
          charStartPosition: currentChunkStartPos,
          charEndPosition: currentChunkStartPos + currentChunkText.length,
          chunkOrder: chunkOrder++,
          wordCount,
        });
        currentChunkText = "";
      }

      // Split long paragraph into sentence-based chunks
      const sentences = splitBySentences(paragraph.text);
      let sentenceChunkText = "";
      let sentenceChunkStart = paragraph.start;

      for (const sentence of sentences) {
        const sentenceWords = estimateWordCount(sentence.text);
        let sentenceTest = sentenceChunkText
          ? sentenceChunkText + " " + sentence.text
          : sentence.text;
        const sentenceTestWords = estimateWordCount(sentenceTest);

        if (
          sentenceChunkText.length > 0 &&
          sentenceTestWords > targetMaxWords
        ) {
          // Save current sentence chunk
          const wordCount = estimateWordCount(sentenceChunkText);
          chunks.push({
            text: sentenceChunkText,
            charStartPosition: sentenceChunkStart,
            charEndPosition: sentenceChunkStart + sentenceChunkText.length,
            chunkOrder: chunkOrder++,
            wordCount,
          });
          sentenceChunkText = sentence.text;
          sentenceChunkStart = sentence.start;
        } else {
          sentenceChunkText = sentenceChunkText
            ? sentenceChunkText + " " + sentence.text
            : sentence.text;
        }
      }

      // Save final sentence chunk
      if (sentenceChunkText.length > 0) {
        const wordCount = estimateWordCount(sentenceChunkText);
        chunks.push({
          text: sentenceChunkText,
          charStartPosition: sentenceChunkStart,
          charEndPosition: sentenceChunkStart + sentenceChunkText.length,
          chunkOrder: chunkOrder++,
          wordCount,
        });
      }

      currentChunkText = "";
    } else if (testWords >= targetMinWords && testWords <= targetMaxWords) {
      // Case 2: Adding paragraph keeps us in optimal range
      currentChunkText = testText;
    } else if (testWords > targetMaxWords && currentChunkText.length > 0) {
      // Case 3: Adding paragraph exceeds max - save current chunk and start new
      const wordCount = estimateWordCount(currentChunkText);
      chunks.push({
        text: currentChunkText,
        charStartPosition: currentChunkStartPos,
        charEndPosition: currentChunkStartPos + currentChunkText.length,
        chunkOrder: chunkOrder++,
        wordCount,
      });
      currentChunkText = paragraph.text;
      currentChunkStartPos = paragraph.start;
    } else {
      // Case 4: Below min words or empty current chunk - accumulate
      currentChunkText = testText;
    }
  }

  // Save final chunk if exists
  if (currentChunkText.length > 0) {
    const wordCount = estimateWordCount(currentChunkText);
    chunks.push({
      text: currentChunkText,
      charStartPosition: currentChunkStartPos,
      charEndPosition: currentChunkStartPos + currentChunkText.length,
      chunkOrder: chunkOrder,
      wordCount,
    });
  }

  return chunks;
}

/**
 * Validate chunks are properly formed
 * Useful for testing and debugging
 */
export function validateChunks(chunks: TranscriptChunk[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    if (!chunk.text || chunk.text.trim().length === 0) {
      errors.push(`Chunk ${i}: Empty text`);
    }

    if (chunk.charStartPosition < 0) {
      errors.push(
        `Chunk ${i}: Invalid start position ${chunk.charStartPosition}`,
      );
    }

    if (chunk.charEndPosition <= chunk.charStartPosition) {
      errors.push(
        `Chunk ${i}: Invalid end position (${chunk.charEndPosition} <= ${chunk.charStartPosition})`,
      );
    }

    if (chunk.chunkOrder !== i) {
      errors.push(`Chunk ${i}: Order mismatch (${chunk.chunkOrder})`);
    }

    if (chunk.wordCount <= 0) {
      errors.push(`Chunk ${i}: Invalid word count ${chunk.wordCount}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
