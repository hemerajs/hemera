# Hemera-zipkin package

## 1. Run zipkin in docker container

```js
docker run -d -p 9411:9411 openzipkin/zipkin
```
## 2. Visit http://127.0.0.1:9411/

## 3. Run example

```
node examples\zipkin-tracing.js
```
