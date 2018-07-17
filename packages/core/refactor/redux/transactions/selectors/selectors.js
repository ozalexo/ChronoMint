/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import { createSelector } from 'reselect'
import { getWalletByAddress } from '../../../../redux/wallet/selectors/balances'
import MainWalletModel from '../../../../models/wallet/MainWalletModel'
import MultisigWalletModel from '../../../../models/wallet/MultisigWalletModel'
import DerivedWalletModel from '../../../../models/wallet/DerivedWalletModel'
import { getMainSymbolForBlockchain } from '../../../../redux/tokens/selectors'
import TxExecModel from '../../../models/TxExecModel'

export const getDataForConfirm = (tx: TxExecModel) => createSelector(
  [
    getWalletByAddress(tx.from),
  ],
  (wallet: MainWalletModel | MultisigWalletModel | DerivedWalletModel) => {
    const mainSymbol = getMainSymbolForBlockchain(tx.blockchain)
    const balances = wallet.balances()
    const amountBalance = balances.item(tx.symbol)
    const feeBalance = balances.item(mainSymbol)
    let amountBalanceAfter = tx.fields.amount.mark === 'plus' ?
      amountBalance.amount().plus(tx.fields.amount.value) :
      amountBalance.amount().minus(tx.fields.amount.value)
    let feeBalanceAfter = null

    if (mainSymbol === tx.symbol) {
      feeBalanceAfter = amountBalanceAfter = amountBalanceAfter.minus(tx.fee.gasFee)
    } else {
      feeBalanceAfter = feeBalance.amount().minus(tx.fee.gasFee)
    }

    return {
      fields: tx.fields,
      mainSymbol,
      amountBalanceAfter,
      feeBalanceAfter,
    }
  },
)