/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */
import { omit } from 'lodash'

import {
  NONCE_UPDATE,
  TX_CREATE,
  TX_REMOVE,
  TX_UPDATE,
} from './constants'

import {
  BLOCKCHAIN_ETHEREUM,
  BLOCKCHAIN_LABOR_HOUR,
} from '../../dao/constants'

const initialSubState = {
  nonces: {},
  pending: {},
}

const initialState = () => ({
  [BLOCKCHAIN_ETHEREUM]: {
    ...initialSubState,
  },
  [BLOCKCHAIN_LABOR_HOUR]: {
    ...initialSubState,
  },
})

const mutations = {
  [NONCE_UPDATE]: (state, { address, blockchain, nonce }) => {
    const blockchainScope = state[blockchain]
    const nonces = blockchainScope.nonces

    return ({
      ...state,
      [blockchain]: {
        ...blockchainScope,
        nonces: {
          ...nonces,
          [address]: nonce,
        },
      },
    })
  },

  [TX_CREATE]: (state, { blockchain, entry }) => {
    const address = entry.tx.from
    const blockchainScope = state[blockchain]
    const pending = blockchainScope.pending
    const scope = pending[address]

    return {
      ...state,
      [blockchain]: {
        ...blockchainScope,
        pending: {
          ...pending,
          [address]: {
            ...scope,
            [entry.key]: entry,
          },
        },
      },
    }
  },
  [TX_REMOVE]: (state, { address, blockchain, key }) => {
    const blockchainScope = state[blockchain]
    const pending = blockchainScope.pending
    const scope = pending[address]

    if (!scope) return state
    const entry = scope[key]
    if (!entry) return state

    return {
      ...state,
      [blockchain]: {
        ...blockchainScope,
        pending: omit(pending, [key]),
      },
    }
  },
  [TX_UPDATE]: (state, { address, blockchain, key, tx }) => {
    const blockchainScope = state[blockchain]
    const pending = blockchainScope.pending
    const scope = pending[address]

    return {
      ...state,
      [blockchain]: {
        ...blockchainScope,
        pending: {
          [address]: {
            ...scope,
            [key]: tx,
          },
        },
      },
    }
  },
}

export default (state = initialState(), { type, ...payload }) => {
  return (type in mutations)
    ? mutations[type](state, payload)
    : state
}
