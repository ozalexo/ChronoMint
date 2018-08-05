/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import {
  isLocalNode,
} from '@chronobank/login/network/settings'
import {
  DUCK_NETWORK,
} from '@chronobank/login/redux/network/actions'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { Translate } from 'react-redux-i18n'
import {
  handleLoginLocalAccountClick,
} from '@chronobank/login/redux/network/thunks'
import networkService from '@chronobank/login/network/NetworkService'
import {
  navigateToLoginPage,
} from '../../redux/actions'
import {
  onSubmitLoginTestRPC,
  onSubmitLoginTestRPCFail,
} from '../../redux/thunks'
import './LoginLocal.scss'

const mapDispatchToProps = (dispatch) => ({
  onSubmit: () => dispatch(onSubmitLoginTestRPC()),
  onSubmitFail: (errors, dispatch, submitErrors) => dispatch(onSubmitLoginTestRPCFail(errors, submitErrors)),
  navigateToLoginPage: () => dispatch(navigateToLoginPage()),
  handleLoginLocalAccountClick: (account) => dispatch(handleLoginLocalAccountClick(account)),
})

const mapStateToProps = (state) => {
  const network = state.get(DUCK_NETWORK)
  return {
    accounts: network.accounts,
    isLocalNode: isLocalNode(network.selectedProviderId, network.selectedNetworkId),
  }
}

@connect(mapStateToProps, mapDispatchToProps)
class LoginLocal extends PureComponent {
  static propTypes = {
    accounts: PropTypes.array,
    navigateToLoginPage: PropTypes.func,
    handleLoginLocalAccountClick: PropTypes.func,
    isLocalNode: PropTypes.bool,
  }

  async componentWillMount (){
    if (this.props.isLocalNode) {
      await networkService.loadAccounts()
    } else {
      this.props.navigateToLoginPage()
    }
  }

  componentDidUpdate (){
    if (!this.props.isLocalNode){
      this.props.navigateToLoginPage()
    }
  }

  renderRPCSelectorMenuItem (item, i){
    return (
      <div
        key={i}
        onClick={() => this.props.handleLoginLocalAccountClick(item)}
        styleName='account-item'
      >
        <div styleName='account-item-content'>
          { item }
        </div>
        <div styleName='account-item-icon'>
          <div className='chronobank-icon'>next</div>
        </div>
      </div>
    )
  }

  render () {
    const { accounts } = this.props

    return (
      <div styleName='wrapper'>

        <div styleName='page-title'>
          <Translate value='LoginLocal.title' />
        </div>
        {accounts.map((item, i) => this.renderRPCSelectorMenuItem(item, i))}
      </div>
    )
  }
}

export default LoginLocal
