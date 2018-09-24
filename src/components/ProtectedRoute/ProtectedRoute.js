/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import React, { PureComponent } from 'react'
import { getIsSession } from '@chronobank/core/redux/session/selectors'
import { connect } from 'react-redux'
import { Route, Redirect } from 'react-router-dom'

function mapStateToProps (state) {
  return {
    isLoggedIn: getIsSession(state),
  }
}

class ProtectedRoute extends PureComponent {
  render () {
    console.log('################## PRIVATE ROUTE RENDER', this.props)
    const { isLoggedIn, component: Component, ...rest } = this.props

    if (isLoggedIn) {
      return (
        <Route
          {...rest}
          component={Component}
        />
      )
    }

    console.log('################## REDIRECT TO LOGIN')
    return (
      <Redirect to='/login' />
    )
  }
}

export default connect(mapStateToProps)(ProtectedRoute)
