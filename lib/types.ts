import * as anchor from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';

export interface GlobalPool {
    superAdmin: PublicKey,      // 32
    admins: PublicKey[],
    adminsLength: number
}
