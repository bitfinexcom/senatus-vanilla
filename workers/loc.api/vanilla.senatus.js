'use strict'

const ethUtil = require('ethereumjs-util')
const sigUtil = require('eth-sig-util')
const Senatus = require('./senatus')

class SenatusVanilla extends Senatus {
  _verifySigs (payload, sig, whitelist) {
    const msg = ethUtil.bufferToHex(Buffer.from(JSON.stringify(payload), 'utf8'))
    const recovered = sigUtil.recoverPersonalSignature({
      data: msg,
      sig: sig.signedMsg
    })
    const pubkey = whitelist.get(sig.signer).pubkey
    return recovered.toUpperCase() === pubkey.toUpperCase()
  }
}

module.exports = SenatusVanilla
