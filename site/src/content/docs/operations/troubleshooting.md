---
title: Troubleshooting
description: Diagnose startup, authentication, health-check, and provider problems.
sidebar:
  order: 4
---

## The production container will not start

Confirm `SESSION_SECRET` is present in `.env`:

```bash
docker compose config
docker compose logs unihomelabdash
```

Production startup intentionally fails without the secret.

## Sign-in redirects to the wrong origin

Set `PUBLIC_URL` to the exact HTTPS origin seen by the browser. Prefer it over
forwarded headers. If `TRUST_PROXY_HEADERS=true`, verify `ALLOWED_HOSTS` and
ensure the reverse proxy removes spoofed incoming forwarding headers.

## Secure cookie blocks local HTTP

`COOKIE_SECURE=true` tells the browser to send the session cookie only over
HTTPS. Leave it false on a trusted LAN HTTP test install; enable it when the
browser-facing URL uses HTTPS.

## A health check fails

- Confirm the configured URL is correct and uses HTTP or HTTPS.
- Test it from the host or application container, not only from your laptop.
- Check container DNS and LAN firewall rules.
- Remember that requests stop after five seconds.
- Do not embed credentials in the URL.

## Docker socket permission denied

The container runs as the `nextjs` user. Set `DOCKER_GID` to the host Docker
group ID used by `/var/run/docker.sock`, recreate the container, and test the
integration. Do not loosen the socket to world-writable permissions.

## A remote provider is slow

UniHomelabDash bounds provider calls with timeouts, caches short-lived inventory,
and cools down recently failed Portainer endpoints. Verify network routing,
certificates, reverse-proxy prefixes, and the provider's own health before
increasing a timeout.

## TLS or custom CA errors

Confirm that the CA signs the remote certificate, the hostname matches, and the
client certificate/key pair is complete. Re-enter encrypted provider material
after rotating `SESSION_SECRET`.

## Get help safely

Open a [GitHub issue](https://github.com/uniskela/UniHomelabDash/issues) with the
version, deployment method, sanitized logs, and reproduction steps. Remove real
hostnames, IP addresses, tokens, certificates, cookies, and service URLs.
