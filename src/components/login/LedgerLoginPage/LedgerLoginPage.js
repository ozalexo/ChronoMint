/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { onCreateWalletFromDevice } from '@chronobank/login-ui/redux/thunks'
import { navigateToSelectWallet, navigateBack } from '@chronobank/login-ui/redux/navigation'
import { LoginWithLedgerContainer, AccountNameContainer, DerivationPathFormContainer } from '@chronobank/login-ui/components'
import * as ProfileThunks from '@chronobank/core/redux/profile/thunks'
import { getAddress } from '@chronobank/core/redux/persistAccount/utils'

function mapDispatchToProps (dispatch) {
  return {
    getUserInfo: (addresses: string[]) => dispatch(ProfileThunks.getUserInfo(addresses)),
    navigateToSelectWallet: () => dispatch(navigateToSelectWallet()),
    onCreateWalletFromDevice: (name, device, profile) => dispatch(onCreateWalletFromDevice(name, device, profile)),
    navigateBack: () => dispatch(navigateBack()),
  }
}

class LedgerLoginPage extends PureComponent {
  static PAGES = {
    DEVICE_SELECT_FORM: 1,
    ACCOUNT_NAME_FORM: 2,
    DERIVATION_PATH_FORM: 3,
  }

  static propTypes = {
    getUserInfo: PropTypes.func,
    navigateToSelectWallet: PropTypes.func,
    navigateBack: PropTypes.func,
    onCreateWalletFromDevice: PropTypes.func,
  }

  constructor (props) {
    super(props)

    this.state = {
      page: LedgerLoginPage.PAGES.DEVICE_SELECT_FORM,
    }
  }

  handleSubmitDevice = async (device) => {
    this.setState({
      device: device,
    })

    let response = null,
      userName = null,
      profile = null

    // If profile has been got && profile does exist && userName != null then create wallet
    try {
      response = await this.props.getUserInfo([getAddress(device.address, true)])

      profile = response.data[0]
      userName = profile.userName

      if (userName) {
        this.props.onCreateWalletFromDevice(userName, device, profile)
        this.props.navigateToSelectWallet()
      } else {
        this.setState({
          page: LedgerLoginPage.PAGES.ACCOUNT_NAME_FORM,
        })
      }
    } catch (e) {
      this.setState({
        page: LedgerLoginPage.PAGES.ACCOUNT_NAME_FORM,
      })
    }
  }

  handleSubmitAccountName = (accountName) => {
    const { onCreateWalletFromDevice, navigateToSelectWallet } = this.props

    onCreateWalletFromDevice(accountName, this.state.device, null)
    navigateToSelectWallet()
  }

  handleSubmitDerivationPath = () => {
    this.setState({
      page: LedgerLoginPage.PAGES.DEVICE_SELECT_FORM,
    })
  }

  getCurrentPage = () => {
    switch (this.state.page) {
      case LedgerLoginPage.PAGES.DEVICE_SELECT_FORM:
        return (
          <LoginWithLedgerContainer
            previousPage={this.previousPage}
            onDeviceSelect={this.handleSubmitDevice}
            navigateToDerivationPathForm={this.navigateToDerivationPathForm}
          />
        )

      case LedgerLoginPage.PAGES.ACCOUNT_NAME_FORM:
        return (
          <AccountNameContainer
            previousPage={this.previousPage}
            onSubmit={this.handleSubmitAccountName}
          />
        )

      case LedgerLoginPage.PAGES.DERIVATION_PATH_FORM:
        return (
          <DerivationPathFormContainer
            previousPage={this.navigateToDeviceSelectForm}
            onSubmit={this.handleSubmitDerivationPath}
          />
        )

      default:
        return (
          <LoginWithLedgerContainer
            previousPage={this.previousPage}
            onDeviceSelect={this.handleSubmitDevice}
          />
        )
    }
  }

  navigateToDerivationPathForm = () => {
    this.setState({
      page: LedgerLoginPage.PAGES.DERIVATION_PATH_FORM,
    })
  }

  navigateToDeviceSelectForm = () => {
    this.setState({
      page: LedgerLoginPage.PAGES.DEVICE_SELECT_FORM,
    })
  }

  previousPage = () => {
    if (this.state.page === LedgerLoginPage.PAGES.DEVICE_SELECT_FORM) {
      this.props.navigateBack()
    } else {
      this.setState({ page: this.state.page - 1 })
    }
  }

  render () {
    return this.getCurrentPage()
  }
}

export default connect(
  null,
  mapDispatchToProps
)(LedgerLoginPage)
