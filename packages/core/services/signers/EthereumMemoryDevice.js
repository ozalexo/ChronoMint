/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import EventEmitter from 'events'
import hdKey from 'ethereumjs-wallet/hdkey'
import Accounts from 'web3-eth-accounts'

const DEFAULT_PATH = `m/44'/60'/0'/0/0`

export default class EthereumMemoryDevice extends EventEmitter {
  constructor (privateKey) {
    super()
    const accounts = new Accounts()
    const wallet = accounts.wallet.create()
    // console.log(privateKey)
    const account = accounts.privateKeyToAccount(privateKey)
    // console.log(account)
    wallet.add(account)
    this.wallet = wallet[0]
    Object.freeze(this)
  }

  get address () {
    return this.wallet.address
  }

  getPrivateKey (path) {
    if (!path || path === DEFAULT_PATH) {
      return this.wallet.privateKey
    }

    return EthereumMemoryDevice.getDerivedWallet(this.wallet.privateKey, path).address
  }

  // this method is a part of base interface
  getAddress (path) {
    if (!path || path === DEFAULT_PATH) {
      return this.address
    }

    return EthereumMemoryDevice.getDerivedWallet(this.wallet.privateKey, path).address
  }

  async signTransaction (tx, path) {
    // tx object
    if (!path || path === DEFAULT_PATH) {
      return this.wallet.signTransaction(tx)
    }

    return EthereumMemoryDevice.getDerivedWallet(this.wallet.privateKey, path).signTransaction(tx)
  }

  async signData (data, path) {
    // data object
    if (!path || path === DEFAULT_PATH) {
      return this.wallet.sign(data)
    }

    return EthereumMemoryDevice.getDerivedWallet(this.wallet.privateKey, path).sign(data)
  }

  static create ({ privateKey, mnemonic, password }) {
    let wallet
    if (privateKey) {
      const accounts = new Accounts()
      wallet = accounts.wallet.create()
      const account = accounts.privateKeyToAccount(`0x${privateKey}`)
      wallet.add(account)
      wallet = wallet[0]
    }
    if (mnemonic) {
      wallet = EthereumMemoryDevice.getDerivedWallet(mnemonic, null)
    }
    return { wallet: wallet.encrypt(password), path: DEFAULT_PATH, type: 'memory', address: wallet.address }
  }

  // Should be synchronous by design
  static decrypt ({ entry, password }) {
    const accounts = new Accounts()
    const wallet = accounts.wallet.decrypt([entry], password)
    const privateKey = wallet[0].privateKey

    return privateKey
  }

  static getDerivedWallet (seed, path) {
    const walletPath = !path
      ? DEFAULT_PATH
      : path
    const accounts = new Accounts()
    const wallet = accounts.wallet.create()
    const hdWallet = hdKey.fromMasterSeed(seed)
    const w = hdWallet.derivePath(walletPath).getWallet()
    const account = accounts.privateKeyToAccount(`0x${w.getPrivateKey().toString('hex')}`)
    wallet.add(account)

    return wallet[0]
  }
}
