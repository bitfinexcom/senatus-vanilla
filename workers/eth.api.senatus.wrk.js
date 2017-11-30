'use strict'

const WrkSenatusApi = require('./api.senatus.wrk')

class WrkSenatusApiEtp extends WrkSenatusApi {

  constructor (conf, ctx) {
    super(conf, ctx)

    this.loadConf('eth.senatus', 'senatus')

    this.init()
    this.start()
  }

  getApiConf () {
    return {
      path: 'eth.senatus'
    }
  }

}

module.exports = WrkCoinApiEtp