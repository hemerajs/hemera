---
id: codec
title: Codec
sidebar_label: Codec
---

You can define custom payload `Encoder` and `Decoder` to support other formats like [MessagePack](https://msgpack.org/index.html).
This will reset the default `JSON` codec.

```js
function encode(msg) {
  return ''
}
function decode(msg) {
  return ''
}
hemera.setClientEncoder(encode)
hemera.setClientDecoder(encode)

hemera.setServerEncoder(encode)
hemera.setServerDecoder(encode)
```
