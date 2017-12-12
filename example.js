const Grenache = require('grenache-nodejs-http')
const Link = require('grenache-nodejs-link')

const Peer = Grenache.PeerRPCClient

const link = new Link({
  grape: 'http://127.0.0.1:30001'
})
link.start()

const peer = new Peer(link, {})
peer.init()

const getWhitelistQuery = {
  action: 'getWhitelist',
  'args': []
}

peer.request('rest:senatus:vanilla', getWhitelistQuery, { timeout: 10000 }, (err, res) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }

  console.log('getWhitelist response:')
  console.log(res)
  console.log('---')
})

const addSigQuery = {
  action: 'addSig',
  'args': [
    {
      msg: 'raw transaction data comes here',
      signers: ['alice', 'bob', 'carol'],
      sigs: [],
      sigsRequired: 2
    },
    {
      signer: 'alice',
      signedMsg: '0xe4f58a110a560e77632c04a20827fff9afc45c397f37316a89943d9925c70b702ee79ef9b42fffa2de0ace994169576952a8fe38e78210cd30cd7a13ba865cdc1c'
    }
  ]
}

peer.request('rest:senatus:vanilla', addSigQuery, { timeout: 10000 }, (err, res) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }

  console.log('addSig response:')
  console.log(res)
  console.log('---')
  const payloadHash = res

  const getPayloadQuery = {
    action: 'getPayload',
    'args': [payloadHash]
  }

  peer.request('rest:senatus:vanilla', getPayloadQuery, { timeout: 10000 }, (err, res) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }

    console.log('getPayload response:')
    console.log(res)
    console.log('---')
  })
})
