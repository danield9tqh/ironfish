/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import bufio from 'bufio'
import { BlockHash, hashBlockHeader, RawBlockHeader } from '../primitives/blockheader'
import { TransactionVersion } from '../primitives/transaction'

export type ActivationSequence = number | 'never'

export type ConsensusParameters = {
  /**
   * When adding a block, the block can be this amount of seconds into the future
   * without rejecting it
   */
  allowedBlockFutureSeconds: number

  /**
   * The amount of coins in the genesis block
   */
  genesisSupplyInIron: number

  /**
   * The average time that all blocks should be mined
   */
  targetBlockTimeInSeconds: number

  /**
   * The time range when difficulty and target not change
   */
  targetBucketTimeInSeconds: number

  /**
   * Max block size
   */
  maxBlockSizeBytes: number

  /**
   * The minimum fee that a transaction must have to be accepted
   */
  minFee: number

  /**
   * The block height that enables the use of V2 transactions instead of V1
   */
  enableAssetOwnership: ActivationSequence

  /**
   * Before upgrade we have block timestamp smaller than previous block. After this
   * block we enforce the block timestamps in the sequential order as the block sequences.
   */
  enforceSequentialBlockTime: ActivationSequence
}

export class Consensus {
  readonly parameters: ConsensusParameters

  constructor(parameters: ConsensusParameters) {
    this.parameters = parameters
  }

  isActive(upgrade: ActivationSequence, sequence: number): boolean {
    if (upgrade === 'never') {
      return false
    }
    return Math.max(1, sequence) >= upgrade
  }

  getActiveTransactionVersion(sequence: number): TransactionVersion {
    if (this.isActive(this.parameters.enableAssetOwnership, sequence)) {
      return TransactionVersion.V2
    } else {
      return TransactionVersion.V1
    }
  }

  hashHeader(rawHeader: RawBlockHeader): BlockHash {
    const bw = bufio.write(180)
    bw.writeBigU64BE(rawHeader.randomness)
    bw.writeU32(rawHeader.sequence)
    bw.writeHash(rawHeader.previousBlockHash)
    bw.writeHash(rawHeader.noteCommitment)
    bw.writeHash(rawHeader.transactionCommitment)
    bw.writeBigU256BE(rawHeader.target.asBigInt())
    bw.writeU64(rawHeader.timestamp.getTime())
    bw.writeBytes(rawHeader.graffiti)

    const bytes = bw.render()
    return hashBlockHeader(bytes)
  }
}

export class TestnetConsensus extends Consensus {
  constructor(parameters: ConsensusParameters) {
    super(parameters)
  }
}
