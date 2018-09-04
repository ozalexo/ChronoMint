/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import axios from 'axios'
import { BLOCKCHAIN_BITCOIN, BLOCKCHAIN_LITECOIN } from '../../dao/constants'

const HTTP_TIMEOUT = 4000

const BTC_MAINNET_NODE = axios.create({ baseURL: 'https://middleware-bitcoin-mainnet-rest.chronobank.io', timeout: HTTP_TIMEOUT })
const BTC_TESTNET_NODE = axios.create({ baseURL: 'https://middleware-bitcoin-testnet-rest.chronobank.io', timeout: HTTP_TIMEOUT })
const LTC_MAINNET_NODE = axios.create({ baseURL: 'https://middleware-litecoin-mainnet-rest.chronobank.io', timeout: HTTP_TIMEOUT })
const LTC_TESTNET_NODE = axios.create({ baseURL: 'https://middleware-litecoin-testnet-rest.chronobank.io', timeout: HTTP_TIMEOUT })

const URL_BLOCKS_HEIGHT = 'blocks/height'
const URL_TX = 'tx'
const URL_HISTORY = (address, skip, offset) => `tx/${address}/history?skip=${skip}&limit=${offset}`
const URL_ADDRESS_INFO = (address) => `addr/${address}/balance`
const URL_GET_UTXOS = (address) => `addr/${address}/utxo`
const URL_SEND = 'tx/send'

export default class BitcoinMiddlewareService {
  static service = {
    [BLOCKCHAIN_BITCOIN]: {
      bitcoin: BTC_MAINNET_NODE,
      testnet: BTC_TESTNET_NODE,
    },
    [BLOCKCHAIN_LITECOIN]: {
      litecoin: LTC_MAINNET_NODE,
      litecoin_testnet: LTC_TESTNET_NODE,
    },
  }

  /*
   * @private
   */
  static genErrorMessage (blockchain, type, requestName) {
    return new Error(`Can't perform HTTP(s) request '${requestName}'. Node for ${blockchain}/${type} not found in config.`)
  }

  /*
   * @private
   */
  static getCurrentNode (blockchain, type) {
    return BitcoinMiddlewareService.service[blockchain] && BitcoinMiddlewareService.service[blockchain][type] || null
  }

  static requestBitcoinCurrentBlockHeight (blockchain, networkType) {
    const currentNode = BitcoinMiddlewareService.getCurrentNode(blockchain, networkType)
    if (!currentNode) {
      const error = BitcoinMiddlewareService.genErrorMessage(blockchain, networkType, `GET: ${URL_BLOCKS_HEIGHT}`)
      return Promise.reject(error)
    }

    return currentNode.request({
      method: 'GET',
      url: URL_BLOCKS_HEIGHT,
    })
  }

  static requestBitcoinTransactionInfo (txid, blockchain, networkType) {
    const currentNode = BitcoinMiddlewareService.getCurrentNode(blockchain, networkType)
    if (!currentNode) {
      const error = BitcoinMiddlewareService.genErrorMessage(blockchain, networkType, `GET: ${URL_TX}/${txid}`)
      return Promise.reject(error)
    }

    return currentNode.request({
      method: 'GET',
      url: `${URL_TX}/${txid}`,
    })
  }

  static requestBitcoinTransactionsList (address, id, skip, offset, blockchain, networkType) {
    const currentNode = BitcoinMiddlewareService.getCurrentNode(blockchain, networkType)
    if (!currentNode) {
      const error = BitcoinMiddlewareService.genErrorMessage(blockchain, networkType, `GET: ${URL_HISTORY(address, skip, offset)}`)
      return Promise.reject(error)
    }

    return currentNode.request({
      method: 'GET',
      url: URL_HISTORY(address, skip, offset),
    })
  }

  static requestBitcoinAddressInfo (address, blockchain, networkType) {
    const currentNode = BitcoinMiddlewareService.getCurrentNode(blockchain, networkType)
    if (!currentNode) {
      const error = BitcoinMiddlewareService.genErrorMessage(blockchain, networkType, `GET: ${URL_ADDRESS_INFO(address)}`)
      return Promise.reject(error)
    }

    return currentNode.request({
      method: 'GET',
      url: URL_ADDRESS_INFO(address),
    })
  }

  static requestBitcoinAddressUTXOS (address, blockchain, networkType) {
    const currentNode = BitcoinMiddlewareService.getCurrentNode(blockchain, networkType)
    if (!currentNode) {
      const error = BitcoinMiddlewareService.genErrorMessage(blockchain, networkType, `GET: ${URL_GET_UTXOS(address)}`)
      return Promise.reject(error)
    }

    return currentNode.request({
      method: 'GET',
      url: URL_GET_UTXOS(address),
    })
  }

  static requestBitcoinSendTx (rawtx, blockchain, networkType) {
    const currentNode = BitcoinMiddlewareService.getCurrentNode(blockchain, networkType)
    if (!currentNode) {
      const error = BitcoinMiddlewareService.genErrorMessage(blockchain, networkType, `POST: ${URL_SEND}`)
      return Promise.reject(error)
    }
    const params = new URLSearchParams()
    params.append('tx', rawtx)

    return currentNode.request({
      method: 'POST',
      url: URL_SEND,
      data: params,
    })
  }
}
