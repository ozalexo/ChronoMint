/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 *
 * @flow
 */

import {
  change,
  stopSubmit,
  SubmissionError,
} from 'redux-form'
import { replace } from 'react-router-redux'
import * as NetworkActions from '@chronobank/login/redux/network/actions'
import walletProvider from '@chronobank/login/network/walletProvider'
import setup from '@chronobank/login/network/EngineUtils'
import localStorage from 'utils/LocalStorage'
import {
  DUCK_NETWORK,
} from '@chronobank/login/redux/network/constants'
import {
  DUCK_PERSIST_ACCOUNT,
} from '@chronobank/core/redux/persistAccount/constants'
import * as NetworkThunks from '@chronobank/login/redux/network/thunks'
import * as SessionThunks from '@chronobank/core/redux/session/thunks'
import { modalsOpen, modalsClose } from '@chronobank/core/redux/modals/actions'
import * as PersistAccountActions from '@chronobank/core/redux/persistAccount/actions'
import PublicBackendProvider from '@chronobank/login/network/PublicBackendProvider'
import { SignerMemoryModel } from '@chronobank/core/models'
import {
  createAccountEntry,
} from '@chronobank/core/redux/persistAccount/utils'
import * as LoginUINavActions from './navigation'
import {
  FORM_LOGIN_PAGE,
  FORM_LOGIN_PAGE_FIELD_SUCCESS_MESSAGE,
  FORM_FOOTER_EMAIL_SUBSCRIPTION,
} from './constants'
import userMonitorService from './userMonitorService'

/*
 * Thunk dispatched by "" screen.
 * TODO: to add description
 */
export const navigateToCreateAccountFromHW = (address) => (dispatch) => {
  dispatch(NetworkActions.networkSetAccounts(address))
  dispatch(LoginUINavActions.navigateToCreateHWAccount())
}

/*
 * Thunk dispatched by "" screen.
 * TODO: to add description
 */
export const navigateToCreateAccountWithoutImport = () => (dispatch) => {
  dispatch(LoginUINavActions.navigateToCreateAccount())
}

/*
 * Thunk dispatched by "" screen.
 * TODO: to add description
 * TODO: to dispatch something, this is not a thunk or action. Really..
 */
export const initCommonNetworkSelector = () => (dispatch) => {

  dispatch(NetworkThunks.autoSelect())

}

/*
 * Thunk dispatched by "" screen.
 * TODO: to add description
 * TODO: to dispatch something, this is not a thunk or action. Really..
 */
export const onSubmitSubscribeNewsletter = (email) => async () => {
  const publicBackendProvider = new PublicBackendProvider()

  try {
    await publicBackendProvider.getSubscribe({ email })
  } catch (e) {
    throw new SubmissionError({ _error: e && e.message })
  }
}
/*
 * Thunk dispatched by "" screen.
 * TODO: to add description
 * TODO: to extract logic from here
 */
export const onSubmitLoginForm = (password) => async (dispatch, getState) => {
  dispatch(NetworkActions.networkSetLoginSubmitting())

  const state = getState()
  const { selectedWallet } = state.get(DUCK_PERSIST_ACCOUNT)

  try {
    const wallet = dispatch(PersistAccountActions.decryptAccount(selectedWallet.encrypted, password))
    dispatch(PersistAccountActions.accountLoad(new SignerMemoryModel({ wallet })))

    const privateKey = wallet && wallet[0] && wallet[0].privateKey

    if (privateKey) {
      dispatch(SessionThunks.getProfileSignature(wallet[0]))
      // Code below prevously was handleWalletLogin
      dispatch(NetworkActions.loading())
      dispatch(NetworkActions.clearErrors())
      const providerSettings = dispatch(SessionThunks.getProviderSettings())
      const provider = walletProvider.getProvider(
        selectedWallet.encrypted[0],
        password,
        providerSettings,
      )
      dispatch(NetworkActions.selectAccount(provider.ethereum.getAddress()))
      await setup(provider)
      const state = getState()
      const {
        selectedAccount,
        selectedProviderId,
        selectedNetworkId,
      } = state.get(DUCK_NETWORK)

      dispatch(NetworkActions.clearErrors())
      dispatch(SessionThunks.createNetworkSession(
        selectedAccount,
        selectedProviderId,
        selectedNetworkId,
      ))
      localStorage.createSession(selectedAccount, selectedProviderId, selectedNetworkId)

      dispatch(watchInitUserMonitor())

      const defaultURL = await dispatch(SessionThunks.login(selectedAccount))
      dispatch(replace(localStorage.getLastURL() || defaultURL))
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('Error in onSubmitLoginForm:', e)
    throw new SubmissionError({ password: e && e.message })
  }
}

/*
 * Thunk dispatched by "" screen.
 * TODO: to add description
 * TODO: to remove throws
 * TODO: to rework it
 */
export const onSubmitCreateAccountImportMnemonic = (name, password, mnemonic) =>
  async (dispatch) => {
    await dispatch(onSubmitImportAccount({
      name,
      password,
      mnemonic,
    }))

  }

/*
 * Thunk dispatched by "" screen.
 * TODO: to add description
 * TODO: to remove throws
 * TODO: to rework it
 */
export const onSubmitCreateAccountImportPrivateKey = (name, password, privateKey) =>
  async (dispatch) => {
    await dispatch(onSubmitImportAccount({
      name,
      password,
      privateKey,
    }))

  }

/*
 * Thunk dispatched by
 * LoginWithMnemonic, LoginWithPrivateKey screen.
 */
export const onSubmitImportAccount = ({ name, password, mnemonic = '', privateKey = '' }) =>
  async (dispatch) => {

    try {
      const wallet = await dispatch(PersistAccountActions.createAccount({
        name,
        password,
        mnemonic,
        privateKey,
        numberOfAccounts: 0,
      }))

      dispatch(PersistAccountActions.accountAdd(wallet))
      dispatch(PersistAccountActions.accountSelect(wallet))

    } catch (e) {
      throw new SubmissionError({ _error: e && e.message })
    }

  }

/*
 * Thunk dispatched by "" screen.
 * TODO: to add description
 * TODO: to rework it
 */
export const onSubmitCreateHWAccountPage = (walletName) =>
  async (dispatch, getState) => {
    const validateName = dispatch(PersistAccountActions.validateAccountName(walletName))

    if (!validateName) {
      throw new SubmissionError({ walletName: 'Wrong wallet name' })
    }

    dispatch(NetworkActions.setAccountCredentials(walletName, walletName))

    const state = getState()
    const {
      newAccountPrivateKey,
    } = state.get(DUCK_NETWORK)

    try {
      const wallet = await dispatch(PersistAccountActions.createHWAccount({
        name: walletName,
        pupblicKey: newAccountPrivateKey,
        numberOfAccounts: 0,
      }))

      dispatch(PersistAccountActions.accountAdd(wallet))
      dispatch(PersistAccountActions.accountSelect(wallet))
    } catch (e) {
      throw new SubmissionError({ _error: e && e.message })
    }
  }

/*
 * Thunk dispatched by "" screen.
 * TODO: to add description
 * TODO: to rework it
 */
export const onSubmitCreateHWAccountPageSuccess = () => {
  // FIXME: empty thunk
}

/*
 * Thunk dispatched by "" screen.
 * TODO: to add description
 * TODO: to rework it
 */
// eslint-disable-next-line no-unused-vars
export const onSubmitCreateHWAccountPageFail = (errors, submitErrors) => {
  // FIXME: empty thunk
}

/*
 * Thunk dispatched by "" screen.
 * TODO: to add description
 * TODO: to move logic to utils
*/
export const onCreateWalletFromJSON = (name, walletJSON, profile) => (dispatch) => {
  const account = createAccountEntry(name, walletJSON, profile)

  dispatch(PersistAccountActions.accountAdd(account))

}

/*
 * Thunk dispatched by "" screen.
 * TODO: to add description
 */
export const initLoginPage = () =>
  (dispatch, getState) => {
    dispatch(NetworkThunks.resetAllLoginFlags())
    dispatch(NetworkActions.networkResetLoginSubmitting())
    dispatch(NetworkThunks.initAccountsSignature())

    const state = getState()
    const {
      selectedWallet,
      walletsList,
    } = state.get(DUCK_PERSIST_ACCOUNT)

    if (walletsList && !walletsList.length) {
      dispatch(LoginUINavActions.navigateToCreateAccount())
    }

    if (!selectedWallet) {
      dispatch(LoginUINavActions.navigateToSelectWallet())
    }
  }

/*
 * Thunk dispatched by "" screen.
 * TODO: to add description
 * TODO: to add translation
 * TODO: to remove text from here
 * TODO: to move FORM_LOGIN_PAGE* constants from actions.js
 */
export const onSubmitResetAccountPasswordSuccess = () => (dispatch) => {
  dispatch(NetworkActions.networkResetAccountRecoveryMode())
  dispatch(LoginUINavActions.navigateToLoginPage())
  dispatch(change(
    FORM_LOGIN_PAGE,
    FORM_LOGIN_PAGE_FIELD_SUCCESS_MESSAGE,
    'Your password has been reset.',
  ))
}

export const onWalletSelect = (wallet) => (dispatch) => {

  dispatch(PersistAccountActions.accountSelect(wallet))
  dispatch(LoginUINavActions.navigateToLoginPage())
}

// #endregion

// #region stopSubmits

/*
 * Thunk dispatched by "" screen.
 * TODO: to add description
 * TODO: to rework it, merge into one action onSubmitPageFail
 */
export const onSubmitSubscribeNewsletterFail = (errors, submitErrors) =>
  (dispatch) => {
    dispatch(stopSubmit(FORM_FOOTER_EMAIL_SUBSCRIPTION, submitErrors && submitErrors.errors))
  }

/*
 * Thunk dispatched by "" screen.
 * TODO: to add description
 * TODO: to rework it, merge into one action onSubmitPageFail
 */
export const onSubmitLoginFormFail = (errors, submitErrors) => (dispatch) => {
  dispatch(stopSubmit(FORM_LOGIN_PAGE, submitErrors && submitErrors.errors))
  dispatch(NetworkActions.networkResetLoginSubmitting())
}

export const startUserMonitorAndCloseModals = () => (dispatch) => {
  userMonitorService.start()
  dispatch(modalsClose())
}

export const stopUserMonitor = () => () => {
  userMonitorService.stop()
}

export const removeWatchersUserMonitor = () => () => {
  userMonitorService
    .removeAllListeners('active')
    .stop()
}

export const watchInitUserMonitor = () => (dispatch) => {
  userMonitorService
    .on('active', () => dispatch(modalsOpen({
      componentName: 'UserActiveDialog',
    })))
    .start()
}
