/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import { CSSTransitionGroup } from 'react-transition-group'
import PollContent from 'layouts/partials/PollContent/PollContent'
import React, { Component } from 'react'

export default class VotingPage extends Component {
  render () {
    return (
      <div>
        <CSSTransitionGroup
          transitionName='transition-opacity'
          transitionAppear
          transitionAppearTimeout={250}
          transitionEnterTimeout={250}
          transitionLeaveTimeout={250}
        >
          <PollContent />
        </CSSTransitionGroup>
      </div>
    )
  }
}
