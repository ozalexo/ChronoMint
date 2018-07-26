/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import Immutable from 'immutable'
// import { globalWatcher } from '@chronobank/core/redux/watcher/actions'
import { SESSION_DESTROY } from '@chronobank/core/redux/session/actions'
import { combineReducers } from 'redux-immutable'
import { applyMiddleware, compose, createStore } from 'redux'
import { createLogger } from 'redux-logger'
import { composeWithDevTools } from 'redux-devtools-extension'
import { persistStore } from 'redux-persist-immutable'
import { reducer as formReducer } from 'redux-form/immutable'
import { DUCK_I18N, loadI18n } from 'redux/i18n/actions'
import { I18n, i18nReducer, loadTranslations, setLocale } from '@chronobank/core-dependencies/i18n'
import moment from 'moment'
import saveAccountMiddleWare from '@chronobank/core/redux/session/saveAccountMiddleWare'
import thunk from 'redux-thunk'
import ls from '@chronobank/core-dependencies/utils/LocalStorage'
import * as ducks from './ducks'
import routingReducer from './routing'
import transformer from './serialize'
import createHistory, { historyMiddleware } from './browserHistoryStore'
import translations from '../i18n'

// eslint-disable-next-line no-unused-vars
let i18nJson // declaration of a global var for the i18n object for a standalone version

const getNestedReducers = (ducks) => {
  let reducers = {}
  Object
    .entries(ducks)
    .forEach(([key, entry]) => {
      reducers = {
        ...reducers,
        ...(typeof (entry) === 'function'
          ? { [key]: entry }
          : getNestedReducers(entry)
        ),
      }
    })
  return reducers
}

const configureStore = () => {
  const initialState = new Immutable.Map()

  const appReducer = combineReducers({
    form: formReducer,
    i18n: i18nReducer,
    routing: routingReducer,
    ...getNestedReducers(ducks),
  })

  const rootReducer = (state, action) => {

    if (action.type === SESSION_DESTROY) {
      const i18nState = state.get('i18n')
      const mainWalletsState = state.get('mainWallet')
      const walletsState = state.get('multisigWallet')
      const persistAccount = state.get('persistAccount')
      state = new Immutable.Map()
      state = state
        .set('i18n', i18nState)
        .set('multisigWallet', walletsState)
        .set('mainWallet', mainWalletsState)
        .set('persistAccount', persistAccount)
    }
    return appReducer(state, action)
  }

  const isDevelopmentEnv = process.env.NODE_ENV === 'development'
  const composeEnhancers = isDevelopmentEnv
    ? composeWithDevTools({ realtime: true })
    : compose
  const middleware = [
    thunk,
    historyMiddleware,
    saveAccountMiddleWare,
  ]

  if (isDevelopmentEnv) {
    const IGNORED_ACTIONS = [
      'mainWallet/TOKEN_BALANCE',
      'market/UPDATE_LAST_MARKET',
      'market/UPDATE_PRICES',
      'market/UPDATE_RATES',
      'tokens/fetched',
      'wallet/updateBalance',
    ]
    const logger = createLogger({
      collapsed: true,
      predicate: (getState, action) => !IGNORED_ACTIONS.includes(action.type),
    })
    // Note: logger must be the last middleware in chain, otherwise it will log thunk and promise, not actual actions
    middleware.push(logger)
  }

  // noinspection JSUnresolvedVariable,JSUnresolvedFunction
  const createStoreWithMiddleware = composeEnhancers(
    applyMiddleware(
      ...middleware
    )
  )(createStore)

  return createStoreWithMiddleware(
    rootReducer,
    initialState,
  )
}

export const store = configureStore()
// store.dispatch(globalWatcher())

const persistorConfig = {
  key: 'root',
  whitelist: ['multisigWallet', 'mainWallet', 'persistAccount', 'wallets'],
  transforms: [transformer()],
}

store.__persistor = persistStore(store, persistorConfig)

export const history = createHistory(store)

// syncTranslationWithStore(store) relaced with manual configuration in the next 6 lines
I18n.setTranslationsGetter(() => store.getState().get(DUCK_I18N).translations)
I18n.setLocaleGetter(() => store.getState().get(DUCK_I18N).locale)

const locale = ls.getLocale()
// set moment locale
moment.locale(locale)

store.dispatch(loadTranslations(translations))
store.dispatch(setLocale(locale))

// load i18n from the public site
store.dispatch(loadI18n(locale))
/** <<< i18n END */
