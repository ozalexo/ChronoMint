/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import {
  // onSubmitCreateAccountImportPrivateKey,
  onCreateWalletFromJSON,
} from '@chronobank/login-ui/redux/thunks'
import {
  navigateToSelectWallet,
  // navigateToSelectImportMethod,
  // navigateToLoginPage,
  navigateBack,
} from '@chronobank/login-ui/redux/navigation'
import {
  LoginWithWalletContainer,
  AccountNameContainer,
} from '@chronobank/login-ui/components'
import { SubmissionError } from 'redux-form'
import * as ProfileThunks from '@chronobank/core/redux/profile/thunks'
import { getAddress } from '@chronobank/core/redux/persistAccount/utils'

function mapDispatchToProps (dispatch) {
  return {
    getUserInfo: (addresses: string[]) => dispatch(ProfileThunks.getUserInfo(addresses)),
    navigateBack: () => dispatch(navigateBack()),
    // navigateToLoginPage: () => dispatch(navigateToLoginPage()),
    // navigateToSelectImportMethod: () => dispatch(navigateToSelectImportMethod()),
    navigateToSelectWallet: () => dispatch(navigateToSelectWallet()),
    onCreateWalletFromJSON: (name, walletJSON, profile) => dispatch(onCreateWalletFromJSON(name, walletJSON, profile)),
    // onSubmitCreateAccountImportPrivateKey: (name, password, mnemonic) => dispatch(onSubmitCreateAccountImportPrivateKey(name, password, mnemonic)),
  }
}

class WalletImportPage extends PureComponent {
  static PAGES = {
    WALLET_UPLOAD_FORM: 1,
    ACCOUNT_NAME_FORM: 2,
  }

  static propTypes = {
    getUserInfo: PropTypes.func,
    navigateBack: PropTypes.func,
    // navigateToLoginPage: PropTypes.func,
    // navigateToSelectImportMethod: PropTypes.func,
    navigateToSelectWallet: PropTypes.func,
    onCreateWalletFromJSON: PropTypes.func,
    // onSubmitCreateAccountImportPrivateKey: PropTypes.func,
  }

  constructor (props) {
    super(props)

    this.state = {
      page: WalletImportPage.PAGES.WALLET_UPLOAD_FORM,
      walletJSON: null,
    }
  }

  getCurrentPage () {
    switch(this.state.page){
      case WalletImportPage.PAGES.WALLET_UPLOAD_FORM:
        return (
          <LoginWithWalletContainer
            previousPage={this.previousPage.bind(this)}
            onSubmit={this.onSubmitWallet.bind(this)}
          />
        )

      case WalletImportPage.PAGES.ACCOUNT_NAME_FORM:
        return (
          <AccountNameContainer
            previousPage={this.previousPage.bind(this)}
            onSubmit={this.onSubmitAccountName.bind(this)}
          />
        )

      default:
        return (
          <LoginWithWalletContainer
            previousPage={this.previousPage.bind(this)}
            onSubmit={this.onSubmitWallet.bind(this)}
          />
        )
    }
  }

  convertWalletFileToJSON (walletString) {
    let restoredWalletJSON

    try {
      restoredWalletJSON = JSON.parse(walletString)

      if ('Crypto' in restoredWalletJSON) {
        restoredWalletJSON.crypto = restoredWalletJSON.Crypto
        delete restoredWalletJSON.Crypto
      }
    } catch (e) {
      throw new SubmissionError({ _error: 'Broken wallet file' })
    }

    if (!restoredWalletJSON.address) {
      throw new SubmissionError({ _error: 'Wrong wallet address' })
    }

    return restoredWalletJSON
  }

  async onSubmitWallet (walletString) {
    let walletJSON = this.convertWalletFileToJSON(walletString)
    this.setState({ walletJSON })

    let response = null, userName = null, profile = null

    // If profile has been got && profile does exist && userName != null then create wallet
    try {
      response = await this.props.getUserInfo([getAddress(walletJSON.address, true)])

      profile = response.data[0]
      userName = profile.userName

      if (userName){
        this.props.onCreateWalletFromJSON(userName, walletJSON, profile)
        this.props.navigateToSelectWallet()
      } else {
        this.setState({
          page: WalletImportPage.PAGES.ACCOUNT_NAME_FORM,
        })
      }

    } catch (e) {
      this.setState({
        page: WalletImportPage.PAGES.ACCOUNT_NAME_FORM,
      })
    }
  }

  async onSubmitAccountName (accountName) {
    const { onCreateWalletFromJSON, navigateToSelectWallet } = this.props

    onCreateWalletFromJSON(accountName, this.state.walletJSON, null)
    navigateToSelectWallet()
  }

  previousPage () {
    if (this.state.page === WalletImportPage.PAGES.WALLET_UPLOAD_FORM){
      this.props.navigateBack()
    } else {
      this.setState ({ page: this.state.page - 1 })
    }
  }

  render () {

    return this.getCurrentPage()
  }
}

export default connect(null, mapDispatchToProps)(WalletImportPage)
