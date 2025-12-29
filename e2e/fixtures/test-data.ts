export const testUsers = {
  admin: {
    email: 'admin@test.mixology.com',
    password: 'TestAdmin123!',
    username: 'TestAdmin',
    role: 'admin',
  },
  reviewer: {
    email: 'reviewer@test.mixology.com',
    password: 'TestReviewer123!',
    username: 'TestReviewer',
    role: 'reviewer',
  },
  basic: {
    email: 'user@test.mixology.com',
    password: 'TestUser123!',
    username: 'TestUser',
    role: 'basic',
  },
  newUser: () => ({
    email: `test${Date.now()}@test.mixology.com`,
    password: 'NewUser123!',
    username: `TestUser${Date.now()}`,
    role: 'basic',
  }),
};

export const testCocktails = {
  margarita: {
    name: 'Test Margarita',
    description: 'A classic test margarita for testing purposes',
    instructions: ['Add tequila', 'Add lime juice', 'Add triple sec', 'Shake with ice', 'Serve in a salt-rimmed glass'],
    ingredients: [
      { name: 'Tequila', amount: '2', unit: 'oz' },
      { name: 'Lime Juice', amount: '1', unit: 'oz' },
      { name: 'Triple Sec', amount: '1', unit: 'oz' },
    ],
    category: 'Classic',
    tags: ['citrus', 'refreshing', 'tequila'],
  },
  mojito: {
    name: 'Test Mojito',
    description: 'A refreshing test mojito',
    instructions: ['Muddle mint and sugar', 'Add rum and lime', 'Top with soda', 'Stir gently'],
    ingredients: [
      { name: 'White Rum', amount: '2', unit: 'oz' },
      { name: 'Fresh Mint', amount: '6', unit: 'leaves' },
      { name: 'Lime Juice', amount: '1', unit: 'oz' },
      { name: 'Sugar', amount: '2', unit: 'tsp' },
      { name: 'Soda Water', amount: '2', unit: 'oz' },
    ],
    category: 'Classic',
    tags: ['refreshing', 'rum', 'mint'],
  },
  oldFashioned: {
    name: 'Test Old Fashioned',
    description: 'A classic test old fashioned',
    instructions: ['Add sugar and bitters', 'Muddle with water', 'Add whiskey', 'Stir with ice', 'Garnish with orange'],
    ingredients: [
      { name: 'Bourbon', amount: '2', unit: 'oz' },
      { name: 'Sugar', amount: '1', unit: 'cube' },
      { name: 'Angostura Bitters', amount: '2', unit: 'dashes' },
    ],
    category: 'Classic',
    tags: ['whiskey', 'strong', 'classic'],
  },
};

export const testIngredients = {
  tequila: {
    name: 'Test Tequila',
    category: 'Spirits',
    description: 'A test tequila ingredient',
    tags: ['spirit', 'agave'],
  },
  lime: {
    name: 'Test Lime Juice',
    category: 'Citrus',
    description: 'Fresh lime juice for testing',
    tags: ['citrus', 'juice', 'sour'],
  },
  mint: {
    name: 'Test Fresh Mint',
    category: 'Herbs',
    description: 'Fresh mint leaves for testing',
    tags: ['herb', 'fresh', 'aromatic'],
  },
  bourbon: {
    name: 'Test Bourbon',
    category: 'Spirits',
    description: 'A test bourbon whiskey',
    tags: ['spirit', 'whiskey', 'american'],
  },
  bitters: {
    name: 'Test Angostura Bitters',
    category: 'Bitters',
    description: 'Aromatic bitters for testing',
    tags: ['bitters', 'aromatic'],
  },
};

export const testBrands = {
  patronSilver: {
    name: 'Test Patron Silver',
    ingredientCategory: 'Spirits',
    notes: 'Premium test tequila brand',
  },
  makersMarkTest: {
    name: "Test Maker's Mark",
    ingredientCategory: 'Spirits',
    notes: 'Premium test bourbon brand',
  },
};

export function generateUniqueEmail(): string {
  return `test${Date.now()}_${Math.random().toString(36).substring(7)}@test.mixology.com`;
}

export function generateUniqueUsername(): string {
  return `TestUser${Date.now()}_${Math.random().toString(36).substring(7)}`;
}
