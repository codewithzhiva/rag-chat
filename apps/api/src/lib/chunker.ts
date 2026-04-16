/**
 * Splits text into overlapping chunks for embedding.
 * Uses character-based chunking with sentence boundary awareness.
 */
export function chunkText(
  text: string,
  chunkSize = 512,
  overlap = 50,
): string[] {
  // Normalise whitespace
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()

  const chunks: string[] = []
  let start = 0

  while (start < cleaned.length) {
    let end = Math.min(start + chunkSize, cleaned.length)

    // Try to break at sentence boundary if not at end
    if (end < cleaned.length) {
      const breakPoints = ['. ', '.\n', '? ', '! ', '\n\n']
      for (const bp of breakPoints) {
        const idx = cleaned.lastIndexOf(bp, end)
        if (idx > start + chunkSize / 2) {
          end = idx + bp.length
          break
        }
      }
    }

    const chunk = cleaned.slice(start, end).trim()
    if (chunk.length > 20) chunks.push(chunk)

    start = end - overlap
  }

  return chunks
}
