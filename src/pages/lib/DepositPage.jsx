/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import { CSSTransitionGroup } from 'react-transition-group'
import DepositContent from 'layouts/partials/DepositContent/DepositContent'
import React, { PureComponent } from 'react'

import './DepositPage.scss'

export default class DepositPage extends PureComponent {
  render () {
    return (
      <div styleName='root'>
        <CSSTransitionGroup
          transitionName='transition-opacity'
          transitionAppear
          transitionAppearTimeout={250}
          transitionEnterTimeout={250}
          transitionLeaveTimeout={250}
        >
          <DepositContent />
        </CSSTransitionGroup>
      </div>
    )
  }
}
