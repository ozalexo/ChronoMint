/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import {
  BLOCKCHAIN_BITCOIN_CASH,
  BLOCKCHAIN_BITCOIN_GOLD,
  BLOCKCHAIN_BITCOIN,
  BLOCKCHAIN_ETHEREUM,
  BLOCKCHAIN_LITECOIN,
  BLOCKCHAIN_NEM,
  BLOCKCHAIN_WAVES,
  COIN_TYPE_BTC_MAINNET,
  COIN_TYPE_BTC_TESTNET,
  COIN_TYPE_LTC_MAINNET,
  COIN_TYPE_LTC_TESTNET,
  WALLET_HD_PATH,
} from '@chronobank/core/dao/constants'
import bitcoin from 'bitcoinjs-lib'
import * as BitcoinMiddlewaresAPI from '@chronobank/nodes/httpNodes/api/chronobankNodes/bitcoins'
import * as NemMiddlewaresAPI from '@chronobank/nodes/httpNodes/api/chronobankNodes/nem'
import * as WavesMiddlewaresAPI from '@chronobank/nodes/httpNodes/api/chronobankNodes/waves'
import * as EthMiddlewaresAPI from '@chronobank/nodes/httpNodes/api/chronobankNodes/erc20'
import WalletModel from '../../models/wallet/WalletModel'
import { subscribeOnTokens } from '../tokens/thunks'
import { formatBalances } from '../tokens/utils'
import TokenModel from '../../models/tokens/TokenModel'
import EthereumMemoryDevice  from '../../services/signers/EthereumMemoryDevice'
import tokenService from '../../services/TokenService'
import Amount from '../../models/Amount'
import { getAccount } from '../session/selectors'
import { updateEthMultisigWalletBalance } from '../multisigWallet/actions'
import ethereumDAO from '../../dao/EthereumDAO'
import { getMainEthWallet, getWallets } from './selectors/models'
import { notifyError } from '../notifier/actions'
import { DUCK_SESSION } from '../session/constants'
import { AllowanceCollection } from '../../models'
import { executeTransaction } from '../ethereum/thunks'
import { executeWavesTransaction } from '../waves/thunks'
import * as BitcoinThunks from '../bitcoin/thunks'
import { executeNemTransaction } from '../nem/thunks'
import { getPersistAccount, getEthereumSigner } from '../persistAccount/selectors'
import { getBitcoinCashSigner, getBitcoinSigner, getLitecoinSigner } from '../bitcoin/selectors'
import { getNemSigner } from '../nem/selectors'
import { getWavesSigner } from '../waves/selectors'
import { isOwner } from './utils'
import * as WalletsActions from './actions'

export const initWallets = () => (dispatch) => {
  dispatch(initWalletsFromKeys())
  dispatch(initDerivedWallets())
}

const initWalletsFromKeys = () => async (dispatch, getState) => {
  const state = getState()
  const account = getPersistAccount(state)
  const wallets = []

  const ethereumSigner = getEthereumSigner(state)
  const ethAddress = await ethereumSigner.getAddress()

  wallets.push(new WalletModel({
    address: ethAddress,
    blockchain: BLOCKCHAIN_ETHEREUM,
    isMain: true,
    walletDerivedPath: account.decryptedWallet.entry.encrypted[0].path,
  }))

  const bitcoinSigner = getBitcoinSigner(state)
  if (bitcoinSigner) {
    wallets.push(new WalletModel({
      address: bitcoinSigner.getAddress(),
      blockchain: BLOCKCHAIN_BITCOIN,
      isMain: true,
      walletDerivedPath: account.decryptedWallet.entry.encrypted[0].path,
    }))
  }

  const bitcoinCashSigner = getBitcoinCashSigner(state)
  if (bitcoinCashSigner) {
    wallets.push(new WalletModel({
      address: bitcoinCashSigner.getAddress(),
      blockchain: BLOCKCHAIN_BITCOIN_CASH,
      isMain: true,
      walletDerivedPath: account.decryptedWallet.entry.encrypted[0].path,
    }))
  }

  const litecoinSigner = getLitecoinSigner(state)
  if (litecoinSigner) {
    wallets.push(new WalletModel({
      address: litecoinSigner.getAddress(),
      blockchain: BLOCKCHAIN_LITECOIN,
      isMain: true,
      walletDerivedPath: account.decryptedWallet.entry.encrypted[0].path,
    }))
  }

  const nemSigner = getNemSigner(state)
  if (nemSigner) {
    wallets.push(new WalletModel({
      address: nemSigner.getAddress(),
      blockchain: BLOCKCHAIN_NEM,
      isMain: true,
      walletDerivedPath: account.decryptedWallet.entry.encrypted[0].path,
    }))
  }

  const wavesSigner = getWavesSigner(state)
  if (wavesSigner) {
    wallets.push(new WalletModel({
      address: wavesSigner.getAddress(),
      blockchain: BLOCKCHAIN_WAVES,
      isMain: true,
      walletDerivedPath: account.decryptedWallet.entry.encrypted[0].path,
    }))
  }

  wallets.forEach((wallet) => {
    dispatch(WalletsActions.setWallet(wallet))
    dispatch(updateWalletBalance({ wallet }))
  })
}

const initDerivedWallets = () => async (dispatch, getState) => {
  const state = getState()
  const account = getAccount(state)
  const wallets = getWallets(state)
  // const privateKey = account.decryptedWallet.privateKey

  Object.values(wallets)
    .forEach((wallet: WalletModel) => {
      if (wallet.isDerived && !wallet.isMain && isOwner(wallet, account)) {
        // const deriveNumber = wallet.deriveNumber
        // const address = wallet.address
        // const blockchain = wallet.blockchain
        // const coinType = NodesSelector.selectCoinType(blockchain)
        // const bcNetworkId = NodesSelector.selectBlockchainNetworkId(blockchain)

        dispatch(updateWalletBalance({ wallet }))
        // const derivedWallet = WalletUtils.createNewChildAddress(deriveNumber, blockchain, coinType, bcNetworkId, privateKey)

        const blockchain = wallet.blockchain
        const address = wallet.address
        switch (wallet.blockchain) {
          case BLOCKCHAIN_BITCOIN:
          case BLOCKCHAIN_BITCOIN_CASH:
          case BLOCKCHAIN_BITCOIN_GOLD:
          case BLOCKCHAIN_LITECOIN:
            dispatch(BitcoinMiddlewaresAPI.requestBitcoinSubscribeWalletByAddress(blockchain, address))
            break
          case BLOCKCHAIN_ETHEREUM:
            break
          default:
        }
      }
    })
}

const fallbackCallback = (wallet) => (dispatch) => {
  const updateBalance = (token: TokenModel) => async () => {
    if (token.blockchain() === wallet.blockchain) {
      const balance = await dispatch(NemMiddlewaresAPI.requestNemBalanceByAddress(wallet.address))
      if (balance) {
        dispatch(WalletsActions.setWalletBalance(wallet.id, new Amount(balance, token.symbol(), true)))
      }
    }
  }
  dispatch(subscribeOnTokens(updateBalance))
}

const updateWalletBalance = ({ wallet }) => async (dispatch) => {
  const blockchain = wallet.blockchain
  const address = wallet.address

  if (blockchain === BLOCKCHAIN_NEM) {
    return dispatch(fallbackCallback(wallet))
  }

  const isBtcLikeBlockchain = blockchain === BLOCKCHAIN_BITCOIN
    || blockchain === BLOCKCHAIN_LITECOIN
    || blockchain === BLOCKCHAIN_BITCOIN_CASH
    || blockchain === BLOCKCHAIN_BITCOIN_GOLD

  if (isBtcLikeBlockchain) {
    return dispatch(BitcoinMiddlewaresAPI.requestBitcoinBalanceByAddress(blockchain, address))
      .then((balancesResult) => {
        const formattedBalances = formatBalances(blockchain, balancesResult)
        const newWallet = new WalletModel({
          ...wallet,
          balances: {
            ...wallet.balances,
            ...formattedBalances,
          },
        })
        dispatch(WalletsActions.setWallet(newWallet))
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.log('call balances from middleware is failed', e)
        dispatch(fallbackCallback(wallet))
      })
  } else {
    const { address, blockchain } = wallet
    let balanceRequest = null
    switch (blockchain) {
      case BLOCKCHAIN_WAVES: {
        balanceRequest = WavesMiddlewaresAPI.requestWavesBalanceByAddress
        break
      }
      case BLOCKCHAIN_ETHEREUM: {
        balanceRequest = EthMiddlewaresAPI.requestNemBalanceByAddress
        break
      }
    }
    dispatch(balanceRequest(address))
      .then((balancesResult) => {
        try {
          dispatch(WalletsActions.setWallet(new WalletModel({
            ...wallet,
            balances: {
              ...wallet.balances,
              ...formatBalances(blockchain, balancesResult),
            },
          })))
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log(e.message)
        }
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.log('call balances from middleware is failed', e)
        dispatch(fallbackCallback(wallet))
      })
  }
}

export const subscribeWallet = ({ wallet }) => async (dispatch) => {
  const listener = function (data) {
    const checkedFrom = data.from ? data.from.toLowerCase() === wallet.address.toLowerCase() : false
    const checkedTo = data.to ? data.to.toLowerCase() === wallet.address.toLowerCase() : false
    if (checkedFrom || checkedTo) {
      if (wallet.isMain || wallet.isDerived) {
        dispatch(updateWalletBalance({ wallet }))
      }
      if (wallet.isMultisig) {
        dispatch(updateEthMultisigWalletBalance({ wallet }))
      }
    }
  }
  switch (wallet.blockchain) {
    case BLOCKCHAIN_ETHEREUM:
      ethereumDAO.on('tx', listener)
      return listener
    default:
      return
  }
}

export const unsubscribeWallet = ({ wallet, listener }) => async (/*dispatch, getState*/) => {
  switch (wallet.blockchain) {
    case BLOCKCHAIN_ETHEREUM:
      ethereumDAO.removeListener('tx', listener)
      return listener
    default:
      return
  }
}

const updateAllowance = (allowance) => (dispatch, getState) => {
  let wallet = getMainEthWallet(getState())
  if (allowance) {
    wallet = new WalletModel({
      ...wallet,
      allowances: new AllowanceCollection({
        list: {
          ...wallet.allowances.list,
          [allowance.id()]: allowance,
        },
      })
    })
    dispatch(WalletsActions.updateWallet(wallet))
  }
}

export const mainTransfer = (
  wallet: WalletModel,
  token: TokenModel,
  amount: Amount,
  recipient: string,
  feeMultiplier: number = 1,
  advancedParams = null,
) => async (dispatch) => {
  try {
    const tokenDAO = tokenService.getDAO(token.id())
    const tx = tokenDAO.transfer(wallet.address, recipient, amount)
    const executeMap = {
      [BLOCKCHAIN_ETHEREUM]: executeTransaction,
      [BLOCKCHAIN_NEM]: executeNemTransaction,
      [BLOCKCHAIN_BITCOIN]: BitcoinThunks.executeBitcoinTransaction,
      [BLOCKCHAIN_WAVES]: executeWavesTransaction,
    }

    // execute
    dispatch(executeMap[wallet.blockchain]({
      tx,
      options: {
        feeMultiplier,
        walletDerivedPath: wallet.derivedPath,
        symbol: token.symbol(),
        ...advancedParams,
      },
    }))

  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    dispatch(notifyError(e))
  }
}

export const mainApprove = (token: TokenModel, amount: Amount, spender: string, feeMultiplier: number) => async (dispatch, getState) => {
  const state = getState()
  const wallet = getMainEthWallet(state)
  const allowance = wallet.allowances.list[`${spender}-${token.id()}`]
  const { account } = state.get(DUCK_SESSION)

  try {
    allowance && dispatch(updateAllowance(allowance.isFetching(true)))
    const tokenDAO = tokenService.getDAO(token)
    const tx = tokenDAO.approve(spender, amount, account)
    if (tx) {
      await dispatch(executeTransaction({ tx, options: { feeMultiplier } }))
    }
  } catch (e) {
    dispatch(notifyError(e, 'mainApprove'))
    allowance && dispatch(updateAllowance(allowance.isFetching(false)))
  }
}

export const mainRevoke = (token: TokenModel, spender: string, feeMultiplier: number = 1) => async (dispatch, getState) => {
  const state = getState()
  const wallet = getMainEthWallet(state)
  const allowance = wallet.allowances.list[`${spender}-${token.id()}`]
  dispatch(updateAllowance(allowance.isFetching(true)))

  const { account } = state.get(DUCK_SESSION)
  try {
    dispatch(updateAllowance(allowance.isFetching(true)))
    const tokenDAO = tokenService.getDAO(token)
    const tx = tokenDAO.revoke(spender, token.symbol(), account)
    if (tx) {
      await dispatch(executeTransaction({ tx, options: { feeMultiplier } }))
    }
  } catch (e) {
    dispatch(notifyError(e, 'mainRevoke'))
    dispatch(updateAllowance(allowance.isFetching(false)))
  }
}
