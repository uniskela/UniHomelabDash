import assert from "node:assert/strict";
import test from "node:test";
import {
  parseDockerConfig,
  parseDockerCredentials,
  validateDockerConfig,
} from "./config";

test("parseDockerConfig defaults to local unix socket", () => {
  assert.deepEqual(parseDockerConfig({}), {
    mode: "local",
    socketPath: "/var/run/docker.sock",
    host: "127.0.0.1",
    port: 2375,
  });
});

test("parseDockerConfig parses tcp remote settings", () => {
  assert.deepEqual(
    parseDockerConfig({ mode: "tcp", host: "192.168.1.10", port: "2375" }),
    {
      mode: "tcp",
      socketPath: "/var/run/docker.sock",
      host: "192.168.1.10",
      port: 2375,
    }
  );
});

test("parseDockerConfig defaults tls port to 2376", () => {
  assert.equal(parseDockerConfig({ mode: "tls", host: "docker.local" }).port, 2376);
});

test("validateDockerConfig requires tls material for tls mode", () => {
  const config = parseDockerConfig({ mode: "tls", host: "docker.local" });
  assert.match(
    validateDockerConfig(config, parseDockerCredentials({})) ?? "",
    /TLS mode requires/
  );
  assert.equal(
    validateDockerConfig(
      config,
      parseDockerCredentials({
        tlsCa: "ca",
        tlsCert: "cert",
        tlsKey: "key",
      })
    ),
    null
  );
});
