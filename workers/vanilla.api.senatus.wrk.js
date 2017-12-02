'use strict'

const WrkSenatusApi = require('./api.senatus.wrk')

class WrkSenatusApiVanilla extends WrkSenatusApi {
  constructor (conf, ctx) {
    super(conf, ctx)

    this.loadConf('vanilla.senatus', 'senatus')

    this.init()
    this.start()
  }

  getApiConf () {
    return {
      path: 'vanilla.senatus'
    }
  }
}

module.exports = WrkSenatusApiVanilla
