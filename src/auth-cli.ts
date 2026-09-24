import { generateAuthUrl, getAndSaveToken } from './auth/google-auth';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Authorize this app by visiting this url:');
console.log(generateAuthUrl());

rl.question('Enter the code from that page here: ', async (code) => {
  try {
    await getAndSaveToken(code);
    console.log('Token saved successfully.');
  } catch (err) {
    console.error('Error retrieving token:', err);
  } finally {
    rl.close();
  }
});
