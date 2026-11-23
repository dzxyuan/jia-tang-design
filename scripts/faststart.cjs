// Minimal qt-faststart: move the moov atom in front of mdat so browsers can
// start playback without downloading the whole file first. Adjusts stco/co64.
const fs = require("fs");

const src = process.argv[2];
const dst = process.argv[3] || src;
const buf = fs.readFileSync(src);

function u32(o) { return buf.readUInt32BE(o); }
function boxAt(o) {
  const size = u32(o);
  const type = buf.toString("ascii", o + 4, o + 8);
  return { size, type, payloadStart: o + 8, payloadEnd: o + size };
}

// Walk top-level boxes.
const boxes = [];
let p = 0;
while (p < buf.length - 7) {
  const b = boxAt(p);
  if (b.size < 8 || b.payloadEnd > buf.length) break;
  boxes.push(b);
  p = b.payloadEnd;
}

const moov = boxes.find((b) => b.type === "moov");
const mdat = boxes.find((b) => b.type === "mdat");
const ftyp = boxes.find((b) => b.type === "ftyp");
if (!moov || !mdat) { console.error("no moov/mdat"); process.exit(1); }
if (moov.payloadStart < mdat.payloadStart) {
  console.log("already faststart, nothing to do");
  process.exit(0);
}

const oldMdatStart = mdat.payloadStart - 8; // box header start
// New layout: ftyp + moov + mdat (drop free/others).
const newMdatStart = (ftyp ? ftyp.size : 0) + moov.size;
const delta = newMdatStart - oldMdatStart;
console.log("moov", moov.size, "mdat", mdat.size, "delta", delta);

// Recursively walk inside moov and patch stco/co64.
function walk(start, end) {
  let o = start;
  while (o + 8 <= end) {
    const size = buf.readUInt32BE(o);
    const type = buf.toString("ascii", o + 4, o + 8);
    if (size < 8 || o + size > end) break;
    if (type === "stco") {
      const count = buf.readUInt32BE(o + 12);
      for (let i = 0; i < count; i++) {
        const off = o + 16 + i * 4;
        buf.writeUInt32BE(buf.readUInt32BE(off) + delta, off);
      }
    } else if (type === "co64") {
      const count = buf.readUInt32BE(o + 12);
      for (let i = 0; i < count; i++) {
        const off = o + 16 + i * 8;
        buf.writeBigUInt64BE(buf.readBigUInt64BE(off) + BigInt(delta), off);
      }
    }
    walk(o + 8, o + size); // recurse into children
    o += size;
  }
}
walk(moov.payloadStart, moov.payloadEnd);

// Assemble output: ftyp box + moov box + mdat box.
const chunks = [];
if (ftyp) chunks.push(buf.subarray(ftyp.payloadStart - 8, ftyp.payloadEnd));
chunks.push(buf.subarray(moov.payloadStart - 8, moov.payloadEnd));
chunks.push(buf.subarray(mdat.payloadStart - 8, mdat.payloadEnd));
const out = Buffer.concat(chunks);
fs.writeFileSync(dst, out);
console.log("wrote", dst, out.length, "bytes");
