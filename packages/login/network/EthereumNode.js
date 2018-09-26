/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import axios from 'axios'
import { NETWORK_MAIN_ID } from './settings'
import EthereumMiddlewareNode from './EthereumMiddlewareNode'

// TODO @dkchv: update to actual config
const ETHEREUM_TESTNET_NODE = new EthereumMiddlewareNode({
  api: axios.create({
    baseURL: 'https://middleware-ethereum-testnet-rest.chronobank.io',
    timeout: 10000,
  }),
  twoFA: axios.create({
    baseURL: 'https://middleware-ethereum-testnet-rest.chronobank.io/2fa',
    timeout: 10000,
  }),
  socket: {
    baseURL: 'https://rabbitmq-webstomp.chronobank.io/stomp',
    user: 'rabbitmq_user',
    password: '38309100024',
    channels: {
      balance: '/exchange/events/rinkeby-ethereum-middleware-chronobank-io_balance',
      events: '/exchange/events/rinkeby-ethereum-middleware-chronobank-io_chrono_sc',
    },
  },
  trace: true,
})

/**
 *
 * @param network object from SessionThunks.getProviderSettings()
 * @returns {EthereumMiddlewareNode}
 */
export default function selectEthereumNode (network) {
  if (!network) {
    console.error('Network is empty: ', network)
  }

  return (network.id === NETWORK_MAIN_ID) ? ETHEREUM_MAINNET_NODE : ETHEREUM_TESTNET_NODE
}

const ETHEREUM_MAINNET_NODE = new EthereumMiddlewareNode({
  api: axios.create({
    baseURL: 'https://middleware-ethereum-mainnet-rest.chronobank.io',
    timeout: 10000,
  }),
  twoFA: axios.create({
    baseURL: 'https://middleware-ethereum-mainnet-rest.chronobank.io/2fa',
    timeout: 10000,
  }),
  socket: {
    baseURL: 'https://rabbitmq-webstomp.chronobank.io/stomp',
    user: 'rabbitmq_user',
    password: '38309100024',
    channels: {
      balance: '/exchange/events/mainnet-ethereum-middleware-chronobank-io_balance',
      events: '/exchange/events/mainnet-ethereum-parity-middleware-chronobank-io_chrono_sc',
    },
  },
  trace: true,
})
