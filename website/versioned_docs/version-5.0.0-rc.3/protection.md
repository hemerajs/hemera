---
id: version-5.0.0-rc.3-protection
title: Built in protection
sidebar_label: Protection
original_id: protection
---

Hemera has some important built in protection capabilities:

* **Process policy**: Will exit the process when the policy (memory, event loop) could not be fullfilled (Option: `heavy`).
* **Message loop detection**: Will return an error if you call a route recursively (Option: `maxRecursion`).
* **Auto-pruning**: NATS automatically handles a slow consumer and cut it off.
