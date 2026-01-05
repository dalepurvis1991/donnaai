import 'dotenv/config';
import { storage } from './server/storage';
import { gmailApiService } from './server/services/gmailApiService';
import { vectorService } from './server/services/vectorService';
import fs from 'fs';

const LOG_FILE = 'debug_log_clean.txt';
fs.writeFileSync(LOG_FILE, ''); // Clear log

function log(msg: string) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\r\n');
}

function errorLog(msg: string, error: any) {
    console.error(msg, error);
    fs.appendFileSync(LOG_FILE, `ERROR: ${msg} ${error}\r\n`);
    if (error instanceof Error && error.stack) {
        fs.appendFileSync(LOG_FILE, `STACK: ${error.stack}\r\n`);
    }
}

async function runDebug() {
    try {
        log('Starting debug script...');

        // Get the first user
        const users = await storage.getUsers();
        if (users.length === 0) {
            log('No users found in database');
            return;
        }

        // Pick the user (assuming the first one is the one we want to test)
        const user = users[0];
        log(`Testing with user: ${user.email} (${user.id})`);

        if (!user.googleAccessToken) {
            log('User has no Google access token');
            return;
        }

        log('1. Clearing emails...');
        await storage.clearEmails(user.id);
        log('Emails cleared.');

        log('2. Fetching emails from Gmail...');
        // Try with a small limit first
        const limit = 10;
        const newEmails = await gmailApiService.fetchUserEmails(user, limit);
        log(`Fetched ${newEmails.length} emails.`);

        log('3. Storing emails...');
        const createdEmails = [];
        for (const email of newEmails) {
            const createdEmail = await storage.upsertEmail(email);
            createdEmails.push(createdEmail);
        }
        log(`Stored ${createdEmails.length} emails.`);

        log('4. Indexing vectors...');
        await vectorService.indexAllUserEmails(user.id);
        log('Vector indexing completed.');

        log('SUCCESS: Bulk process simulation finished without errors.');
    } catch (error) {
        errorLog('CRITICAL ERROR:', error);
    } finally {
        process.exit(0);
    }
}

runDebug();
