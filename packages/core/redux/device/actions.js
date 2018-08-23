/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import TrezorDevice from '../../services/signers/TrezorDevice.js'
import TrezorDeviceMock from '../../services/signers/TrezorDeviceMock.js'
import LedgerDevice from '../../services/signers/LedgerDevice.js'
import LedgerDeviceMock from '../../services/signers/LedgerDeviceMock.js'
import BitcoinMemoryDevice from '../../services/signers/BitcoinMemoryDevice.js'
import { getSigner } from '../persistAccount/selectors'
import { accountLoad } from '../persistAccount/actions'
import {
  AccountModel,
  DeviceEntryModel,
} from '../../models'
import {
  DUCK_DEVICE_ACCOUNT,
  DEVICE_ADD,
  DEVICE_SELECT,
  DEVICE_UPDATE_LIST,
  DEVICE_LOAD,
  DEVICE_SET_STATUS,
} from './constants'

export const deviceAdd = (wallet) => (dispatch) => {
  dispatch({ type: DEVICE_ADD, wallet })
}

export const deviceSelect = (wallet) => (dispatch) => {
  dispatch({ type: DEVICE_SELECT, wallet })
}

export const deviceDeselect = (wallet) => (dispatch) => {
  dispatch({ type: DEVICE_DESELECT, wallet })
}

export const deviceLoad = (wallet) => (dispatch) => {
  dispatch({ type: DEVICE_LOAD, wallet })
}

export const deviceUpdateList = (deviceList) => (dispatch) => {
  dispatch({ type: DEVICE_UPDATE_LIST, deviceList })
}

export const deviceSetStatus = (deviceStatus) => (dispatch) => {
  dispatch({ type: DEVICE_SET_STATUS, deviceStatus})
}

export const onDeviceSelect = (wallet) => (dispatch) => {

  dispatch(PersistAccountActions.accountSelect(wallet))
  dispatch(LoginUIActions.navigateToLoginPage())
}

export const initLedgerDevice = (wallet) => async (dispatch, getState) => {
  console.log('initLedgerDevice')
  const ledger = new LedgerDevice()
  const result = await ledger.getAddressInfoList(0,5)
  dispatch(deviceUpdateList(result))
}

export const initTrezorDevice = (wallet) => async (dispatch, getState) => {
  console.log('initTrezorDevice')
  const trezor = new TrezorDevice()
  const result = await trezor.getAddressInfoList(0,5)
  dispatch(deviceUpdateList(result))
}

export const loadDeviceAccount = (entry) => async (dispatch) => {
  console.log('load device account')
  const wallet = new AccountModel({
    entry,
  })
  await dispatch(accountLoad(wallet))

  return wallet
}

export const deviceNextPage = () => (dispatch, getState) => {
  

}