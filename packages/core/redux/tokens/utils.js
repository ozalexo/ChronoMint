/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */
import { bccProvider, btcProvider, btgProvider, ltcProvider } from '@chronobank/login/network/BitcoinProvider'
import { ethereumProvider } from '@chronobank/login/network/EthereumProvider'
import { wavesProvider } from '@chronobank/login/network/WavesProvider'
import { getMainSymbolForBlockchain } from './selectors'
import { Amount } from '../../models'
import {
  BLOCKCHAIN_BITCOIN,
  BLOCKCHAIN_BITCOIN_CASH,
  BLOCKCHAIN_BITCOIN_GOLD,
  BLOCKCHAIN_ETHEREUM,
  BLOCKCHAIN_LITECOIN,
  BLOCKCHAIN_WAVES,
} from '../../dao/constants'

export const getWalletBalances = ({ wallet }) => {
  const providersMap = {
    [BLOCKCHAIN_ETHEREUM]: ethereumProvider,
    [BLOCKCHAIN_BITCOIN]: btcProvider,
    [BLOCKCHAIN_BITCOIN_CASH]: bccProvider,
    [BLOCKCHAIN_BITCOIN_GOLD]: btgProvider,
    [BLOCKCHAIN_LITECOIN]: ltcProvider,
    [BLOCKCHAIN_WAVES]: wavesProvider,
  }
  return providersMap[wallet.blockchain].getAccountBalances(wallet.address)
}

export const formatBalances = ({ balancesResult, blockchain }) => {
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
