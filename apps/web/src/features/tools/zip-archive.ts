/**
 * Lightweight, zero-dependency ZIP archive generator for browser usage.
 * Generates valid standard PKZIP archives using the STORE method (uncompressed),
 * which is ideal for pre-compressed formats like PNG, WebP, JPEG, and text files.
 */

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    const byte = data[i] ?? 0;
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
  readonly name: string;
  readonly data: Uint8Array;
}

/**
 * Creates a standard ZIP archive from an array of file entries.
 * Returns a Blob with MIME type "application/zip".
 */
export function createZipArchive(entries: readonly ZipEntry[]): Blob {
  const encoder = new TextEncoder();
  const fileParts: Uint8Array[] = [];
  const centralDirectoryParts: Uint8Array[] = [];
  let currentOffset = 0;

  // Current DOS date/time for timestamp
  const now = new Date();
  const dosTime =
    ((now.getHours() & 0x1f) << 11) |
    ((now.getMinutes() & 0x3f) << 5) |
    ((now.getSeconds() >> 1) & 0x1f);
  const dosDate =
    (((now.getFullYear() - 1980) & 0x7f) << 9) |
    (((now.getMonth() + 1) & 0x0f) << 5) |
    (now.getDate() & 0x1f);

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const dataBytes = entry.data;
    const crc = crc32(dataBytes);
    const size = dataBytes.byteLength;

    // Local file header (30 bytes + name length)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // signature
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0x0800, true); // flags (UTF-8 enabled)
    lv.setUint16(8, 0, true); // compression method (STORE)
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true); // compressed size
    lv.setUint32(22, size, true); // uncompressed size
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true); // extra field length
    localHeader.set(nameBytes, 30);

    fileParts.push(localHeader);
    fileParts.push(dataBytes);

    // Central directory header (46 bytes + name length)
    const cdHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cdHeader.buffer);
    cv.setUint32(0, 0x02014b50, true); // signature
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0x0800, true); // flags (UTF-8 enabled)
    cv.setUint16(10, 0, true); // compression method (STORE)
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true); // extra field length
    cv.setUint16(32, 0, true); // comment length
    cv.setUint16(34, 0, true); // disk number start
    cv.setUint16(36, 0, true); // internal attributes
    cv.setUint32(38, 0, true); // external attributes
    cv.setUint32(42, currentOffset, true); // relative offset of local header
    cdHeader.set(nameBytes, 46);

    centralDirectoryParts.push(cdHeader);
    currentOffset += localHeader.byteLength + dataBytes.byteLength;
  }

  const centralDirectoryOffset = currentOffset;
  let centralDirectorySize = 0;
  for (const part of centralDirectoryParts) {
    centralDirectorySize += part.byteLength;
  }

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); // signature
  ev.setUint16(4, 0, true); // disk number
  ev.setUint16(6, 0, true); // start disk
  ev.setUint16(8, entries.length, true); // records on disk
  ev.setUint16(10, entries.length, true); // total records
  ev.setUint32(12, centralDirectorySize, true);
  ev.setUint32(16, centralDirectoryOffset, true);
  ev.setUint16(20, 0, true); // comment length

  return new Blob([...fileParts, ...centralDirectoryParts, eocd] as unknown as BlobPart[], {
    type: "application/zip",
  });
}
