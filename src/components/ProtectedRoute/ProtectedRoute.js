/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { Route, Redirect } from 'react-router-dom'
import { DUCK_SESSION } from '@chronobank/core/redux/session/constants'

function mapStateToProps (state) {
  return {
    isLoggedIn: state.get(DUCK_SESSION).isSession,
  }
}

class ProtectedRoute extends PureComponent {
  render () {
    const { isLoggedIn, component, location, ...rest } = this.props

    if (isLoggedIn) {
      return (
        <Route
          {...rest}
          location={location}
          component={component}
        />
      )
    }

    return (
      <Redirect
        to={{
          pathname: '/login',
          state: {
            from: location,
          },
        }}
      />
    )
  }
}

export default connect(mapStateToProps)(ProtectedRoute)