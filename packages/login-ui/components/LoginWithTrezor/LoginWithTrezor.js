/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import { fetchAccount, startTrezorSync, stopTrezorSync } from '@chronobank/login/redux/trezor/actions'
import { DUCK_NETWORK } from '@chronobank/login/redux/network/constants'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import Divider from '@material-ui/core/Divider'
import Typography from '@material-ui/core/Typography'
import ChevronRight from '@material-ui/icons/ChevronRight'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { Translate } from 'react-redux-i18n'
import {
  navigateToCreateAccountFromHW,
} from '../../redux/thunks'
import {
  navigateBack,
} from '../../redux/navigation'

import './LoginWithTrezor.scss'

const trezorStates = [ {
  flag: 'isFetched',
  successTitle: 'LoginWithTrezor.isConnected.successTitle',
  errorTitle: 'LoginWithTrezor.isConnected.errorTitle',
  errorTip: 'LoginWithTrezor.isConnected.errorTip',
} ]

const mapStateToProps = (state) => {
  const network = state.get(DUCK_NETWORK)
  return {
    trezor: state.get('trezor'),
    isLoading: network.isLoading,
    account: network.accounts,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    startTrezorSync: () => dispatch(startTrezorSync()),
    stopTrezorSync: (isReset) => dispatch(stopTrezorSync(isReset)),
    fetchAccount: () => dispatch(fetchAccount()),
    navigateToCreateAccountFromHW: (account) => dispatch(navigateToCreateAccountFromHW(account)),
    navigateBack: () => dispatch(navigateBack()),
  }
}

@connect(mapStateToProps, mapDispatchToProps)
class LoginTrezor extends PureComponent {
  static propTypes = {
    startTrezorSync: PropTypes.func,
    stopTrezorSync: PropTypes.func,
    fetchAccount: PropTypes.func,
    navigateBack: PropTypes.func,
    trezor: PropTypes.object,
    account: PropTypes.instanceOf(Array),
    navigateToCreateAccountFromHW: PropTypes.func,
  }

  componentDidUpdate () {
    if (!this.props.trezor.isFetched && !this.props.trezor.isFetching) {
      this.props.startTrezorSync()
      this.props.fetchAccount()
    }
  }

  componentWillUnmount () {
    this.props.stopTrezorSync()
  }

  _buildItem = (item, index) => {
    return (
      <div key={index}>
        <ListItem
          button
          type='submit'
          name='address'
          value={item}
          component='button'
          disableGutters
          style={{ margin: 0 }}
          onClick={() => this.props.navigateToCreateAccountFromHW(item)}
        >
          <ListItemText
            style={{ paddingLeft:"10px" }}
            disableTypography
            primary={
              <Typography
                type='body2'
                style={{ color: 'black', fontWeight: 'bold' }}
              >
                {item}
              </Typography>
            }
            secondary='eth 0'
          />
          <ChevronRight />
        </ListItem>
        <Divider light />
      </div>
    )
  }

  renderStates () {
    const { trezor } = this.props

    return trezorStates.map((item) =>
      trezor[ item.flag ]
        ? <div key={item.flag} />
        : (
          <div styleName='state' key={item.flag}>
            <div styleName='titleContent'>
              <div styleName='title'><Translate value={item.errorTitle} /></div>
              <div styleName='subtitle'><Translate value={item.errorTip} /></div>
            </div>
          </div>
        )
    )
  }

  render () {
    const { trezor, navigateBack, account } = this.props

    return (
      <div styleName='form'>
        <div styleName='page-title'>
          <Translate value='LoginWithTrezor.title' />
        </div>

        <div styleName='states'>
          {this.renderStates()}
        </div>

        {trezor.isFetched && (
          <div styleName='account'>
            <List component='nav' className='list'>
              {account.map(this._buildItem)}
            </List>
          </div>
        )}

        <div styleName='actions'>
          <Translate value='LoginWithMnemonic.or' />
          <br />
          <button onClick={navigateBack} styleName='link'>
            <Translate value='LoginWithMnemonic.back' />
          </button>
        </div>
      </div>
    )
  }
}

export default LoginTrezor
