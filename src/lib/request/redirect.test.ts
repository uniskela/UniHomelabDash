import assert from "node:assert/strict";
import test from "node:test";
import type { NextRequest } from "next/server";
import { redirectUrlFromRequest } from "./redirect";

function createRequest({
  url,
  host,
  forwardedHost,
  forwardedProto,
}: {
  url: string;
  host?: string;
  forwardedHost?: string;
  forwardedProto?: string;
}) {
  const headers = new Headers();
  if (host) {
    headers.set("host", host);
  }
  if (forwardedHost) {
    headers.set("x-forwarded-host", forwardedHost);
  }
  if (forwardedProto) {
    headers.set("x-forwarded-proto", forwardedProto);
  }

  return new Request(url, { headers }) as NextRequest;
}

test("redirectUrlFromRequest ignores spoofed proxy headers by default", () => {
  const request = createRequest({
    url: "http://127.0.0.1:3000/services",
    host: "127.0.0.1:3000",
    forwardedHost: "evil.example",
    forwardedProto: "https",
  });

  const redirectUrl = redirectUrlFromRequest(request, "/login");
  assert.equal(redirectUrl.origin, "http://127.0.0.1:3000");
  assert.equal(redirectUrl.pathname, "/login");
});

test("redirectUrlFromRequest uses PUBLIC_URL when configured", () => {
  const previous = process.env.PUBLIC_URL;
  process.env.PUBLIC_URL = "https://dash.pike.homes";

  try {
    const request = createRequest({
      url: "http://127.0.0.1:3000/services",
      host: "127.0.0.1:3000",
      forwardedHost: "evil.example",
      forwardedProto: "https",
    });

    const redirectUrl = redirectUrlFromRequest(request, "/login");
    assert.equal(redirectUrl.origin, "https://dash.pike.homes");
    assert.equal(redirectUrl.pathname, "/login");
  } finally {
    if (previous === undefined) {
      delete process.env.PUBLIC_URL;
    } else {
      process.env.PUBLIC_URL = previous;
    }
  }
});

test("redirectUrlFromRequest trusts proxy headers only for allowlisted hosts", () => {
  const previousTrust = process.env.TRUST_PROXY_HEADERS;
  const previousAllowed = process.env.ALLOWED_HOSTS;
  process.env.TRUST_PROXY_HEADERS = "true";
  process.env.ALLOWED_HOSTS = "dash.pike.homes";

  try {
    const allowedRequest = createRequest({
      url: "http://127.0.0.1:3000/services",
      host: "127.0.0.1:3000",
      forwardedHost: "dash.pike.homes",
      forwardedProto: "https",
    });
    const allowedRedirect = redirectUrlFromRequest(allowedRequest, "/login");
    assert.equal(allowedRedirect.origin, "https://dash.pike.homes");

    const spoofedRequest = createRequest({
      url: "http://127.0.0.1:3000/services",
      host: "127.0.0.1:3000",
      forwardedHost: "evil.example",
      forwardedProto: "https",
    });
    const spoofedRedirect = redirectUrlFromRequest(spoofedRequest, "/login");
    assert.equal(spoofedRedirect.origin, "http://127.0.0.1:3000");
  } finally {
    if (previousTrust === undefined) {
      delete process.env.TRUST_PROXY_HEADERS;
    } else {
      process.env.TRUST_PROXY_HEADERS = previousTrust;
    }

    if (previousAllowed === undefined) {
      delete process.env.ALLOWED_HOSTS;
    } else {
      process.env.ALLOWED_HOSTS = previousAllowed;
    }
  }
});

test("redirectUrlFromRequest rejects unsafe pathnames", () => {
  const request = createRequest({
    url: "http://127.0.0.1:3000/services",
    host: "127.0.0.1:3000",
  });

  const redirectUrl = redirectUrlFromRequest(request, "//evil.example/phish");
  assert.equal(redirectUrl.pathname, "/");
});

test("redirectUrlFromRequest normalizes 0.0.0.0 to localhost for browser redirects", () => {
  const request = createRequest({
    url: "http://0.0.0.0:3000/setup",
    host: "0.0.0.0:3000",
  });

  const redirectUrl = redirectUrlFromRequest(request, "/login");
  assert.equal(redirectUrl.origin, "http://localhost:3000");
  assert.equal(redirectUrl.pathname, "/login");
});
