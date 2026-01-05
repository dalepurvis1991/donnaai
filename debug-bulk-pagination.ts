import 'dotenv/config';
import { storage } from './server/storage';
import { gmailApiService } from './server/services/gmailApiService';
import { vectorService } from './server/services/vectorService';
import fs from 'fs';

const LOG_FILE = 'debug_paged.txt';
fs.writeFileSync(LOG_FILE, '');

function log(msg: string) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\r\n');
}

async function runDebug() {
    try {
        log('Starting PAGED debug...');
        const users = await storage.getUsers();
        if (users.length === 0) {
            log('No users found.');
            return;
        }
        const user = users[0];

        log(`User: ${user.email}`);
        if (!user.googleAccessToken) {
            log('No token.');
            return;
        }

        // Reset
        log('Clearing emails...');
        await storage.clearEmails(user.id);

        // Loop
        let pageToken: string | undefined = undefined;
        let count = 0;
        const TARGET = 30; // Test with 30 emails (2 batches of 15)

        console.log('entering loop');

        while (count < TARGET) {
            log(`Fetching page. Current count: ${count}. Token: ${pageToken?.substring(0, 5)}...`);
            const result = await gmailApiService.fetchEmailsPage(user, 15, pageToken);

            log(`Fetched ${result.emails.length} emails in this batch.`);

            for (const email of result.emails) {
                await storage.upsertEmail(email);
            }

            count += result.emails.length;
            pageToken = result.nextPageToken || undefined;

            if (!pageToken) {
                log('No more pages from Gmail.');
                break;
            }

            // Small delay to simulate real world
            await new Promise(r => setTimeout(r, 100));
        }

        log(`Total fetched: ${count}`);

        log('Indexing...');
        await vectorService.indexAllUserEmails(user.id);
        log('Vector indexing completed.');
        log('SUCCESS');

    } catch (e) {
        log(`ERROR: ${e}`);
        if (e instanceof Error) log(e.stack || '');
    } finally {
        process.exit(0);
    }
}
runDebug();
