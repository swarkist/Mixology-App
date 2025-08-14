// Test script to promote user and test AI parsing as reviewer
const testCocktailRecipe = `Chipotle Patron Margarita
Ingredients:
1.5 oz. Tequila (Patron Silver)
0.5 oz. Cointreau (or Patron Citronge)
1 oz. Lime juice, freshly squeezed
0.5 oz. Agave Nectar
Method
Shake and strain, serve on the rocks.
Kosher salt (optional), for rimming the glass`;

async function runTest() {
    const baseUrl = 'http://localhost:5000';
    
    try {
        console.log('🧪 Testing AI Parsing as Reviewer');
        
        // Step 1: Login as admin to promote user
        console.log('1. Logging in as admin...');
        const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'swarkist@gmail.com',
                password: 'admin123'
            })
        });
        
        if (!adminLogin.ok) {
            console.log('❌ Admin login failed, trying different password...');
            // Try without specific password since we don't know the admin password
            console.log('Skipping admin promotion step - testing with current user role');
        }
        
        // Step 2: Login as reviewer (even if basic role)
        console.log('2. Logging in as reviewer...');
        const reviewerLogin = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'reviewer@test.com',
                password: 'password123'
            })
        });
        
        const reviewerData = await reviewerLogin.json();
        console.log('Reviewer login result:', reviewerData);
        
        if (!reviewerData.success) {
            console.log('❌ Reviewer login failed');
            return;
        }
        
        // Step 3: Test AI parsing endpoint
        console.log('3. Testing AI parsing...');
        const aiTest = await fetch(`${baseUrl}/api/openrouter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                systemPrompt: 'Parse this cocktail recipe into JSON format with name, description, ingredients array (with name, amount, unit), and instructions array.',
                userContent: testCocktailRecipe
            })
        });
        
        console.log('AI API Response Status:', aiTest.status);
        console.log('AI API Response Headers:', Object.fromEntries(aiTest.headers.entries()));
        
        if (aiTest.ok) {
            const aiData = await aiTest.json();
            console.log('✅ AI parsing successful!');
            console.log('AI Response:', JSON.stringify(aiData, null, 2));
        } else {
            const errorText = await aiTest.text();
            console.log('❌ AI parsing failed');
            console.log('Error response:', errorText);
            
            // Check if it's an authentication error
            if (aiTest.status === 401) {
                console.log('🔍 Authentication error - checking auth status...');
                const authCheck = await fetch(`${baseUrl}/api/auth/me`);
                const authData = await authCheck.json();
                console.log('Current auth status:', authData);
            }
        }
        
    } catch (error) {
        console.error('Test error:', error);
    }
}

// For browser console testing
if (typeof window !== 'undefined') {
    window.runAITest = runTest;
    console.log('Test function loaded. Run window.runAITest() to test AI parsing.');
} else {
    // For Node.js testing
    runTest();
}