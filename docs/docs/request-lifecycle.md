# Request lifecycle

```
(Add) onServerPreRequest "Find pattern"
                      ----> onServerPreHandler "Run middleware and call callback"
                                            ----> onServerPreResponse "Build message and send"
(Act) onClientPreRequest "Set Context"
                      ----> onClientPostRequest "Before callback is called"
```

- onClientPreRequest
- onClientPostRequest

`Client-Extensions` must be continued with `next` handler but the cycle of specific `Server-Extensions`

- onServerPreRequest
- onServerPreHandler
- onServerPreResponse

can be aborted with `res.end(value or Error)`. If you only want to set the payload you can use `res.send(value or Error)` but other extensions from the same type will be called.
