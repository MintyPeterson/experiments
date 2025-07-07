import sentencize from "@stdlib/nlp-sentencize";

// Prettified from matts-llm-tools
// MIT License
//
// Copyright (c) 2024 Matt Williams
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
export function chunkTextBySentences(
  sourceText: string,
  sentencesPerChunk: number,
  overlap: number
): string[] {
  if (sentencesPerChunk < 2) {
    throw new Error("The number of sentences per chunk must be 2 or more.");
  }
  if (overlap < 0 || overlap >= sentencesPerChunk - 1) {
    throw new Error(
      "Overlap must be 0 or more and less than the number of sentences per chunk."
    );
  }

  const sentences = sentencize(sourceText);
  if (!sentences) {
    console.log("Nothing to chunk");
    return [];
  }

  const chunks: string[] = [];
  let i = 0;

  while (i < sentences.length) {
    let end = Math.min(i + sentencesPerChunk, sentences.length);
    let chunk = sentences.slice(i, end).join(" ");

    if (overlap > 0 && i > 1) {
      const overlapStart = Math.max(0, i - overlap);
      const overlapEnd = i;
      const overlapChunk = sentences.slice(overlapStart, overlapEnd).join(" ");
      chunk = overlapChunk + " " + chunk;
    }

    chunks.push(chunk.trim());

    i += sentencesPerChunk;
  }

  return chunks;
}
