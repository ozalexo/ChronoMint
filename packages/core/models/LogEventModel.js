/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import PropTypes from 'prop-types'
import Amount from './Amount'

import AbstractModel from './AbstractModel'

const schemaFactory = () => ({
  key: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  category: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(null)]),
  date: PropTypes.instanceOf(Date).isRequired,
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(null)]),
  title: PropTypes.string.isRequired,
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(null)]),
  amountTitle: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(null)]),
  isAmountSigned: PropTypes.bool,
  amount: PropTypes.oneOfType([Amount, PropTypes.instanceOf(null)]),
  target: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(null)]),
})

export default class LogEventModel extends AbstractModel {
  constructor (data, options) {
    super(data, schemaFactory(), options)
    Object.freeze(this)
  }
}
