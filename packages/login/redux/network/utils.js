/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 *
 * @flow
 */

// @todo remove this file and method usage. MINT-1924
/* eslint-disable import/prefer-default-export */
export const getPrivateKeyFromBlockchain = (blockchain: string) => {
  switch (blockchain) {
    // case 'Ethereum':
    //   return ethereumProvider.getPrivateKey()
    // case 'Bitcoin':
    //   return btcProvider.getPrivateKey()
    // case 'Litecoin':
    //   return ltcProvider.getPrivateKey()
    // case 'NEM':
    //   return nemProvider.getPrivateKey()
    default:
      return null
  }
}