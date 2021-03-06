/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import ledgerProvider from '@chronobank/login/network/LedgerProvider'
import { DUCK_NETWORK } from '@chronobank/login/redux/network/constants'
import { fetchAccount, startLedgerSync, stopLedgerSync } from '@chronobank/login/redux/ledger/actions'
import { CircularProgress, MenuItem } from '@material-ui/core'
import Select from 'redux-form-material-ui/es/Select'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { Translate } from 'react-redux-i18n'
import { setAccounts, selectAccount } from '@chronobank/login/redux/network/actions'
import BackButton from '../../components/BackButton/BackButton'
import './LoginWithLedger.scss'
import { Button } from '../../settings'

const ledgerStates = [ {
  flag: 'isHttps',
  successTitle: 'LoginWithLedger.isHttps.successTitle',
  errorTitle: 'LoginWithLedger.isHttps.errorTitle',
  errorTip: 'LoginWithLedger.isHttps.errorTip',
}, {
  flag: 'isU2F',
  successTitle: 'LoginWithLedger.isU2F.successTitle',
  errorTitle: 'LoginWithLedger.isU2F.errorTitle',
  errorTip: 'LoginWithLedger.isU2F.errorTip',
}, {
  flag: 'isETHAppOpened',
  successTitle: 'LoginWithLedger.isETHAppOpened.successTitle',
  errorTitle: 'LoginWithLedger.isETHAppOpened.errorTitle',
  errorTip: 'LoginWithLedger.isETHAppOpened.errorTip',
}, {
  flag: 'isFetched',
  successTitle: 'LoginWithLedger.isFetched.successTitle',
  errorTitle: 'LoginWithLedger.isFetched.errorTitle',
  errorTip: 'LoginWithLedger.isFetched.errorTip',
} ]

const mapStateToProps = (state) => {
  const network = state.get(DUCK_NETWORK)
  return {
    ledger: state.get('ledger'),
    isLoading: network.isLoading,
    account: network.accounts,
  }
}

const mapDispatchToProps = (dispatch) => ({
  startLedgerSync: () => dispatch(startLedgerSync()),
  stopLedgerSync: (isReset) => dispatch(stopLedgerSync(isReset)),
  fetchAccount: () => dispatch(fetchAccount()),
  selectAccount: (account) => dispatch(selectAccount(account)),
  setAccounts: (account) => dispatch(setAccounts(account)),
})

@connect(mapStateToProps, mapDispatchToProps)
class LoginLedger extends PureComponent {
  static propTypes = {
    selectAccount: PropTypes.func,
    setAccounts: PropTypes.func,
    startLedgerSync: PropTypes.func,
    stopLedgerSync: PropTypes.func,
    fetchAccount: PropTypes.func,
    onBack: PropTypes.func.isRequired,
    onLogin: PropTypes.func.isRequired,
    ledger: PropTypes.shape({
      isFetched: PropTypes.bool,
      isFetching: PropTypes.bool,
      isHttps: PropTypes.bool,
      isETHAppOpened: PropTypes.bool,
    }),
    isLoading: PropTypes.bool,
    account: PropTypes.array,
  }

  state = {
    value: 0,
  };

  componentWillMount () {
    this.props.startLedgerSync()
  }

  componentDidUpdate (prevProps) {
    const ledger = this.props.ledger
    if (!ledger.isFetched && !ledger.isFetching && ledger.isHttps && ledger.isU2F && ledger.isETHAppOpened) {
      this.props.fetchAccount()
    }
    ledgerProvider.setWallet(prevProps.account[0])
    this.props.selectAccount(prevProps.account[0])
    this.props.setAccounts(prevProps.account)
  }

  componentWillUnmount () {
    this.props.stopLedgerSync()
  }

  handleBackClick = () => {
    this.props.stopLedgerSync(true)
    this.props.onBack()
  }

  handleChange = (event, index, value) => {
    this.setState({ value })
    ledgerProvider.setWallet(this.props.account[index])
    this.props.selectAccount(this.props.account[index])
  }

  _buildItem (item, index) {
    return <MenuItem value={index} key={index} primaryText={item} />
  }

  renderStates () {
    const { ledger } = this.props

    return ledgerStates.map((item) => ledger[ item.flag ]
      ? (
        <div styleName='state' key={item.flag}>
          <div styleName='flag flagDone' className='material-icons'>done</div>
          <div styleName='titleContent'><Translate value={item.successTitle} /></div>
        </div>
      )
      : (
        <div styleName='state' key={item.flag}>
          <div styleName='flag flagError' className='material-icons'>error</div>
          <div styleName='titleContent'>
            <div styleName='title'><Translate value={item.errorTitle} /></div>
            <div styleName='subtitle'><Translate value={item.errorTip} /></div>
          </div>
        </div>
      ))
  }

  render () {
    const { isLoading, ledger, account } = this.props

    return (
      <div styleName='root'>
        <BackButton
          onClick={this.handleBackClick}
          to='options'
        />

        <div styleName='states'>
          {this.renderStates()}
        </div>

        {ledger.isFetched && (
          <div styleName='account'>
            <Select
              label='Select address'
              autoWidth
              fullWidth
              floatingLabelStyle={{ color: 'white' }}
              labelStyle={{ color: 'white' }}
              value={this.state.value}
              onChange={this.handleChange}
            >
              {this.props.account.map(this._buildItem)}
            </Select>
          </div>
        )}

        <div styleName='actions'>
          <div styleName='action'>
            <Button
              label={isLoading
                ? (
                  <CircularProgress
                    style={{ verticalAlign: 'middle', marginTop: -2 }}
                    size={24}
                    thickness={1.5}
                  />
                )
                : <Translate value='LoginWithLedger.login' />
              }
              primary
              fullWidth
              disabled={isLoading || !account}
              onClick={this.props.onLogin}
            />
          </div>
        </div>
      </div>
    )
  }
}

export default LoginLedger
