import assert from "node:assert/strict";
import test from "node:test";
import { mergePortainerCredentialUpdates } from "./credentials-merge";

test("mergePortainerCredentialUpdates preserves untouched fields", () => {
  const result = mergePortainerCredentialUpdates({
    existing: {
      portainerApiKey: "existing-token",
      portainerCaCert: "existing-ca",
    },
    apiKey: "rotated-token",
    caCert: "",
    clearToken: false,
  });

  assert.deepEqual(result, {
    credentials: {
      portainerApiKey: "rotated-token",
      portainerCaCert: "existing-ca",
    },
    preserveCredentials: false,
  });
});

test("mergePortainerCredentialUpdates can update CA without clearing the token", () => {
  const result = mergePortainerCredentialUpdates({
    existing: {
      portainerApiKey: "existing-token",
      portainerCaCert: "old-ca",
    },
    apiKey: "",
    caCert: "new-ca",
    clearToken: false,
  });

  assert.deepEqual(result, {
    credentials: {
      portainerApiKey: "existing-token",
      portainerCaCert: "new-ca",
    },
    preserveCredentials: false,
  });
});

test("mergePortainerCredentialUpdates clears the token while keeping CA", () => {
  const result = mergePortainerCredentialUpdates({
    existing: {
      portainerApiKey: "existing-token",
      portainerCaCert: "existing-ca",
    },
    apiKey: "",
    caCert: "",
    clearToken: true,
  });

  assert.deepEqual(result, {
    credentials: {
      portainerCaCert: "existing-ca",
    },
    preserveCredentials: false,
  });
});

test("mergePortainerCredentialUpdates clears stored CA while keeping the token", () => {
  const result = mergePortainerCredentialUpdates({
    existing: {
      portainerApiKey: "existing-token",
      portainerCaCert: "existing-ca",
    },
    apiKey: "",
    caCert: "",
    clearToken: false,
    clearCaCert: true,
  });

  assert.deepEqual(result, {
    credentials: {
      portainerApiKey: "existing-token",
    },
    preserveCredentials: false,
  });
});

test("mergePortainerCredentialUpdates preserves credentials when form fields are blank", () => {
  const result = mergePortainerCredentialUpdates({
    existing: {
      portainerApiKey: "existing-token",
    },
    apiKey: "",
    caCert: "",
    clearToken: false,
  });

  assert.deepEqual(result, {
    credentials: undefined,
    preserveCredentials: true,
  });
});
