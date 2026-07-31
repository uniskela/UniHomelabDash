---
title: Install the PWA
description: Add UniHomelabDash to iPhone, Android, or desktop.
sidebar:
  order: 3
---

UniHomelabDash includes a web app manifest, service worker, install icons, and an
offline fallback. Installation keeps the dashboard one tap away; it does not
move server data onto the device.

## iPhone or iPad

1. Open the dashboard in Safari.
2. Tap **Share**.
3. Choose **Add to Home Screen**.
4. Confirm the name and tap **Add**.

iOS requires Safari for the Add to Home Screen flow.

## Android

1. Open the dashboard in Chrome.
2. Open the browser menu.
3. Choose **Install app** or **Add to Home screen**.
4. Confirm the installation.

## Desktop

Chrome and Edge show an install control in the address bar or browser menu.
Firefox can use the dashboard normally but does not provide the same desktop PWA
installation flow.

## Network and HTTPS notes

Browser install behavior is most reliable over HTTPS. A trusted LAN HTTP origin
can still be used in some environments, but reverse-proxy HTTPS is recommended
when the dashboard is used across multiple devices. Do not publish the login
page directly to the internet without additional access control.
