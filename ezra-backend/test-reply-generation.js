/**
 * Test script for the Reply Generation API
 * 
 * This script demonstrates how to use the /api/generate-reply endpoint
 * to generate email replies using the Ezra AI system.
 * 
 * Usage:
 * 1. Make sure your server is running (npm run dev)
 * 2. Make sure you have a valid session/authentication
 * 3. Run: node test-reply-generation.js
 */

const testReplyGeneration = async () => {
  const baseUrl = 'http://localhost:3000';
  
  // Sample incoming email data
  const testEmail = {
    incomingEmail: {
      from: "boss@company.com",
      to: ["user@company.com"],
      subject: "Urgent: Project Status Update Needed",
      body: `Hi there,

I hope you're doing well. I need an update on the Q4 project status by end of day today. 

Can you please send me:
1. Current progress percentage
2. Any blockers or issues
3. Expected completion date

This is needed for the board meeting tomorrow morning.

Thanks,
John`,
      date: new Date().toISOString()
    }
  };

  try {
    console.log('🚀 Testing Reply Generation API...\n');
    console.log('📧 Incoming Email:');
    console.log(`From: ${testEmail.incomingEmail.from}`);
    console.log(`Subject: ${testEmail.incomingEmail.subject}`);
    console.log(`Body: ${testEmail.incomingEmail.body.substring(0, 100)}...\n`);

    const response = await fetch(`${baseUrl}/api/generate-reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real scenario, you'd need to include authentication headers
        // 'Authorization': 'Bearer your-session-token'
      },
      body: JSON.stringify(testEmail)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error:', errorData);
      return;
    }

    const result = await response.json();
    
    console.log('✅ Reply Generated Successfully!\n');
    console.log('📝 Generated Reply:');
    console.log('─'.repeat(50));
    console.log(result.reply);
    console.log('─'.repeat(50));
    console.log(`\n📊 Confidence Score: ${result.confidence}%`);
    console.log(`🤔 Reasoning: ${result.reasoning}`);
    console.log(`⏰ Generated at: ${result.timestamp}`);

  } catch (error) {
    console.error('❌ Error testing reply generation:', error.message);
  }
};

// Test the master prompt API as well
const testMasterPromptAPI = async () => {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('\n🔧 Testing Master Prompt API...\n');
    
    const response = await fetch(`${baseUrl}/api/master-prompt`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real scenario, you'd need to include authentication headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Master Prompt API Error:', errorData);
      return;
    }

    const result = await response.json();
    
    console.log('✅ Master Prompt Retrieved Successfully!\n');
    console.log('📋 Current Master Prompt:');
    console.log('─'.repeat(50));
    console.log(result.prompt.substring(0, 200) + '...');
    console.log('─'.repeat(50));
    console.log(`📊 Version: ${result.version}`);
    console.log(`🔧 Is Default: ${result.isDefault}`);

  } catch (error) {
    console.error('❌ Error testing master prompt API:', error.message);
  }
};

// Run the tests
const runTests = async () => {
  console.log('🧪 Ezra Reply Generation System Test\n');
  console.log('Note: Make sure your server is running and you have proper authentication set up.\n');
  
  await testMasterPromptAPI();
  await testReplyGeneration();
  
  console.log('\n✨ Test completed!');
  console.log('\n📚 Next Steps:');
  console.log('1. Set up proper authentication in your frontend');
  console.log('2. Integrate the API calls into your UI components');
  console.log('3. Add error handling and loading states');
  console.log('4. Test with real email data from your Gmail');
};

// Export for use in other files or run directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testReplyGeneration,
  testMasterPromptAPI,
  runTests
}; 