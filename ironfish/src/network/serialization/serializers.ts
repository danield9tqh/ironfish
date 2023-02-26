/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import bufio from 'bufio'
import { BigIntUtils } from '../../utils/bigint'

export interface Serializable {
  size(): number
  write(bw: bufio.StaticWriter): void
}

export class U32 implements Serializable {
  value: number

  constructor(value: number) {
    this.value = value
  }

  size(): number {
    return 4
  }

  write(bw: bufio.StaticWriter): void {
    bw.writeU32(this.value)
  }
}

export class U64 implements Serializable {
  readonly value: number

  constructor(value: number) {
    this.value = value
  }

  size(): number {
    return 8
  }

  write(bw: bufio.StaticWriter): void {
    bw.writeU64(this.value)
  }
}

export class Hash implements Serializable {
  readonly value: string | Buffer

  constructor(value: string | Buffer) {
    this.value = value
  }

  size(): number {
    return 32
  }

  write(bw: bufio.StaticWriter): void {
    bw.writeHash(this.value)
  }
}

export class BigInt implements Serializable {
  readonly value: bigint
  readonly _size: number

  constructor(value: bigint, size: number) {
    this.value = value
    this._size = size
  }

  size(): number {
    return this._size
  }

  write(bw: bufio.StaticWriter): void {
    bw.writeBytes(BigIntUtils.toBytesLE(this.value, this._size))
  }
}

export class List implements Serializable {
  readonly values: Serializable[]

  constructor(...values: Serializable[]) {
    this.values = values
  }

  size(): number {
    return this.values.reduce((sum, value) => value.size() + sum, 0)
  }

  write(bw: bufio.StaticWriter): void {
    this.values.forEach((value) => {
      value.write(bw)
    })
  }
}

export function serialize<T extends Serializable>(item: T): Buffer {
  const bw = bufio.write(item.size())
  item.write(bw)
  return bw.render()
}
