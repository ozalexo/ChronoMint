/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 *
 * @flow
 */

import * as PersistAccountActions from '@chronobank/core/redux/persistAccount/actions'
import {
  DUCK_PERSIST_ACCOUNT,
} from '@chronobank/core/redux/persistAccount/constants'
import web3Converter from '@chronobank/core/utils/Web3Converter'
import uportProvider from '@chronobank/nodes/other/UportProvider'
import { primaryNodeSetExternalProvider } from '@chronobank/nodes/redux/actions'
import {
  DUCK_NETWORK,
} from './constants'
import * as NetworkActions from './actions'

/*
 * Thunk dispatched by "" screen.
 * TODO: to add description
 * TODO: maybe it is better to join all these actions below into one actions and one reducer
 */
export const resetAllLoginFlags = () => (dispatch) => {
  dispatch(NetworkActions.networkResetImportPrivateKey())
  dispatch(NetworkActions.networkResetImportWalletFile())
  dispatch(NetworkActions.networkResetAccountRecoveryMode())
  dispatch(NetworkActions.networkResetNewMnemonic())
  dispatch(NetworkActions.networkResetNewAccountCredential())
  dispatch(NetworkActions.networkResetWalletFileImported())
}

/*
 * Thunk dispatched by "" screen.
 * TODO: to add description
 */
export const updateSelectedAccount = () => (dispatch, getState) => {
  const state = getState()

  const {
    selectedWallet,
    walletsList,
  } = state.get(DUCK_PERSIST_ACCOUNT)

  const foundAccount = walletsList
    .find((account) =>
      account.key === selectedWallet.key,
    )

  if (foundAccount) {
    dispatch(PersistAccountActions.accountSelect(foundAccount))
  }
}

/*
 * Thunk dispatched by "" screen.
 * TODO: to add description
 */
export const initAccountsSignature = () =>
  async (dispatch, getState) => {
    const state = getState()

    const { loadingAccountSignatures } = state.get(DUCK_NETWORK)
    const { walletsList } = state.get(DUCK_PERSIST_ACCOUNT)

    if (loadingAccountSignatures || !walletsList.length) {
      return
    }

    dispatch(NetworkActions.loadingAccountsSignatures())

    const accounts = await dispatch(PersistAccountActions.setProfilesForAccounts(walletsList))

    accounts.forEach((account) =>
      dispatch(PersistAccountActions.accountUpdate(account)),
    )

    dispatch(updateSelectedAccount())
    dispatch(NetworkActions.resetLoadingAccountsSignatures())
  }

/*
 * Thunk dispatched by "" screen.
 * TODO: to add description
 */
export const initRecoverAccountPage = () => (dispatch) => {
  dispatch(NetworkActions.networkResetNewMnemonic())
  dispatch(NetworkActions.networkSetAccountRecoveryMode())
}

/*
 * Thunk dispatched by "" screen.
 * TODO: to add description
 * TODO: this is not an action, to refactor it
 */
export const selectProviderWithNetwork = (networkId, providerId) => (dispatch) => {
  dispatch(NetworkActions.networkSetProvider(providerId))
  dispatch(NetworkActions.networkSetNetwork(networkId))
}

// TODO: actually, this method does not used. It is wrong. Need to be used
export const isMetaMask = () => (dispatch, getState) => {
  const state = getState()
  const network = state.get(DUCK_NETWORK)
  return network.isMetamask
}

export const loginUport = () => async (dispatch) => {
  const provider = uportProvider.getUportProvider()
  const encodedAddress = await provider.requestAddress()
  const { network, address } = uportProvider.decodeMNIDaddress(encodedAddress)

  const networksMap = {
    1: 'mainnet',
    2: 'morden',
    3: 'ropsten',
    42: 'kovan',
    4: 'rinkeby',
  }

  if (network === 1 || network === 4) {
    dispatch(primaryNodeSetExternalProvider(provider.getWeb3(), provider.getProvider()))
    dispatch(NetworkActions.networkSetNetwork(web3Converter.hexToDecimal(network)))
    dispatch(NetworkActions.networkSetAccounts([address]))
    dispatch(NetworkActions.selectAccount(address))
  } else {
    throw new Error(`Network ${networksMap[network]} does not supported. Yet?`)
  }

  return true
}
