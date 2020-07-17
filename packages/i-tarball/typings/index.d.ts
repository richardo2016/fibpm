/// <reference types="@fibjs/types" />
declare class ByteStream {
    bytes: Uint8Array;
    ptr: number;
    /**
     * This object allows you to peek and consume bytes as numbers and strings
     * out of an ArrayBuffer.  In this buffer, everything must be byte-aligned.
     *
     * @param {ArrayBuffer} ab The ArrayBuffer object.
     * @param {number=} opt_offset The offset into the ArrayBuffer
     * @param {number=} opt_length The length of this BitStream
     * @constructor
     */
    constructor(ab: ArrayBufferLike, opt_offset?: number, opt_length?: number);
    /**
     * Peeks at the next n bytes as an unsigned number but does not advance the
     * pointer
     * TODO: This apparently cannot read more than 4 bytes as a number?
     * @param {number} n The number of bytes to peek at.
     * @return {number} The n bytes interpreted as an unsigned number.
     */
    peekNumber(n: number): number;
    /**
     * Returns the next n bytes as an unsigned number (or -1 on error)
     * and advances the stream pointer n bytes.
     * @param {number} n The number of bytes to read.
     * @return {number} The n bytes interpreted as an unsigned number.
     */
    readNumber(n: number): number;
    /**
     * Returns the next n bytes as a signed number but does not advance the
     * pointer.
     * @param {number} n The number of bytes to read.
     * @return {number} The bytes interpreted as a signed number.
     */
    peekSignedNumber(n: number): number;
    /**
     * Returns the next n bytes as a signed number and advances the stream pointer.
     * @param {number} n The number of bytes to read.
     * @return {number} The bytes interpreted as a signed number.
     */
    readSignedNumber(n: number): number;
    /**
     * This returns n bytes as a sub-array, advancing the pointer if movePointers
     * is true.
     * @param {number} n The number of bytes to read.
     * @param {boolean} movePointers Whether to move the pointers.
     * @return {Uint8Array} The subarray.
     */
    peekBytes(n: number, movePointers: boolean): Uint8Array;
    /**
     * Reads the next n bytes as a sub-array.
     * @param {number} n The number of bytes to read.
     * @return {Uint8Array} The subarray.
     */
    readBytes(n: number): Uint8Array;
    /**
     * Peeks at the next n bytes as a string but does not advance the pointer.
     * @param {number} n The number of bytes to peek at.
     * @return {string} The next n bytes as a string.
     */
    peekString(n: number): string;
    /**
     * Returns the next n bytes as an ASCII string and advances the stream pointer
     * n bytes.
     * @param {number} n The number of bytes to read.
     * @return {string} The next n bytes as a string.
     */
    readString(n: number): string;
}
declare class TarLocalFile {
    isValid: boolean;
    name: string;
    mode: string;
    uid: string;
    gid: string;
    size: number;
    number: string;
    mtime: string;
    chksum: string;
    typeflag: any;
    linkname: string;
    maybeMagic: string;
    version: string;
    uname: string;
    gname: string;
    devmajor: string;
    devminor: string;
    prefix: string;
    filename: string;
    fileData: Uint8Array;
    constructor(bstream: ByteStream);
}
export declare function validateSha1(tgz: Class_Buffer, shasum: string): boolean;
export declare function untar(arrayBuffer: ArrayBuffer): TarLocalFile[];
export declare function resolveTarballBuffer(tgz: Class_Buffer): Class_Buffer;
declare function mkdirp(inputp: string): void;
export declare const ensureDirectoryExisted: typeof mkdirp;
export declare function getArchiveRootName(tarLocalFiles: TarLocalFile[]): string;
export declare function extractTarLocalFiles(tarLocalFiles: TarLocalFile[], destDirname: string): boolean;
export {};
