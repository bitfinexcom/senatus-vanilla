# senatus

The project inherits code from a base repository.

The base / root project is: https://github.com/bitfinexcom/bfx-svc-js

Setup steps:

1. Add base as upstream: `git remote add upstream https://github.com:bitfinexcom/bfx-svc-js.git`

Changes should go through the base project and merged from upstream, if applicable.

Run two Grapes:

```
grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002'
grape --dp 20002 --aph 30002 --bn '127.0.0.1:20001'
```

### Boot worker

```
node worker.js --env=development --wtype=wrk-senatus-api-vanilla --apiPort 8721
```

## Grenache API

### action: 'getWhitelist'

**Response:**

  - &lt;Array&gt; whitelist is returned or an error is thrown   

### action: 'addSig'

  - `args`: &lt;Array&gt;
    - `0`: &lt;Object&gt; payload
    - `1`: &lt;Object&gt; sig

**Response:**

  - &lt;string&gt; hash
  
### action: 'getPayload'

  - `args`: &lt;Array&gt;
    - `0`: &lt;String&gt; hash

**Response:**

  - &lt;Object&gt; payload

#### Example

```
  const query = {
    action: 'getWhitelist',
    'args': []
  }

  peer.request('rest:senatus:vanilla', query, { timeout: 10000 }, (err, res) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }

    console.log(res)
  })
```