/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import Login from '@chronobank/login/redux/ducks'
import * as assetsManager from '@chronobank/core/redux/assetsManager'
import * as drawer from './drawer'
import * as exchange from '@chronobank/core/redux/exchange'
import * as locs from '@chronobank/core/redux/locs'
import * as mainWallet from '@chronobank/core/redux/mainWallet'
import * as market from '@chronobank/core/redux/market'
import * as modals from './modals'
import * as sides from './sides'
import * as multisigWallet from '@chronobank/core/redux/multisigWallet'
import * as notifier from '@chronobank/core/redux/notifier'
import * as operations from '@chronobank/core/redux/operations'
import * as rewards from '@chronobank/core/redux/rewards'
import * as session from '@chronobank/core/redux/session'
import * as settings from '@chronobank/core/redux/settings'
import * as ui from './ui'
import * as voting from '@chronobank/core/redux/voting'
import * as wallet from '@chronobank/core/redux/wallet'
import * as watcher from '@chronobank/core/redux/watcher'
import * as tokens from '@chronobank/core/redux/tokens'
import * as assetsHolder from '@chronobank/core/redux/assetsHolder'

export default {
  ui,
  modals,
  sides,
  drawer,
  session,
  locs,
  voting,
  wallet,
  mainWallet,
  multisigWallet,
  rewards,
  exchange,
  settings,
  notifier,
  operations,
  watcher,
  market,
  assetsManager,
  tokens,
  assetsHolder,
  ...Login,
}
