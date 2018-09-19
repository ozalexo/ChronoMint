/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import { getMainSymbolForBlockchain } from './selectors'
import { Amount } from '../../models'

// eslint-disable-next-line import/prefer-default-export
export const formatBalances = (blockchain, balancesResult) => {
  const mainSymbol = getMainSymbolForBlockchain(blockchain)
  if (balancesResult && balancesResult.tokens) {
    const tokensBalances = balancesResult.tokens
      .reduce((accumulator, { symbol, balance }) => {
        return {
          ...accumulator,
          [symbol]: new Amount(balance, symbol),
        }
      }, {})

    return {
      [mainSymbol]: new Amount(balancesResult.balance, mainSymbol),
      ...tokensBalances,
    }
  } else {
    return {
      [mainSymbol]: new Amount(balancesResult, mainSymbol),
    }
  }
}
