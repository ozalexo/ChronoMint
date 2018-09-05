import uuid from 'uuid/v1'
import BigNumber from 'bignumber.js'
import coinselect from 'coinselect'
import bitcoin from 'bitcoinjs-lib'
import { TxEntryModel, TxExecModel } from '../../models'
import {
  BLOCKCHAIN_BITCOIN,
  BLOCKCHAIN_BITCOIN_CASH,
  BLOCKCHAIN_BITCOIN_GOLD,
  BLOCKCHAIN_LITECOIN,
} from '../../dao/constants'

/**
 * Create new TxEntryModel from provided data
 * @param {Object} entry - TODO
 * @param {Object} options - TODO
 * @return {TxEntryModel}
 */
export const createBitcoinTxEntryModel = (entry, options = {}) =>
  new TxEntryModel({
    key: uuid(),
    isSubmitted: true,
    isAccepted: false,
    walletDerivedPath: options && options.walletDerivedPath,
    symbol: options && options.symbol,
    ...entry,
  })

/**
 * Get unused exits to create new transaction
 * @param {string} to - recipient's address
 * @param {BigNumber} amount - amount of tokens to be sent
 * @param {number} feeRate - fee rate, obviously.
 * @param {Object} utxos - unused exits from current block which will be used
 */
export const selectCoins = (to, amount: BigNumber, feeRate, utxos) => {
  const targets = [
    {
      address: to,
      value: amount.toNumber(),
    },
  ]
  const utxosArray = utxos.map((output) => ({
    txId: output.txid,
    vout: output.vout,
    value: Number.parseInt(output.satoshis),
  }))

  // An unspent transaction output (UTXO) selection
  const { inputs, outputs, fee } = coinselect(utxosArray, targets, Math.ceil(feeRate))

  // TODO: need to process a case, if some of inputs, outputs or fee is undefined... Here or outside
  return { inputs, outputs, fee }
}

// Method was moved from privateKeyProvider
export const createBitcoinWalletFromPK = (privateKey, network) => {
  const keyPair = new bitcoin.ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'), { network })
  return {
    keyPair,
    getNetwork () {
      return keyPair.network
    },
    getAddress () {
      const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network })
      return address
    },
  }
}

export const getBtcFee = (
  recipient,
  amount,
  formFee,
  utxos,
) => {
  const { fee } = selectCoins(recipient, amount, formFee, utxos)
  return fee
}

const describeBitcoinTransaction = (tx, options, utxos) => {
  const { to, from, value } = tx
  const { feeRate, blockchain, network } = options
  const bitcoinNetwork = bitcoin.networks[network[blockchain]]
  const { inputs, outputs, fee } = selectCoins(to, value, feeRate, utxos)

  if (!inputs || !outputs) {
    throw new Error(`Cannot describe ${blockchain} transaction. Bad transaction data.`)
  }

  const txb = new bitcoin.TransactionBuilder(bitcoinNetwork)
  for (const input of inputs) {
    txb.addInput(input.txId, input.vout)
  }

  for (const output of outputs) {
    if (!output.address) {
      output.address = from
    }
    txb.addOutput(output.address, output.value)
  }

  return {
    tx: txb,
    inputs,
    outputs,
    fee,
  }
}

export const signBitcoinInputs = (txb, inputs, signer) => {
  for (let i = 0; i < inputs.length; i++) {
    txb.sign(i, signer.keyPair)
  }
}

export const signBitcoinCashInputs = (txb, inputs, from) => {
  txb.enableBitcoinCash(true)
  txb.setVersion(2)

  const hashType = bitcoin.Transaction.SIGHASH_ALL | bitcoin.Transaction.SIGHASH_BITCOINCASHBIP143
  const wallet = this._walletsMap[from] || this._wallet

  for (let i = 0; i < inputs.length; i++) {
    txb.sign(i, wallet.keyPair, null, hashType, inputs[i].value)
  }
}

export const signBitcoinGoldInputs = (txb, inputs, from) => {
  txb.enableBitcoinGold(true)
  txb.setVersion(2)

  const hashType = bitcoin.Transaction.SIGHASH_ALL | bitcoin.Transaction.SIGHASH_BITCOINCASHBIP143
  const wallet = this._walletsMap[from] || this._wallet

  for (let i = 0; i < inputs.length; i++) {
    txb.sign(i, wallet.keyPair, null, hashType, inputs[i].value)
  }
}

export const signLitecoinInputs = null // not specified

export const signInputsMap = {
  [BLOCKCHAIN_BITCOIN]: signBitcoinInputs,
  [BLOCKCHAIN_BITCOIN_CASH]: signBitcoinCashInputs,
  [BLOCKCHAIN_BITCOIN_GOLD]: signBitcoinGoldInputs,
  [BLOCKCHAIN_LITECOIN]: signLitecoinInputs,
}

export const prepareBitcoinTransaction = (tx, token, network, utxos, feeMultiplier = 1, satPerByte = null) => () => {
  const tokenRate = satPerByte || token.feeRate() // TODO: What if satPerByte will be zero (not null)?
  const options = {
    from: tx.from,
    feeRate: new BigNumber(tokenRate).mul(feeMultiplier),
    blockchain: token.blockchain(),
    network,
  }
  const prepared = describeBitcoinTransaction(tx, options, utxos)

  return new TxExecModel({
    from: tx.from,
    to: tx.to,
    amount: new BigNumber(tx.value),
    fee: new BigNumber(prepared.fee),
    prepared: prepared.tx,
    inputs: prepared.inputs,
    outputs: prepared.outputs,
  })
}
