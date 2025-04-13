const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const prompt = (question) => new Promise((resolve) => rl.question(question, resolve));

// Generate a random encryption key
const generateKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Encrypt a value
const encrypt = (text, key) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

// Read .env.local file
const readEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      env[key.trim()] = value.trim();
    }
  });
  
  return env;
};

const main = async () => {
  console.log('🔒 Secure Vercel Deployment Tool 🔒');
  console.log('This tool will encrypt your environment variables and deploy to Vercel');
  console.log('-------------------------------------------------------------------\n');
  
  // Generate encryption key
  let encryptionKey;
  const keyFile = '.env.key';
  
  if (fs.existsSync(keyFile)) {
    encryptionKey = fs.readFileSync(keyFile, 'utf8').trim();
    console.log('Using existing encryption key from .env.key');
  } else {
    encryptionKey = generateKey();
    fs.writeFileSync(keyFile, encryptionKey);
    console.log('Generated new encryption key and saved to .env.key');
    console.log('IMPORTANT: Keep this key safe and do not commit it to your repository!');
  }
  
  // Read environment variables
  const envFile = '.env.local';
  const env = readEnvFile(envFile);
  
  if (Object.keys(env).length === 0) {
    console.log(`No environment variables found in ${envFile}`);
    const useManual = await prompt('Would you like to enter variables manually? (y/n): ');
    
    if (useManual.toLowerCase() !== 'y') {
      console.log('Exiting...');
      rl.close();
      return;
    }
    
    console.log('\nPlease enter your Firebase configuration:');
    
    env.NEXT_PUBLIC_FIREBASE_API_KEY = await prompt('Firebase API Key: ');
    env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = await prompt('Firebase Auth Domain: ');
    env.NEXT_PUBLIC_FIREBASE_DATABASE_URL = await prompt('Firebase Database URL: ');
    env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = await prompt('Firebase Project ID: ');
    env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = await prompt('Firebase Storage Bucket: ');
    env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = await prompt('Firebase Messaging Sender ID: ');
    env.NEXT_PUBLIC_FIREBASE_APP_ID = await prompt('Firebase App ID: ');
  }
  
  // Encrypt environment variables
  console.log('\nEncrypting environment variables...');
  
  const encryptedEnv = {};
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith('NEXT_PUBLIC_') || key === 'DATABASE_URL' || key === 'FIREBASE_PRIVATE_KEY') {
      encryptedEnv[key] = encrypt(value, encryptionKey);
      console.log(`Encrypted: ${key}`);
    }
  }
  
  // Create commands for Vercel CLI
  console.log('\nGenerating Vercel CLI commands...');
  
  let vercelCommands = [];
  
  // Add encryption key first (USE ENCRYPTION_KEY, NOT NEXT_PUBLIC_ENCRYPTION_KEY)
  vercelCommands.push(`vercel env add ENCRYPTION_KEY production`);
  
  // Add all other encrypted variables
  for (const [key, value] of Object.entries(encryptedEnv)) {
    vercelCommands.push(`vercel env add ${key} production`);
  }
  
  // Add deployment command
  vercelCommands.push('vercel --prod');
  
  // Save commands to file
  const commandsFile = 'vercel-deploy.sh';
  fs.writeFileSync(
    commandsFile, 
    '#!/bin/bash\n\n' + vercelCommands.join('\n')
  );
  fs.chmodSync(commandsFile, '755'); // Make executable
  
  console.log(`\nCommands saved to ${commandsFile}`);
  console.log('To deploy, run:');
  console.log(`./vercel-deploy.sh`);
  
  // Save encrypted variables to file for reference
  const outputFile = '.env.encrypted';
  fs.writeFileSync(
    outputFile, 
    Object.entries(encryptedEnv)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
  );
  
  console.log(`\nEncrypted variables saved to ${outputFile}`);
  console.log(`\nIMPORTANT: When prompted in Vercel CLI, use these encrypted values from ${outputFile}`);
  console.log('For the ENCRYPTION_KEY, use this value:');
  console.log(encryptionKey);
  
  console.log('\nWARNING: NEVER use NEXT_PUBLIC_ prefix for sensitive information like encryption keys!');
  console.log('This exposes them to the client/browser and is a major security risk.');
  
  console.log('\nHere is a quick copy-paste reference:');
  console.log('-----------------------------------');
  console.log(`ENCRYPTION_KEY=${encryptionKey}`);
  
  Object.entries(encryptedEnv).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });
  
  rl.close();
};

main().catch(console.error); 