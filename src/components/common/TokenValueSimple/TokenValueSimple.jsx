/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import Amount from '@chronobank/core/models/Amount'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { Translate } from 'react-redux-i18n'
import { connect } from 'react-redux'
import { DUCK_TOKENS } from '@chronobank/core/redux/tokens/constants'
import { integerWithDelimiter } from '@chronobank/core/utils/formatter'
import TokensCollection from '@chronobank/core/models/tokens/TokensCollection'

const mapStateToProps = (state) => {
  return {
    tokens: state.get(DUCK_TOKENS),
  }
}

@connect(mapStateToProps, null)
class TokenValueSimple extends PureComponent {
  static propTypes = {
    value: PropTypes.instanceOf(Amount),
    tokens: PropTypes.instanceOf(TokensCollection),
    withFraction: PropTypes.bool,
    fractionPrecision: PropTypes.number,
  }

  static defaultProps = {
    withFraction: false,
    fractionPrecision: 2,
  }

  render () {
    const { value, tokens, withFraction, fractionPrecision } = this.props

    if (!value) {
      return null
    }

    const token = tokens.item(value.symbol())

    if (token.isFetched()) {
      const valueWithoutDecimals = token.removeDecimals(value)
      return <span>{integerWithDelimiter(valueWithoutDecimals, withFraction, fractionPrecision)}</span>
    } else {
      return <span><Translate value='tokenNotAvailable' /></span>
    }
  }
}

export default TokenValueSimple
