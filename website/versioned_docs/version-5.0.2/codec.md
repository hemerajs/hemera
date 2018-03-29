---
id: version-5.0.2-codec
title: Codec
sidebar_label: Codec
original_id: codec
---

You can define custom payload `Encoder` and `Decoder` to support other formats like [MessagePack](https://msgpack.org/index.html).
This will reset the default `JSON` codec.

```js
function encode(msg) {
  return {
    value: JSON.stringify(msg),
    eror: null
  }
}
function decode(msg) {
  return {
    value: JSON.parse(msg),
    eror: null
  }
}
hemera.setClientEncoder(encode)
hemera.setClientDecoder(decode)

hemera.setServerEncoder(encode)
hemera.setServerDecoder(decode)
```
