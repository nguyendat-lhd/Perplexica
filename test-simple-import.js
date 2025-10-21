// Test script to check simple import
console.log('🔍 Testing Simple Import');
console.log('========================\n');

try {
  // Try to import searchHandlers directly
  console.log('1️⃣ Trying to import searchHandlers...');
  
  // This will fail because it's TypeScript, but let's see what happens
  try {
    const searchHandlers = require('./src/lib/search/index.ts');
    console.log('   ✅ searchHandlers imported successfully');
    console.log('   Available handlers:', Object.keys(searchHandlers));
  } catch (error) {
    console.log('   ❌ Failed to import searchHandlers:', error.message);
  }
  
  // Try to import prompts
  console.log('\n2️⃣ Trying to import prompts...');
  try {
    const prompts = require('./src/lib/prompts/index.ts');
    console.log('   ✅ prompts imported successfully');
    console.log('   Available prompts:', Object.keys(prompts));
  } catch (error) {
    console.log('   ❌ Failed to import prompts:', error.message);
  }
  
  // Try to check if files can be read
  console.log('\n3️⃣ Checking file readability...');
  const fs = require('fs');
  
  const searchIndexPath = './src/lib/search/index.ts';
  const promptsIndexPath = './src/lib/prompts/index.ts';
  
  try {
    const searchContent = fs.readFileSync(searchIndexPath, 'utf8');
    console.log('   ✅ search/index.ts readable');
    console.log('   Size:', searchContent.length, 'characters');
  } catch (error) {
    console.log('   ❌ Failed to read search/index.ts:', error.message);
  }
  
  try {
    const promptsContent = fs.readFileSync(promptsIndexPath, 'utf8');
    console.log('   ✅ prompts/index.ts readable');
    console.log('   Size:', promptsContent.length, 'characters');
  } catch (error) {
    console.log('   ❌ Failed to read prompts/index.ts:', error.message);
  }
  
  console.log('\n🎯 Summary:');
  console.log('===========');
  console.log('This test shows if the files can be read and imported.');
  console.log('If imports fail, it confirms TypeScript compilation issues.');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
