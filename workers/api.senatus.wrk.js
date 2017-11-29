'use strict'

const ed = require('ed25519-supercop')
const Wasteland = require('wasteland')
const GrenacheBackend = require('wasteland/backends/Grenache')
const Link = require('grenache-nodejs-link')
const { WrkApi } = require('bfx-wrk-api')

class WrkSenatusApi extends WrkApi {
  init () {
    super.init()

    this.setInitFacs([
      ['fac', 'senatus', '0', '0', {}, -3]
    ])

    this._initWasteland(this.getApiConf())
  }

  getGrcServices () {
    return [`rest:senatus:${this.senatus_0.getType()}`]
  }

  getPluginCtx (type) {
    const ctx = super.getPluginCtx(type)

    switch (type) {
      case 'api_bfx':
        ctx.wasteland = this._wasteLand
        ctx.whitelistKey = this.getApiConf().whitelistKey
        break
    }

    return ctx
  }

  _initWasteland (opts) {
    const link = new Link({
      grape: opts.grapeLink
    })
    link.start()
    const { publicKey, secretKey } = ed.createKeyPair(ed.createSeed())

    const gb = new GrenacheBackend({
      transport: link,
      keys: { publicKey, secretKey }
    })

    this._wasteLand = new Wasteland({ backend: gb })
  }
}

module.exports = WrkSenatusApi
