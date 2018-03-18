---
id: codec
title: Codec
sidebar_label: Codec
---

You can define custom payload `Encoder` and `Decoder` to support other formats like [MessagePack](https://msgpack.org/index.html).
This will reset the server and client codecs.

```js
function encode(msg, isServerEncoding) {
  return ''
}
function decode(msg, isServerDecoding) {
  return ''
}
hemera.setEncoder(encode)
hemera.setDecoder(encode)
```
