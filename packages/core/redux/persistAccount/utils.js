/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import bip39 from 'bip39'
import uuid from 'uuid/v1'
import {
  profileImgJPG,
} from '@chronobank/core-dependencies/assets'
import {
  AccountEntryModel,
} from '../../models/wallet/persistAccount'
import EthereumMemoryDevice from '../../services/signers/EthereumMemoryDevice'

export const replaceWallet = (wallet, walletList) => {
  const index = walletList.findIndex((item) => item.key === wallet.key)

  const copyWalletList = [...walletList]

  copyWalletList.splice(index, 1, wallet)

  return copyWalletList
}

// eslint-disable-next-line no-unused-vars
export const getAddress = (address, hexFormat = false) => {
  return address//`${ hexFormat ? '0x' : ''}${address}`
}

export const getAccountAddress = (account: AccountEntryModel, hexFormat = false) => {
  return account && account.encrypted && account.encrypted[0] && getAddress(account.encrypted[0].address, hexFormat) || ''
}

export const getWalletsListAddresses = (walletsList = []) => {
  return walletsList.map((wallet) => getAccountAddress(wallet, true))
}

export const walletAddressExistInWalletsList = (wallet, walletsList = []) => {
  return walletsList.find((w) => getAccountAddress(w) === getAccountAddress(wallet))
}

export const getAccountName = (account: AccountEntryModel) => {
  if (account && account.profile && account.profile.userName) {
    return account.profile.userName
  }

  return account && account.name || ''
}

export const getAccountAvatarImg = (account) => {
  if (account && account.profile && account.profile.avatar) {
    return account.profile.avatar
  }

  return ''
}

export const generateMnemonic = () => {
  return bip39.generateMnemonic()
}

export const getAccountAvatar = (account: AccountEntryModel) => {
  const img = getAccountAvatarImg(account)

  return img || profileImgJPG
}

export const createAccountEntry = (name, walletFileImportObject, profile = null) =>
  new AccountEntryModel({
    key: uuid(),
    name,
    type: 'memory',
    encrypted: [walletFileImportObject],
    profile,
  })

export const createDeviceAccountEntry = (name, device, profile = null) => {
  return new AccountEntryModel({
    key: uuid(),
    name,
    type: 'device',
    encrypted: [device],
    profile,
  })
}

export const validateMnemonicForAccount = (mnemonic, selectedWallet: AccountEntryModel) => {
  const addressFromWallet = selectedWallet && getAccountAddress(selectedWallet, true)
  const address = getAddressByMnemonic(mnemonic)

  return addressFromWallet === address
}

export const getAddressByMnemonic = (mnemonic) => {
  return EthereumMemoryDevice
    .getDerivedWallet(mnemonic,null)
    .address
}
