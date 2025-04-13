const crypto = require('crypto');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

// Main function
const main = async () => {
  console.log('🔐 Environment Variable Encryptor for Vercel 🔐');
  console.log('This tool will help you encrypt sensitive environment variables');
  console.log('--------------------------------------------------------------\n');

  // Generate or use existing key
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

  console.log('\nPlease enter the environment variables to encrypt:');
  console.log('Enter in format: KEY=VALUE (Enter empty line to finish)\n');

  const envVars = {};

  // Function to prompt for input
  const promptInput = () => {
    return new Promise((resolve) => {
      rl.question('> ', (input) => {
        resolve(input.trim());
      });
    });
  };

  // Collect environment variables
  while (true) {
    const input = await promptInput();
    if (!input) break;

    const match = input.match(/^([^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      envVars[key] = value;
    } else {
      console.log('Invalid format. Please use KEY=VALUE format.');
    }
  }

  // Encrypt and write results
  console.log('\nEncrypted Environment Variables:');
  console.log('--------------------------------');

  const encryptedOutput = {};

  for (const [key, value] of Object.entries(envVars)) {
    const encrypted = encrypt(value, encryptionKey);
    encryptedOutput[key] = encrypted;
    console.log(`${key}=${encrypted}`);
  }

  // Save encrypted variables to file
  const outputFile = '.env.encrypted';
  fs.writeFileSync(
    outputFile, 
    Object.entries(encryptedOutput)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
  );

  console.log(`\nEncrypted variables saved to ${outputFile}`);
  console.log('\nFor Vercel, add these environment variables:');
  console.log('NEXT_PUBLIC_ENCRYPTION_KEY=' + encryptionKey);
  
  Object.entries(encryptedOutput).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });

  console.log('\nIMPORTANT: When using the encrypted values, make sure to:');
  console.log('1. Update your encryption.ts file to handle encrypted environment variables');
  console.log('2. Store NEXT_PUBLIC_ENCRYPTION_KEY securely in Vercel');

  rl.close();
};

main().catch(console.error); 