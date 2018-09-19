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
  renderComponent = (props) => {
    console.log('=== COMPONENT')
    const { component: Component } = this.props

    return <Component {...props} />
  }

  renderRedirect = (props) => {
    console.log('=== REDIRECT')

    return (
      <Redirect
        to={{
          pathname: '/login',
          state: {
            from: props.location,
          },
        }}
      />
    )
  }

  render () {
    const { isLoggedIn, component, ...rest } = this.props

    console.log('=== RENDER')

    return (
      <Route
        {...rest}
        render={(props) => console.log('HAHAHAH', props)}
      />
    )
  }
}

export default connect(mapStateToProps)(ProtectedRoute)
