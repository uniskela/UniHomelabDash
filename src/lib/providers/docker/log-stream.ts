/**
 * Docker Engine log streams are multiplexed when the container has no TTY.
 * Each frame is an 8-byte header followed by a payload:
 *   byte 0: stream type (0 stdin, 1 stdout, 2 stderr)
 *   bytes 1-3: zero
 *   bytes 4-7: big-endian payload size
 */
export function decodeDockerLogResponse(body: Buffer, contentType = ""): string {
  const normalizedType = contentType.toLowerCase();

  if (normalizedType.includes("text/")) {
    return body.toString("utf8");
  }

  if (
    normalizedType.includes("application/vnd.docker.raw-stream") ||
    looksLikeMultiplexedStream(body)
  ) {
    return demuxDockerLogStream(body);
  }

  return body.toString("utf8");
}

export function demuxDockerLogStream(body: Buffer): string {
  if (body.length === 0) {
    return "";
  }

  if (!looksLikeMultiplexedStream(body)) {
    return body.toString("utf8");
  }

  const parts: Buffer[] = [];
  let offset = 0;

  while (offset + 8 <= body.length) {
    const streamType = body[offset];
    if (streamType !== 0 && streamType !== 1 && streamType !== 2) {
      break;
    }

    const size = body.readUInt32BE(offset + 4);
    offset += 8;

    if (size < 0 || offset + size > body.length) {
      break;
    }

    parts.push(body.subarray(offset, offset + size));
    offset += size;
  }

  if (parts.length === 0) {
    return body.toString("utf8");
  }

  return Buffer.concat(parts).toString("utf8");
}

function looksLikeMultiplexedStream(body: Buffer): boolean {
  if (body.length < 8) {
    return false;
  }

  const streamType = body[0];
  if (streamType !== 0 && streamType !== 1 && streamType !== 2) {
    return false;
  }

  if (body[1] !== 0 || body[2] !== 0 || body[3] !== 0) {
    return false;
  }

  const size = body.readUInt32BE(4);
  return size >= 0 && offsetFits(body.length, size);
}

function offsetFits(bodyLength: number, size: number) {
  return size <= bodyLength - 8;
}
