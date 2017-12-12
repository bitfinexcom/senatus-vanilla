'use strict'

const sigUtil = require('eth-sig-util')
const Senatus = require('./senatus')

class SenatusVanilla extends Senatus {
  _verifySigs (payload, whitelist) {
    let verified = true
    let m = payload.msg
    const sigs = payload.sigs
    for (let i = 0; i < sigs.length; i++) {
      const sig = sigs[i]
      const pubkey = whitelist.get(sig.signer).pubkey
      const msgParams = { data: m }
      msgParams.sig = sig.signedMsg
      if (sigUtil.recoverPersonalSignature(msgParams) !== pubkey) {
        verified = false
        break
      }
      m = sig.signedMsg
    }
    return verified
  }
}

module.exports = SenatusVanilla
