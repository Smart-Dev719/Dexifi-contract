import {Program, web3} from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import fs from 'fs';
import NodeWallet from '@project-serum/anchor/dist/cjs/nodewallet';
import { GLOBAL_AUTHORITY_SEED, PROGRAM_ID, TOKEN_DECIMAL } from '../lib/constant';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import path from 'path';

import {IDL} from "../target/types/dexifi";
import { 
    createInitializeTx, 
    createAdminAddTx,
    createAdminRemoveTx,
    createSwapTx
} from '../lib/scripts';
import { GlobalPool } from '../lib/types';

let solConnection: Connection = null;
let program: Program = null;
let provider: anchor.Provider = null;
let payer: NodeWallet = null;

// Address of the deployed program.
let programId = new anchor.web3.PublicKey(PROGRAM_ID);

/**
 * Set cluster, provider, program
 * If rpc != null use rpc, otherwise use cluster param
 * @param cluster - cluster ex. mainnet-beta, devnet ...
 * @param keypair - wallet keypair
 * @param rpc - rpc
 */

export const setClusterConfig = async (cluster: web3.Cluster) => {
    solConnection = new web3.Connection(web3.clusterApiUrl(cluster));
    const walletKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(path.resolve(process.env.ANCHOR_WALLET), 'utf-8'))), { skipValidation: true });
    const wallet = new NodeWallet(walletKeypair);
    // anchor.setProvider(anchor.AnchorProvider.local(web3.clusterApiUrl(cluster)));
    // Configure the client to use the local cluster.
    anchor.setProvider(new anchor.AnchorProvider(solConnection, wallet, { skipPreflight: true, commitment: 'confirmed' }));
    payer = wallet;

    console.log("payer path: ", process.env.ANCHOR_WALLET);
    console.log("payer: ", payer.publicKey.toBase58());

    // Generate the program client from IDL.
    program = new anchor.Program(IDL as anchor.Idl, programId);
    console.log('ProgramId: ', program.programId.toBase58());

    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );
    console.log('GlobalAuthority: ', globalAuthority.toBase58());
    // await main();
}

/**
 * Initialize global pool, vault
 */
export const initProject = async () => {
    try {
        const tx = await createInitializeTx(payer.publicKey, program);

        // const { blockhash } = await solConnection.getRecentBlockhash('confirmed');
        // tx.feePayer = payer.publicKey;
        // tx.recentBlockhash = blockhash;
        // payer.signTransaction(tx);
        // let txId = await solConnection.sendTransaction(tx, [(payer as NodeWallet).payer]);
        let result = await solConnection.confirmTransaction(tx, "confirmed");
        console.log("tx ", tx)
        console.log("result =", result);
    } catch (e) {
        console.log(e);
    }
}

/**
 * add admin
 */
export const addAdmin = async (admin: PublicKey) => {
    try {
        const tx = await createAdminAddTx(payer.publicKey, program, admin);

        // const txId = await provider.sendAndConfirm(tx, [], {
        //     commitment: "confirmed",
        // });
const { blockhash } = await solConnection.getRecentBlockhash('confirmed');
        tx.feePayer = payer.publicKey;
        tx.recentBlockhash = blockhash;
        payer.signTransaction(tx);
        let txId = await solConnection.sendTransaction(tx, [(payer as NodeWallet).payer]);
        console.log("txHash: ", txId);
    } catch (e) {
        console.log(e);
    }
}

/**
 * remove admin
 */
export const removeAdmin = async (
    admin: PublicKey,
) => {
    try {
        const tx = await createAdminRemoveTx(payer.publicKey, program, admin);

        const { blockhash } = await solConnection.getRecentBlockhash('confirmed');
        tx.feePayer = payer.publicKey;
        tx.recentBlockhash = blockhash;
        payer.signTransaction(tx);
        let txId = await solConnection.sendTransaction(tx, [(payer as NodeWallet).payer]);
        console.log("txHash: ", txId);
    } catch (e) {
        console.log(e);
    }
}

/**
 * swap sol to token
 */
export const swap = async (
    amount: number
) => {
    try {
        const tx = await createSwapTx(solConnection, payer.publicKey, program, amount);

        const { blockhash } = await solConnection.getRecentBlockhash('confirmed');
        tx.feePayer = payer.publicKey;
        tx.recentBlockhash = blockhash;
        payer.signTransaction(tx);
        let txId = await solConnection.sendTransaction(tx, [(payer as NodeWallet).payer]);
        console.log("txHash: ", txId);
    } catch (e) {
        console.log(e);
    }
}

const main = async () => {
    await setClusterConfig('devnet');
    // await initProject();
    // await addAdmin(new PublicKey("GSSBwNKEbhLp2U9eycSsYbSVLZ2CaszvNdZeL2iLsSA5"))
    await removeAdmin(new PublicKey("GSSBwNKEbhLp2U9eycSsYbSVLZ2CaszvNdZeL2iLsSA5"))
    // await swap(1);
}

main();