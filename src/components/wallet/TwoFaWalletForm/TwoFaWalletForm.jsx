/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import { Button } from 'components'
import web3Converter from 'utils/Web3Converter'
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { Translate } from 'react-redux-i18n'
import { Slider } from 'redux-form-material-ui'
import { Field, reduxForm } from 'redux-form/immutable'
import { ETH, FEE_RATE_MULTIPLIER } from 'redux/mainWallet/actions'
import PropTypes from 'prop-types'
import TWO_FA_LOGO_PNG from 'assets/img/2fa/2-fa.png'
import TokenValue from 'components/common/TokenValue/TokenValue'
import Amount from 'models/Amount'
import { prefix } from './lang'
import './TwoFaWalletForm.scss'

export const FORM_2FA_WALLET = 'Form2FAWallet'

function mapDispatchToProps (dispatch) {
  return {}
}

function mapStateToProps (state, ownProps) {

  return {}
}

@connect(mapStateToProps, mapDispatchToProps)
@reduxForm({ form: FORM_2FA_WALLET })
export default class TwoFaWalletForm extends PureComponent {
  static propTypes = {
    feeMultiplier: PropTypes.number,
  }

  static defaultProps = {
    feeMultiplier: 1,
  }

  constructor () {
    super(...arguments)

    this.state = {
      gasFee: new Amount(10000000000000, ETH),
    }
  }

  render () {
    return (
      <div styleName='root'>
        <div styleName='img'><img src={TWO_FA_LOGO_PNG} alt='2 fa logo' /></div>
        <div styleName='title'><Translate value={`${prefix}.title`} /></div>
        <div styleName='description'><Translate value={`${prefix}.description`} /></div>
        <div styleName='slider'>
          <div styleName='tagsWrap'>
            <div><Translate value={`${prefix}.slow`} /></div>
            <div><Translate value={`${prefix}.fast`} /></div>
          </div>
          <Field
            component={Slider}
            sliderStyle={{ marginBottom: 0, marginTop: 5 }}
            name='feeMultiplier'
            {...FEE_RATE_MULTIPLIER}
          />
        </div>

        <div styleName='transactionFee'>
          <span styleName='title'>
            <Translate value={`${prefix}.transactionFee`} />
          </span> &nbsp;
          <span styleName='description'>
            {this.state.gasFee && (
              <span>{`ETH ${web3Converter.fromWei(this.state.gasFee, 'wei').toString()} (≈USD `}
                <TokenValue renderOnlyPrice onlyPriceValue value={this.state.gasFee} />{')'}
              </span>
            )}
            <div styleName='gweiMultiplier'>
              <Translate value={`${prefix}.averageFee`} multiplier={this.props.feeMultiplier} />
            </div>
          </span>
        </div>

        <div styleName='actions'>
          <Button
            label={<Translate value={`${prefix}.proceed`} />}
          />
        </div>
      </div>
    )
  }
}
