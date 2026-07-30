import assert from "node:assert/strict";
import test from "node:test";
import { decodeDockerLogResponse, demuxDockerLogStream } from "./log-stream";

function frame(streamType: 0 | 1 | 2, payload: string) {
  const data = Buffer.from(payload, "utf8");
  const header = Buffer.alloc(8);
  header[0] = streamType;
  header.writeUInt32BE(data.length, 4);
  return Buffer.concat([header, data]);
}

test("demuxDockerLogStream strips multiplex headers from stdout and stderr", () => {
  const body = Buffer.concat([
    frame(1, "hello\n"),
    frame(2, "warn\n"),
  ]);

  assert.equal(demuxDockerLogStream(body), "hello\nwarn\n");
});

test("demuxDockerLogStream keeps multi-byte UTF-8 payloads intact", () => {
  const body = frame(1, "café 🚀\n");
  assert.equal(demuxDockerLogStream(body), "café 🚀\n");
});

test("decodeDockerLogResponse prefers plain text content types", () => {
  const body = Buffer.from("plain log line\n", "utf8");
  assert.equal(decodeDockerLogResponse(body, "text/plain"), "plain log line\n");
});

test("decodeDockerLogResponse demultiplexes docker raw streams", () => {
  const body = frame(1, "started\n");
  assert.equal(
    decodeDockerLogResponse(body, "application/vnd.docker.raw-stream"),
    "started\n"
  );
});
