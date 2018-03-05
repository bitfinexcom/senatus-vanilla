'use strict'

const _ = require('lodash')
const async = require('async')
const uuid = require('uuid')
const sendmail = require('sendmail')()

const { Api } = require('bfx-wrk-api')

class Senatus extends Api {
  _space (service, msg) {
    return super._space(service, msg)
  }

  getWhitelist (space, cb) {
    // const wasteland = this.ctx.wasteland
    // const whitelistKey = this.ctx.whitelistKey
    // wasteland.get(whitelistKey, {}, function (err, res) {
    //   if (err) return cb(err)
    //   return cb(null, res)
    // })
    return cb(null, [
      {
        username: 'alice',
        email: 'fyang1024@gmail.com',
        pubkey: '0x3398dB97a2d2D428537F747D9814587D23C832a6'
      },
      {
        username: 'bob',
        email: 'fyang1024@gmail.com',
        pubkey: '0x3398dB97a2d2D428537F747D9814587D23C832a6'
      },
      {
        username: 'carol',
        email: 'fyang1024@gmail.com',
        pubkey: '0x3398dB97a2d2D428537F747D9814587D23C832a6'
      }
    ])
  }

  getPayload (space, hash, cb) {
    if (!cb) {
      cb = hash
      return cb(new Error('ERROR_PROVIDE_HASH'))
    }
    const wasteland = this.ctx.wasteland
    wasteland.get(hash, {}, function (err, res) {
      if (err) return cb(err)
      cb(null, res)
    })
  }

  addSig (space, payload, sig, cb) {
    if (!cb || !sig) {
      cb = sig || payload
      return cb(new Error('ERROR_PROVIDE_PAYLOAD_SIG'))
    }
    const validate = this._validate
    const verifySigs = this._verifySigs
    const notify = this._notify
    const wasteland = this.ctx.wasteland
    const getPayloadHashes = this._getPayloadHashes
    const setPayloadHashes = this._setPayloadHashes
    const grc = this.ctx.grc_bfx
    this.getWhitelist(space, function (err, res) {
      if (err) return cb(err)
      const whitelist = new Map()
      res.forEach(function (user) {
        whitelist.set(user.username, user)
      })

      if (!verifySigs(payload, sig, whitelist)) return cb(new Error('Signatures are not matched'))

      if (!payload.uuid) {
        payload.uuid = uuid.v4()
      }
      if (!payload.sigs) {
        payload.sigs = []
      }

      sig.timestamp = Date.now()
      payload.sigs.push(sig)
      const errors = validate(payload, whitelist)
      if (errors.length) return cb(new Error(errors))
      if (payload.sigs.length === payload.sigsRequired) {
        payload.completed = true
      }

      const opts = {seq: payload.sigs.length, salt: payload.uuid}
      wasteland.put(payload, opts, function (err, res) {
        if (err) return cb(err)
        async.each(payload.signers, function (signer) {
          getPayloadHashes(grc, signer, function (err, hashes) {
            if (err) return cb(err)
            if (!hashes) hashes = []
            if (!_.includes(hashes, res)) {
              hashes.push(res)
              setPayloadHashes(grc, signer, hashes, function (err, res) {
                if (err) return cb(err)
              })
            }
          })
        })
        notify(payload, res, whitelist)
        cb(null, res)
      })
    })
  }

  getPayloads (space, opts, cb) {
    if (!cb) {
      cb = opts
      return cb(new Error('ERROR_PROVIDE_OPTS'))
    }
    const wasteland = this.ctx.wasteland
    this.ctx.grc_bfx.req(
      'rest:db:kv',
      'get',
      [opts.signer],
      {},
      function (err, hashes) {
        if (err) return cb(err)
        async.map(hashes, function (hash) {
          wasteland.get(hash, {}, function (err, res) {
            if (err) return cb(err)
            cb(null, res)
          })
        }, function (err, payloads) {
          if (err) return cb(err)
          const filteredPayloads = _.filter(payloads, {completed: opts.completed})
          cb(null, filteredPayloads)
        })
      }
    )
  }

  _getPayloadHashes (grc, signer, cb) {
    grc.req(
      'rest:db:kv',
      'get',
      [signer],
      {},
      cb
    )
  }

  _setPayloadHashes (grc, signer, hashes, cb) {
    console.log(signer, hashes)
    grc.req(
      'rest:db:kv',
      'set',
      [signer, hashes],
      {},
      cb
    )
  }

  _validate (payload, whitelist) {
    const errors = []

    if (!payload.msg) {
      errors.push('Message required')
    }

    if (!payload.signers || !Array.isArray(payload.signers)) {
      errors.push('Signer array not specified')
    } else if (payload.signers.length === 0) {
      errors.push('At least one signer required')
    } else {
      payload.signers.forEach(function (signer) {
        if (!whitelist.get(signer)) {
          errors.push(signer + ' not found in the whitelist')
        }
      })
    }

    if (!payload.sigsRequired || !Number.isInteger(payload.sigsRequired)) {
      errors.push('sigsRequired not specified')
    } else if (payload.sigsRequired > payload.signers.length) {
      errors.push('sigsRequired cannot exceed number of signers')
    }

    if (!Array.isArray(payload.sigs)) {
      errors.push('signatures should be an array')
    } else if (Array.isArray(payload.signers)) {
      const signers = _.map(payload.sigs, 'signer')
      if (_.uniq(signers).length < signers.length) {
        errors.push('duplicates found in sigs')
      }
      payload.sigs.forEach(function (sig) {
        if (!_.includes(payload.signers, sig.signer)) {
          errors.push(sig.signer + ' not in signer list')
        }
      })
    }

    return errors
  }

  _verifySigs (payload, sig, whitelist) {
    return false
  }

  _notify (payload, hash, whitelist) {
    if (payload.completed) {
      payload.signers.forEach(function (signer) {
        const user = whitelist.get(signer)
        sendmail({
          from: 'fei@bitfinex.com',
          to: user.email,
          subject: hash + ' has been signed',
          text: 'The following has been signed\n\n' + JSON.stringify(payload)
        }, function (err, reply) {
          console.log(err && err.stack)
          console.dir(reply)
        })
      })
    } else {
      payload.signers.forEach(function (signer) {
        if (!_.includes(payload.sigs, {signer: signer})) {
          const user = whitelist.get(signer)
          sendmail({
            from: 'fei@bitfinex.com',
            to: user.email,
            subject: hash + ' requires your signature',
            text: 'Your signature is required for ' + hash
          }, function (err, reply) {
            console.log(err && err.stack)
            console.dir(reply)
          })
        }
      })
    }
  }
}

module.exports = Senatus
