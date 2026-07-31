---
title: Docker
description: Connect local or remote Docker Engines with safe defaults.
sidebar:
  order: 2
---

Docker integrations support container inventory, details, logs, and optional
start/stop/restart actions. Add and manage each Docker host separately in
**Settings → Integrations**.

## Safety defaults

Actions are **disabled by default** for every integration. Enabling actions is a
provider-level choice, and every start, stop, or restart still requires a
confirmation naming the container.

No browser code receives Docker credentials or socket access. The provider runs
server-side and exposes only fixed capabilities—never raw shell execution.

## Local Unix socket

Copy the provided example:

```bash
cp docker-compose.override.example.yml docker-compose.override.yml
```

Set the host Docker group ID in `.env`:

```bash
DOCKER_GID=996
```

Then rebuild and enable the integration in Settings.

> **Docker socket risk:** mounting `/var/run/docker.sock`, even read-only, is not
> a complete security boundary. A compromised application process may gain
> extensive control of the host. Use this only on a trusted system and network.

The default Compose file deliberately has no socket mount.

## Remote TCP

Enter the Docker host and port in Settings, then test the connection.

**TCP without TLS**—commonly port 2375—exposes a highly privileged Engine API to
any client that can reach it. Use it only on a tightly isolated network or VPN.
Never expose it to the public internet.

## Remote TLS

TLS—commonly port 2376—is the recommended remote mode. Provide:

- Docker host and port;
- CA certificate;
- client certificate; and
- client private key.

TLS material is encrypted at rest using a key derived from `SESSION_SECRET`.
Changing the session secret makes stored provider credentials unreadable, so
re-enter them after intentional rotation.

## Timeouts

`UH_DOCKER_REQUEST_TIMEOUT_MS` controls the general request timeout and defaults
to 15000 milliseconds. Keep values bounded so a failed host cannot make the
containers interface hang indefinitely.
