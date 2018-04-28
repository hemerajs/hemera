---
id: codec
title: Codec
sidebar_label: Codec
---

You can define custom payload `Encoder` and `Decoder` to support other formats like [MessagePack](https://msgpack.org/index.html).
This will reset the default `JSON` codec.

```js
function encode(msg) {
  return {
    value: JSON.stringify(msg),
    error: null
  }
}
function decode(msg) {
  return {
    value: JSON.parse(msg),
    error: null
  }
}
hemera.setClientEncoder(encode)
hemera.setClientDecoder(decode)

hemera.setServerEncoder(encode)
hemera.setServerDecoder(decode)
```
