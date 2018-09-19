/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import BigNumber from 'bignumber.js'
import bitcoin from 'bitcoinjs-lib'
import BitcoinsMiddlewareAPI from '@chronobank/nodes/httpNodes/api/chronobankNodes/bitcoins'
import EventEmitter from 'events'
import Amount from '../models/Amount'
import TokenModel from '../models/tokens/TokenModel'
import { onNewTransferReceived } from '../redux/wallets/thunks'
import TxModel from '../models/TxModel'
import {
  BLOCKCHAIN_BITCOIN,
  BLOCKCHAIN_BITCOIN_CASH,
  BLOCKCHAIN_BITCOIN_GOLD,
  BLOCKCHAIN_LITECOIN,
  EVENT_NEW_TRANSFER,
  EVENT_UPDATE_BALANCE,
  EVENT_UPDATE_LAST_BLOCK,
  EVENT_UPDATE_TRANSACTION,
} from './constants'

const EVENT_TX = 'tx'
const EVENT_TRANSACTION_MAINED = 'transaction'
const EVENT_BALANCE = 'balance'
const EVENT_LAST_BLOCK = 'lastBlock'

export default class BitcoinDAO extends EventEmitter {
  constructor (name, symbol, dispatch) {
    super()
    this.dispatch = dispatch
    this._blockchainName = name
    this._symbol = symbol
    this._decimals = 8
  }

  getBlockchain () {
    return this._blockchainName
  }

  // addressValidator(recipient, true, token.blockchain())
  getAddressValidator () {
    const isAddressValid = (address) => {
      try {
        bitcoin.address.toOutputScript(address, this._blockchainName)
        return true
      } catch (e) {
        return false
      }
    }
    const bitcoinAddress = (address, required = true) => {
      // TODO: @ipavlenko: Provide better validation
      if ((!address && required) || (address && !isAddressValid(address))) {
        return { value: 'errors.invalidAddress', blockchain: this._blockchainName }
      }
      return null
    }
    return bitcoinAddress
  }

  getInitAddress () {
    // BitcoinDAO is not a cntract DAO, bitcoin have no initial address, but it have a token name.
    return `Bitcoin/${this._symbol}`
  }

  isInitialized () {
    return true
    // return this._bitcoinProvider.isInitialized()
  }

  hasBalancesStream () {
    // Balance should not be fetched after transfer notification,
    // it will be updated from the balances event stream
    return true
  }

  getAccountBalances (address) {
    try {
      const balances = this.dispatch(BitcoinsMiddlewareAPI.requestBitcoinBalanceByAddress(this._blockchainName, address))
      return balances
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('BitcoinDAO, getAccountBalances', error)
      return null
      // TODO: need to handle an error correctly
    }
  }

  getAccountBalance (address) {
    return this.getAccountBalances(address)
  }

  transfer (from: string, to: string, amount: BigNumber) {
    return {
      from,
      to,
      value: new BigNumber(amount),
    }
  }

  async getTransfer (id, account, skip, offset): Array<TxModel> {
    const txs = []
    try {
      const txsResult = await this.dispatch(BitcoinsMiddlewareAPI.requestBitcoinTransactionsHistoryByAddress(this._blockchainName, account, skip, offset))
      for (const tx of txsResult) {
        txs.push(new TxModel({
          txHash: tx.txHash,
          blockHash: tx.blockHash,
          blockNumber: tx.blockNumber,
          confirmations: tx.confirmations,
          time: tx.time,
          from: tx.from,
          to: tx.to,
          symbol: this._symbol,
          value: new Amount(tx.value, this._symbol),
          fee: new Amount(tx.fee, this._symbol),
          blockchain: this._blockchainName,
        }))
      }
    } catch (e) {
      // eslint-disable-next-line
      console.warn('BitcoinDAO getTransfer', e)
    }

    return txs
  }

  watch (/*account*/): Promise {
    return Promise.all([
      this.watchTransfer(),
      this.watchBalance(),
      this.watchTransaction(),
    ])
  }

  async watchTransaction () {
    this._bitcoinProvider.addListener(EVENT_TRANSACTION_MAINED, async ({ tx, address, bitcoin, symbol }) => {
      this.emit(
        EVENT_UPDATE_TRANSACTION,
        {
          tx,
          address,
          bitcoin,
          symbol,
        },
      )
    })
  }

  async watchTransfer () {
    this._bitcoinProvider.addListener(EVENT_TX, async ({ tx }) => {
      this.emit(
        EVENT_NEW_TRANSFER,
        new TxModel({
          txHash: tx.txHash,
          // blockHash: tx.blockhash,
          // blockNumber: tx.blockheight,
          blockNumber: null,
          time: tx.time,
          from: tx.from,
          to: tx.to,
          symbol: this._symbol,
          value: new Amount(tx.value, this._symbol),
          fee: new Amount(tx.fee, this._symbol),
          blockchain: this._blockchainName,
        }),
      )
    })
  }

  async watchBalance () {
    this._bitcoinProvider.addListener(EVENT_BALANCE, async ({ account, time, balance }) => {
      this.emit(EVENT_UPDATE_BALANCE, { account, time, balance: balance.balance0 })
    })
  }

  async watchLastBlock () {
    this._bitcoinProvider.addListener(EVENT_LAST_BLOCK, async ({ block }) => {
      this.emit(EVENT_UPDATE_LAST_BLOCK, {
        blockchain: this._blockchainName,
        block: { blockNumber: block },
      })
    })
  }

  async stopWatching () {
    // Ignore
  }

  resetFilterCache () {
    // do nothing
  }

  async fetchToken () {
    if (!this.isInitialized()) {
      const message = `${this._symbol} support is not available`
      // eslint-disable-next-line
      console.warn(message)
      throw new Error(message)
    }

    return new TokenModel({
      name: this._blockchainName,
      decimals: this._decimals,
      symbol: this._symbol,
      isFetched: true,
      blockchain: this._blockchainName,
      feeRate: 200,
    })
  }

  subscribeNewWallet (address) {
    this.dispatch(BitcoinsMiddlewareAPI.requestBitcoinSubscribeWalletByAddress(this._blockchainName, address))
  }
}

export const btcDAO = (dispatch) => new BitcoinDAO(BLOCKCHAIN_BITCOIN, 'BTC', dispatch)
export const bccDAO = (dispatch) => new BitcoinDAO(BLOCKCHAIN_BITCOIN_CASH, 'BCC', dispatch)
export const btgDAO = (dispatch) => new BitcoinDAO(BLOCKCHAIN_BITCOIN_GOLD, 'BTG', dispatch)
export const ltcDAO = (dispatch) => new BitcoinDAO(BLOCKCHAIN_LITECOIN, 'LTC', dispatch)
