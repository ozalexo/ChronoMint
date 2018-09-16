/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import EventEmitter from 'events'
import * as WavesAPI from '@waves/waves-api'

const TEMP_MOCK_SEED = 'clip grief portion ignore display empower turkey noise derive surface wonder tragic pattern stone squeeze'

export default class WavesMemoryDevice extends EventEmitter {
  constructor ({ network }) {
    super()
    this.waves = WavesAPI.create(network)
    this.seed = this.waves.Seed.fromExistingPhrase(TEMP_MOCK_SEED)
    this.network = network
    Object.freeze(this)
  }

  getPublicKey () {
    return this.getKeyPair().publicKey.toString()
  }

  getAddress () {
    return this.seed.address
  }

  async signTransaction (txData) {
    const transferTransaction = new this.waves.Transactions.TransferTransaction(txData)
    const preparedTransaction = await transferTransaction.prepareForAPI(this.getKeyPair().getPrivateKey())
    return preparedTransaction
  }

  getKeyPair () {
    return this.seed.keyPair
  }

  isActionRequestedModalDialogShows () {
    return false
  }
}
