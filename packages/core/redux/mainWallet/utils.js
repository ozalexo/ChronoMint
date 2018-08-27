/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

/* eslint-disable import/prefer-default-export */

import TxHistoryModel from '../../models/wallet/TxHistoryModel'
import tokenService from '../../services/TokenService'
import type TxModel from '../../models/TxModel'
import { TXS_PER_PAGE } from '../../models/wallet/TransactionsCollection'
import {
  BCC,
  BLOCKCHAIN_BITCOIN,
  BLOCKCHAIN_BITCOIN_CASH,
  BLOCKCHAIN_BITCOIN_GOLD,
  BLOCKCHAIN_ETHEREUM,
  BLOCKCHAIN_LITECOIN,
  BLOCKCHAIN_NEM,
  BLOCKCHAIN_WAVES,
  BTC,
  BTG,
  ETH,
  LTC,
  WAVES,
  XEM,
} from '../../dao/constants'

export const getTxList = async ({ wallet, forcedOffset, tokens }) => {

  const transactions: TxHistoryModel = new TxHistoryModel({ ...wallet.transactions })
  const offset = forcedOffset ? 0 : (transactions.transactions.length || 0)
  const newOffset = offset + TXS_PER_PAGE

  let txList = []
  let dao

  switch (wallet.blockchain) {
    case BLOCKCHAIN_ETHEREUM:
      dao = tokenService.getDAO(ETH)
      break
    case BLOCKCHAIN_BITCOIN:
      dao = tokenService.getDAO(BTC)
      break
    case BLOCKCHAIN_BITCOIN_CASH:
      dao = tokenService.getDAO(BCC)
      break
    case BLOCKCHAIN_BITCOIN_GOLD:
      dao = tokenService.getDAO(BTG)
      break
    case BLOCKCHAIN_LITECOIN:
      dao = tokenService.getDAO(LTC)
      break
    case BLOCKCHAIN_NEM:
      dao = tokenService.getDAO(XEM)
      break
    case BLOCKCHAIN_WAVES:
      dao = tokenService.getDAO(WAVES)
      break
  }

  const blocks = transactions.blocks
  let endOfList = false
  if (dao) {
    txList = await dao.getTransfer(wallet.address, wallet.address, offset, TXS_PER_PAGE, tokens)

    txList.sort((a, b) => b.get('time') - a.get('time'))

    for (const tx: TxModel of txList) {
      if (!blocks[tx.blockNumber()]) {
        blocks[tx.blockNumber()] = { transactions: [] }
      }
      blocks[tx.blockNumber()].transactions.push(tx)
    }

    if (transactions.transactions.length < newOffset) {
      endOfList = true
    }
  }

  return new TxHistoryModel({ ...transactions, blocks, endOfList })
}