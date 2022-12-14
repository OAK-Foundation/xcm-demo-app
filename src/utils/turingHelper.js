import BN from 'bn.js';
import { rpc } from '@imstar15/types';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { u8aToHex } from '@polkadot/util';
import { env, chainConfig } from './constants';

const { MANGATA_PARA_ID } = env;

class TuringHelper {
  initialize = async (endpoint) => {
    const api = await ApiPromise.create({ provider: new WsProvider(endpoint), rpc });
    this.api = api;
  };

  getApi = () => this.api;

  getBalance = async (address) => {
    // Retrieve the account balance & nonce via the system module
    const { data: balance } = await this.api.query.system.account(address);

    return balance;
  };

  getProxyAddressMangata = (address) => {
    const keyring = new Keyring();
    const mangataAddress = keyring.encodeAddress(address, chainConfig.mangata.ss58);

    const location = {
      parents: 1,
      interior: {
        X2: [
          { Parachain: MANGATA_PARA_ID },
          {
            AccountId32: {
              network: 'Any',
              id: keyring.decodeAddress(mangataAddress),
            },
          },
        ],
      },
    };

    const multilocation = this.api.createType('XcmV1MultiLocation', location);

    const toHash = new Uint8Array([
      ...new Uint8Array([32]),
      ...new TextEncoder().encode('multiloc'),
      ...multilocation.toU8a(),
    ]);

    const proxyAccount = u8aToHex(this.api.registry.hash(toHash).slice(0, 32));
    return proxyAccount;
  };

  /**
   * Get XCM fees
   * Fake sign the call in order to get the combined fees from Turing.
   * Turing xcmpHandler_fees RPC requires the encoded call in this format.
   * Fees returned include inclusion, all executions, and XCMP fees to run on Target Chain.
   * @param {*} address
   * @param {*} xcmpCall
   * @returns
   */
  getXcmFees = async (address, xcmpCall) => {
    const fakeSignedXcmpCall = xcmpCall.signFake(address, {
      blockHash: this.api.genesisHash,
      genesisHash: this.api.genesisHash,
      nonce: 100, // does not except negative?
      runtimeVersion: this.api.runtimeVersion,
    });

    const fees = await this.api.rpc.xcmpHandler.fees(fakeSignedXcmpCall.toHex());
    return fees;
  };

  xcmSend = async (dest, message) => {
    console.log('xcmSend,', dest, message);

    return new Promise(async (resolve) => {
      const unsub = await this.api.tx.polkadotXcm.send(dest, message).signAndSend(keyPair, { nonce: -1 }, async ({ status }) => {
        if (status.isInBlock) {
          console.log(`Successful with hash ${status.asInBlock.toHex()}`);

          unsub();
          resolve();
        } else {
          console.log(`Status: ${status.type}`);
        }
      });
    });
  };

  sendXcmExtrinsic = async (xcmpCall, keyPair, taskId) => new Promise((resolve) => {
    const send = async () => {
      const unsub = await xcmpCall.signAndSend(keyPair, { nonce: -1 }, async ({ status }) => {
        console.log(`Status: ${status.type}`);
        if (status.isInBlock) {
          console.log(`Successful with hash ${status.asInBlock.toHex()}`);

          // Get Task
          const task = await this.api.query.automationTime.accountTasks(keyPair.address, taskId);
          console.log('Task:', task.toHuman());

          unsub();
          resolve(status.asInBlock.toHex());
        }
      });
    };

    send();
  });
}

export default new TuringHelper();
