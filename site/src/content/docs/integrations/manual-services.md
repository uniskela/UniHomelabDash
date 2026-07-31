---
title: Manual services
description: Use the built-in provider without credentials or host-level access.
sidebar:
  order: 1
---

The manual provider is always available and uses the existing `services` table.
It has no provider database row, credentials, socket mount, or remote API.

Use manual services for:

- applications that only need an **Open** shortcut;
- simple server-side HTTP health checks;
- devices without a supported provider API;
- documenting the host, category, and non-sensitive operator notes; and
- turning useful container ports into dashboard cards.

Manual services are intentionally small. They do not create background jobs,
run shell commands, or discover services automatically.

For field behavior and health states, see
[Services and health checks](../using/services-and-health/).
