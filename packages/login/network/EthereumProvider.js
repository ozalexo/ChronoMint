/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import AbstractProvider from './AbstractProvider'
import EthereumEngine from './EthereumEngine'
import selectEthereumNode from './EthereumNode'

export class EthereumProvider extends AbstractProvider {
  constructor () {
    super(...arguments)
    this._nemEngine = null
    this._wavesEngine = null
    this._id = 'Ethereum'
  }

  setEngine (ethEngine: EthereumEngine, nemEngine, wavesEngine) {
    if (this._isInited) {
      this.unsubscribe(this._engine, this._nemEngine)
      this._isInited = false
    }
    this._engine = ethEngine
    this._nemEngine = nemEngine
    this._wavesEngine = wavesEngine
    this.subscribe(this._engine, this._nemEngine, this._wavesEngine)
    this._isInited = true
  }

  subscribe (ethEngine: EthereumEngine, nemEngine, wavesEngine) {
    const node = this._selectNode(ethEngine)

    node.emit('subscribe', {
      ethAddress: ethEngine.getAddress(),
      nemAddress: nemEngine && nemEngine.getAddress(),
      wavesAddress: wavesEngine && wavesEngine.getAddress(),
    })
    return node
  }

  unsubscribe (ethEngine: EthereumEngine, nemEngine, wavesEngine) {
    const node = this._selectNode(ethEngine)
    node.emit('unsubscribe', {
      ethAddress: ethEngine.getAddress(),
      nemAddress: nemEngine && nemEngine.getAddress(),
      wavesAddress: wavesEngine && wavesEngine.getAddress(),
    })
    return node
  }

  subscribeNewWallet (address) {
    const node = this._selectNode(this._engine)
    node.subscribeNewWallet(address)
  }

  getTransactionsList (address, skip, offset) {
    const node = this._selectNode(this._engine)
    return node.getTransactionsList(address, this._id, skip, offset)
  }

  getPrivateKey (address) {
    if (address) {
      let pk = null
      this._engine
        // eslint-disable-next-line no-underscore-dangle
        ? this._engine._engine.wallets.map((wallet) => {
          if (wallet.getAddressString() === address) {
            pk = wallet.privKey
          }
        })
        : null
      return pk
    } else {
      return this._engine ? this._engine.getPrivateKey() : null
    }
  }

  getPublicKey () {
    return this._engine ? this._engine.getPublicKey() : null
  }

  createNewChildAddress (deriveNumber) {
    return this._engine ? this._engine.createNewChildAddress(deriveNumber) : null
  }

  getPlatformList (userAddress: string) {
    const node = this._selectNode(this._engine)
    return node.getPlatformList(userAddress)
  }

  getEventsData (eventName: string, queryFilter: string, mapCallback) {
    const node = this._selectNode(this._engine)
    return node.getEventsData(eventName, queryFilter, mapCallback)
  }

  subscribeOnMiddleware (event, callback) {
    const node = this._selectNode(this._engine)
    node.on(event, callback)
  }

  get2FAEncodedKey (callback) {
    const node = this._selectNode(this._engine)
    return node.get2FAEncodedKey(this._engine, callback)
  }

  confirm2FASecret (account, confirmToken, callback) {
    const node = this._selectNode(this._engine)
    return node.confirm2FASecret(account, confirmToken, callback)
  }

  confirm2FAtx (txAddress, walletAddress, confirmToken, callback) {
    const node = this._selectNode(this._engine)
    return node.confirm2FAtx(txAddress, walletAddress, confirmToken, callback)
  }

  checkConfirm2FAtx (txAddress, callback) {
    const node = this._selectNode(this._engine)
    return node.checkConfirm2FAtx(txAddress, callback)
  }

  getEngine () {
    return this._engine
  }

  async getAccountBalances (address) {
    const node = this._selectNode(this._engine)
    const data = await node.getAddressInfo(address || this._engine.getAddress())
    return {
      balance: data.balance,
      tokens: data.erc20token,
    }
  }
}

export const ethereumProvider = new EthereumProvider(selectEthereumNode)
