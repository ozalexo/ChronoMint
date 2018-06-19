/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import PropTypes from 'prop-types'
import TokenModel from 'models/tokens/TokenModel'
import { Link } from 'react-router'
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { openSendForm, selectWallet } from 'redux/wallet/actions'
import { modalsOpen } from 'redux/modals/actions'
import { Translate } from 'react-redux-i18n'
import { TOKEN_ICONS } from 'assets'
import { DUCK_TOKENS } from 'redux/tokens/actions'
import Button from 'components/common/ui/Button/Button'
import IPFSImage from 'components/common/IPFSImage/IPFSImage'
import ReceiveTokenModal from 'components/dashboard/ReceiveTokenModal/ReceiveTokenModal'
import TokensCollection from 'models/tokens/TokensCollection'
import { getMainSymbolForBlockchain, getTokens } from 'redux/tokens/selectors'
import { BLOCKCHAIN_ETHEREUM } from 'dao/EthereumDAO'
import SendTokens from 'components/dashboard/SendTokens/SendTokens'
import DepositTokensModal from 'components/dashboard/DepositTokens/DepositTokensModal'
import { PTWallet } from 'redux/wallet/types'
import { getAccount } from 'redux/session/selectors'
import './WalletWidget.scss'
import { prefix } from './lang'
import Moment from '../../common/Moment'
import SubIconForWallet from '../SubIconForWallet/SubIconForWallet'
import WalletSettingsForm from '../AddWalletWidget/WalletSettingsForm/WalletSettingsForm'
import { getWalletInfo } from '../WalletWidgetMini/selectors'
import WalletMainCoinBalance from './WalletMainCoinBalance'
import WalletTokensList from './WalletTokensList'
import WalletName from '../WalletName/WalletName'

function makeMapStateToProps (state, ownProps) {
  const getWallet = getWalletInfo(ownProps.blockchain, ownProps.address)
  const mapStateToProps = (ownState) => {
    const tokens = getTokens(ownState)
    return {
      wallet: getWallet(ownState),
      token: tokens.item(getMainSymbolForBlockchain(ownProps.blockchain)),
      tokens: state.get(DUCK_TOKENS),
      account: getAccount(ownState),
    }
  }
  return mapStateToProps
}

function mapDispatchToProps (dispatch) {
  return {
    send: (token, wallet) => {
      dispatch(openSendForm({
        wallet,
        isModal: true,
        token,
        blockchain: wallet.blockchain,
        address: wallet.address,
      }, SendTokens))
    },
    receive: (blockchain) => dispatch(modalsOpen({
      component: ReceiveTokenModal,
      props: {
        blockchain,
      },
    })),
    deposit: (props) => dispatch(modalsOpen({ component: DepositTokensModal, props })),
    selectWallet: (blockchain, address) => dispatch(selectWallet(blockchain, address)),
    setWalletName: (wallet, blockchain, address) => dispatch(modalsOpen({
      component: WalletSettingsForm,
      props: {
        wallet,
        blockchain,
        address,
      },
    })),
  }
}

@connect(makeMapStateToProps, mapDispatchToProps)
export default class WalletWidget extends PureComponent {
  static propTypes = {
    account: PropTypes.string,
    setWalletName: PropTypes.func,
    blockchain: PropTypes.string,
    wallet: PTWallet,
    address: PropTypes.string,
    token: PropTypes.instanceOf(TokenModel),
    tokens: PropTypes.instanceOf(TokensCollection),
    walletInfo: PropTypes.shape({
      address: PropTypes.string,
      balance: PropTypes.number,
      tokens: PropTypes.array,
    }),
    send: PropTypes.func,
    receive: PropTypes.func,
    deposit: PropTypes.func,
    selectWallet: PropTypes.func,
    showGroupTitle: PropTypes.bool,
  }

  handleSend = (wallet) => () => {
    this.props.send(this.props.token.id(), wallet)
  }

  handleReceive = () => {
    this.props.receive(this.props.blockchain)
  }

  handleDeposit = () => {
    this.props.deposit()
  }

  handleSelectWallet = () => {
    const { address, blockchain } = this.props
    this.props.selectWallet(blockchain, address)
  }

  handleOpenSettings = () => {
    this.props.setWalletName(this.props.wallet, this.props.blockchain, this.props.address)
  }

  getOwnersList = () => {
    const ownersList = this.props.wallet.owners

    if (ownersList.length <= 3) {
      return (
        <div styleName='owners-amount'>
          <div styleName='owners-list'>
            {ownersList.map((ownerAddress) => {
              return (
                <div styleName='owner-icon' key={ownerAddress}>
                  <div styleName='owner' className='chronobank-icon' title={ownerAddress}>profile</div>
                </div>
              )
            })
            }
          </div>
        </div>
      )
    }

    return (
      <div styleName='owners-amount'>
        <div styleName='owners-list'>
          {ownersList.slice(0, 2).map((owner) => {
            return (
              <div styleName='owner-icon'>
                <div styleName='owner' className='chronobank-icon' title={owner.address()}>profile</div>
              </div>
            )
          })
          }
          <div styleName='owner-counter'>
            <div styleName='counter'>+{ownersList.length - 2}</div>
          </div>
        </div>
      </div>
    )
  }

  isMySharedWallet = () => {
    return this.props.wallet.isMultisig && !this.props.wallet.isTimeLocked && !this.props.wallet.is2FA
  }

  render () {
    const { address, token, blockchain, wallet, showGroupTitle, account } = this.props
    const tokenIsFetched = (token && token.isFetched())

    if (Array.isArray(wallet.owners) && !wallet.owners.includes(account)) {
      return null
    }

    return (
      <div styleName='header-container'>
        {showGroupTitle && <h1 styleName='header-text' id={blockchain}><Translate value={`${prefix}.walletTitle`} title={blockchain} /></h1>}
        <div styleName='wallet-list-container'>

          <div styleName='wallet-container'>
            {wallet.pendingCount > 0 && (
              <div styleName='pendings-container'>
                <div styleName='pendings-icon'><Translate value={`${prefix}.pending`} count={wallet.pendingCount} /></div>
              </div>
            )}
            <div styleName='settings-container'>
              <div styleName='settings-icon' className='chronobank-icon' onClick={this.handleOpenSettings}>settings
              </div>
            </div>
            <div styleName='token-container'>
              {blockchain === BLOCKCHAIN_ETHEREUM && <SubIconForWallet wallet={wallet} />}
              <div styleName='token-icon'>
                <IPFSImage styleName='image' multihash={token.icon()} fallback={TOKEN_ICONS[token.symbol()] || TOKEN_ICONS.DEFAULT} />
              </div>
            </div>
            <div styleName='content-container'>
              <Link styleName='addressWrapper' href='' to='/wallet' onClick={this.handleSelectWallet}>
                <div styleName='address-title'>
                  <h3><WalletName wallet={wallet} /></h3>
                  <span styleName='address-address'>{address}</span>
                </div>

                {token && token.isFetched()
                  ? <WalletMainCoinBalance wallet={wallet} />
                  : (
                    <span styleName='noToken'>
                      <Translate value={`${prefix}.tokenNotAvailable`} />
                    </span>
                  )}
              </Link>

              {this.isMySharedWallet() && this.getOwnersList()}

              {token && token.isFetched() && <WalletTokensList wallet={wallet} />}

              {wallet.isTimeLocked && (
                <div styleName='unlockDateWrapper'>
                  <Translate value={`${prefix}.unlockDate`} /> <Moment data={wallet.releaseTime} format='HH:mm, Do MMMM YYYY' />
                </div>
              )}

              <div styleName='actions-container'>
                <div styleName='action'>
                  <Button
                    disabled={!tokenIsFetched}
                    type='submit'
                    label={<Translate value={`${prefix}.sendButton`} />}
                    onClick={this.handleSend(wallet)}
                  />
                </div>
                <div styleName='action'>
                  <Button
                    disabled={!tokenIsFetched}
                    type='submit'
                    label={<Translate value={`${prefix}.receiveButton`} />}
                    onClick={this.handleReceive}
                  />
                </div>
                {/*blockchain === BLOCKCHAIN_ETHEREUM && (
                  <div styleName='action'>
                    <Button
                      disabled={false}
                      flat
                      type='submit'
                      label={<Translate value={`${prefix}.depositButton`} />}
                      onClick={this.handleDeposit}
                    />
                  </div>
                )*/}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}