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

export const createBitcoinTxEntryModel = (entry, options = {}) =>
  new TxEntryModel({
    key: uuid(),
    isSubmitted: true,
    isAccepted: false,
    walletDerivedPath: options && options.walletDerivedPath,
    symbol: options && options.symbol,
    ...entry,
  })

export const describeTransaction = (to, amount: BigNumber, feeRate, utxos) => {
  const targets = [
    {
      address: to,
      value: amount.toNumber(),
    },
  ]
  const { inputs, outputs, fee } = coinselect(utxos.map((output) => {
    return {
      txId: output.txid,
      vout: output.vout,
      value: Number.parseInt(output.satoshis),
    }
  }), targets, Math.ceil(feeRate))

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

export const getBtcFee = async (
  {
    address,
    recipient,
    amount,
    formFee,
    blockchain,
    network,
  }) => {
  try {
    const { data } = await getUtxos(address, { blockchain, type: network[blockchain] })
    const { fee } = describeTransaction(recipient, amount, formFee, data)
    return fee
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    throw new Error(e)
  }
}

export const describeBitcoinTransaction = async (tx, options) => {
  const { to, from, value } = tx
  const { feeRate, blockchain, network } = options
  const bitcoinNetwork = bitcoin.networks[network[blockchain]]
  const { data } = await getUtxos(from, { blockchain, type: network[blockchain] })
  const { inputs, outputs, fee } = describeTransaction(to, value, feeRate, data)

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

export const signInputsMap = {

  // Bitcoin
  [BLOCKCHAIN_BITCOIN]: (txb, inputs, signer) => {
    for (let i = 0; i < inputs.length; i++) {
      txb.sign(i, signer.keyPair)
    }
  },

  // Bitcoin Cash
  [BLOCKCHAIN_BITCOIN_CASH]: (txb, inputs, from) => {
    txb.enableBitcoinCash(true)
    txb.setVersion(2)

    const hashType = bitcoin.Transaction.SIGHASH_ALL | bitcoin.Transaction.SIGHASH_BITCOINCASHBIP143
    const wallet = this._walletsMap[from] || this._wallet

    for (let i = 0; i < inputs.length; i++) {
      txb.sign(i, wallet.keyPair, null, hashType, inputs[i].value)
    }
  },

  // Bitcoin Gold
  [BLOCKCHAIN_BITCOIN_GOLD]: (txb, inputs, from) => {
    txb.enableBitcoinGold(true)
    txb.setVersion(2)

    const hashType = bitcoin.Transaction.SIGHASH_ALL | bitcoin.Transaction.SIGHASH_BITCOINCASHBIP143
    const wallet = this._walletsMap[from] || this._wallet

    for (let i = 0; i < inputs.length; i++) {
      txb.sign(i, wallet.keyPair, null, hashType, inputs[i].value)
    }
  },

  // Litecoin
  [BLOCKCHAIN_LITECOIN]: null, // not specified
}

export const prepareBitcoinTransaction = (tx,  token, network, feeMultiplier = 1, satPerByte = null) => async () => {
  // const state = getState()
  // const token = getToken(symbol)(state)
  const tokenRate = satPerByte ? satPerByte : token.feeRate()
  // const network = getSelectedNetwork()(state)
  const prepared = await describeBitcoinTransaction(
    tx.to,
    tx.value,
    {
      from: tx.from,
      feeRate: new BigNumber(tokenRate).mul(feeMultiplier),
      blockchain: token.blockchain(),
      network,
    })

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
