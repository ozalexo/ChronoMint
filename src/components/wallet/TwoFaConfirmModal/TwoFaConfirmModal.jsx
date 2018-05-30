/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import { Button, ModalDialog } from 'components'
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { Translate } from 'react-redux-i18n'
import { TextField } from 'redux-form-material-ui'
import { Field, formPropTypes, reduxForm, formValueSelector } from 'redux-form/immutable'
import { confirm2FATransfer } from 'redux/multisigWallet/actions'
import PropTypes from 'prop-types'
import MultisigWalletModel from 'models/wallet/MultisigWalletModel'
import MultisigWalletPendingTxModel from 'models/wallet/MultisigWalletPendingTxModel'
import Preloader from 'components/common/Preloader/Preloader'
import { prefix } from './lang'
import './TwoFaConfirmModal.scss'
import validate from './validate'

export const FORM_2FA_CONFIRM = 'Form2FAConfirm'

function mapStateToProps (state) {
  const selector = formValueSelector(FORM_2FA_CONFIRM)
  const confirmToken = selector(state, 'confirmToken')
  return {
    confirmToken,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    confirm2FATransfer: (txAddress, walletAddress, confirmToken, callback) => dispatch(confirm2FATransfer(txAddress, walletAddress, confirmToken, callback)),
  }
}

@connect(mapStateToProps, mapDispatchToProps)
@reduxForm({ form: FORM_2FA_CONFIRM, validate })
export default class TwoFaConfirmModal extends PureComponent {
  static propTypes = {
    confirm2FATransfer: PropTypes.func,
    wallet: PropTypes.instanceOf(MultisigWalletModel),
    tx: PropTypes.instanceOf(MultisigWalletPendingTxModel),
    ...formPropTypes,
  }

  constructor (props) {
    super(props)
    this.state = {
      isLoading: false,
    }
  }

  handleCheckConfirmCode = () => {
    const { confirm2FATransfer, tx, wallet, confirmToken } = this.props
    this.setState({ isLoading: true, success: null })
    confirm2FATransfer(tx.id(), wallet.address(), confirmToken, (data) => {
      // eslint-disable-next-line
      console.log('data', data)
      let newState = { isLoading: false, success: false }
      this.setState(newState)
    })
  }

  render () {
    return (
      <ModalDialog title={<Translate value={`${prefix}.title`} />}>
        <form styleName='root' onSubmit={this.props.handleSubmit}>
          <div styleName='body'>
            <div styleName='description'><Translate value={`${prefix}.description`} /></div>
            <div styleName='field'>
              {!this.state.isLoading ? (
                <Field
                  component={TextField}
                  name='confirmToken'
                  floatingLabelText={<Translate value={`${prefix}.authCode`} />}
                />
              ) : (
                <div><Preloader /></div>
              )}
              {this.state.success === false && <div styleName='wrongCode'><Translate value={`${prefix}.confirmCodeWrong`} /></div>}
            </div>
          </div>
          <div styleName='actions'>
            <Button
              onTouchTap={this.handleCheckConfirmCode}
              label={<Translate value={`${prefix}.confirm`} />}
            />
          </div>
        </form>
      </ModalDialog>
    )
  }
}
