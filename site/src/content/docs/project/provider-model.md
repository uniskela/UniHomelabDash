---
title: Provider model
description: The capability contract and safety metadata shared by homelab integrations.
sidebar:
  order: 2
---

Providers let the app add integrations without coupling every screen to a
vendor API.

## Capability vocabulary

The shared contract uses capabilities such as:

```ts
type ProviderCapability =
  | "service.status"
  | "service.logs"
  | "service.restart"
  | "service.start"
  | "service.stop"
  | "service.open"
  | "resource.cpu"
  | "resource.memory"
  | "resource.storage"
  | "alerts.read";
```

The UI discovers what an instance supports and hides or disables unsupported
controls. The server-side runtime still validates every requested capability;
browser visibility is not the permission boundary.

## Provider responsibilities

Each integration defines:

- name, icon, and configuration fields;
- required credentials;
- supported read and action capabilities;
- connection test;
- normalized resource and log methods;
- permission and safety metadata; and
- fixed action methods with clear error messages.

One provider failure is isolated from other instances. Secrets remain encrypted
at rest where supported and are redacted from errors and logs.

## Adding an integration

Start read-only. Open an issue describing the service, credentials, resources,
capabilities, failure behavior, and security impact before substantial code.
Actions need an explicit roadmap decision, provider setting, server-side
permission check, and confirmation naming the affected resource.

Avoid arbitrary API pass-throughs and shell execution. A provider should expose
only the small set of operations UniHomelabDash understands and can explain.
