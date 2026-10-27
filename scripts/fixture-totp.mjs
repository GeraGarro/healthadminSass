// This public test seed works only in the disposable StrictTestApplication.
import {createHmac} from 'node:crypto';
const key=Buffer.from('48656c6c6f21deadbeef','hex'),counter=Buffer.alloc(8);
counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));
const hash=createHmac('sha1',key).update(counter).digest(),offset=hash.at(-1)&15;
console.log(String((hash.readUInt32BE(offset)&0x7fffffff)%1000000).padStart(6,'0'));
