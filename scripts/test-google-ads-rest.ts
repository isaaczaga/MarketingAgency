import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { verifyConnection } from '../lib/google-ads';

async function checkRestApi() {
    console.log('--- Testing Google Ads Connection ---');
    const result = await verifyConnection();
    console.log(JSON.stringify(result, null, 2));
}

checkRestApi();
