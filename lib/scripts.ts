import * as anchor from '@project-serum/anchor';
import {
    PublicKey,
    Keypair,
    Connection,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    LAMPORTS_PER_SOL,
    Transaction,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Wallet } from '@project-serum/anchor';

import { getATokenAccountsNeedCreate, getAssociatedTokenAccount } from './util';
import { GlobalPool } from '../lib/types';
import { GLOBAL_AUTHORITY_SEED, TOKEN_ADDRESS, TOKEN_DECIMAL, TREASURY } from './constant'

export const createInitializeTx = async (
    userAddress: PublicKey,
    program: anchor.Program,
) => {
    const [globalPool, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)], 
        program.programId );

    console.log("globalPool: ", globalPool.toBase58());

    const tx = await program.rpc.initialize(
        bump, {
        accounts: {
            admin: userAddress,
            globalPool,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        },
        instructions: [],
        signers: [],
    });

    // const txId = await program.methods
    //     .initialize()
    //     .accounts({
    //         admin: userAddress,
    //         globalPool,
    //         systemProgram: SystemProgram.programId,
    //         rent: SYSVAR_RENT_PUBKEY })
    //     .transaction();

    return tx;
}

export const createAdminAddTx = async (
    userAddress: PublicKey,
    program: anchor.Program,
    admin: PublicKey,
) => {
    const [globalPool, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)], 
        program.programId );


    const tx = await program.methods
        .addAdmin(admin)
        .accounts({
            user: userAddress,
            globalPool,
            })
        .transaction();

    return tx;
}

export const createAdminRemoveTx = async (
    userAddress: PublicKey,
    program: anchor.Program,
    admin: PublicKey,
) => {
    const [globalPool, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)], 
        program.programId );


    const txId = await program.methods
        .removeAdmin(admin)
        .accounts({
            user: userAddress,
            globalPool,
            })
        .transaction();

    return txId;
}

export const createSwapTx = async (
    solConnection: Connection,
    userAddress: PublicKey,
    program: anchor.Program,
    amount: number,
) => {
    const [globalPool, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)], 
        program.programId );
    
        
        
    const vaultTokenAccount = await getAssociatedTokenAccount(globalPool, TOKEN_ADDRESS);
    console.log("vaultTokenAccount: ", vaultTokenAccount.toBase58());

    let { instructions, destinationAccounts } = await getATokenAccountsNeedCreate(
        solConnection,
        userAddress,
        userAddress,
        [TOKEN_ADDRESS]
    );
    let tx = new Transaction()
    if (instructions.length>0) {
        tx.add(...instructions);
    }

    tx.add(program.instruction
        .swap(bump, new anchor.BN(amount * LAMPORTS_PER_SOL), {
            accounts: {
                user: userAddress,
                globalPool,
                userTokenAccount: destinationAccounts[0],
                vaultTokenAccount,
                tokenMint: TOKEN_ADDRESS,
                treasury: TREASURY,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            },
            instructions: [],
            signers: []
        }))
        

    return tx;
}
