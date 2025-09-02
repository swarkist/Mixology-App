/**
 * AI Recipe Output Contracts
 * 
 * These contracts ensure consistent multi-recipe responses from AI models
 * regardless of model variations or inconsistencies.
 */

export const MULTI_RECIPE_JSON_CONTRACT = `
You MUST return exactly ONE valid JSON object, no prose before or after.
Shape:
{
  "recipes": [
    {
      "name": "string",
      "description": "string",
      "ingredients": [
        {"quantity":"string","unit":"string","item":"string","notes":"string?"}
      ],
      "instructions": ["string"],
      "glassware": "string?",
      "garnish": "string?",
      "tags": ["string"]
    }
  ]
}
Do NOT use label keys like "Ingredients:" or "Instructions:". Use "ingredients" and "instructions" only.

EXAMPLE - Two classic cocktails:
{
  "recipes": [
    {
      "name": "Old Fashioned",
      "description": "A timeless cocktail with a robust, sweet, and spicy flavor.",
      "ingredients": [
        {"quantity": "2", "unit": "oz", "item": "Bourbon whiskey", "notes": ""},
        {"quantity": "0.5", "unit": "oz", "item": "Rich simple syrup", "notes": "2 parts sugar : 1 part water"},
        {"quantity": "2", "unit": "dashes", "item": "Angostura bitters", "notes": ""},
        {"quantity": "1", "unit": "", "item": "Orange twist", "notes": "for garnish"}
      ],
      "instructions": [
        "In an old-fashioned glass, combine the bourbon, simple syrup, and bitters.",
        "Add ice and stir until well chilled.",
        "Garnish with an orange twist."
      ],
      "glassware": "Old-fashioned glass",
      "garnish": "Orange twist",
      "tags": ["classic", "bourbon", "stirred"]
    },
    {
      "name": "Margarita",
      "description": "A refreshing and tangy cocktail that's perfect for hot days.",
      "ingredients": [
        {"quantity": "2", "unit": "oz", "item": "Tequila", "notes": ""},
        {"quantity": "1", "unit": "oz", "item": "Cointreau", "notes": ""},
        {"quantity": "1", "unit": "oz", "item": "Fresh lime juice", "notes": ""},
        {"quantity": "", "unit": "", "item": "Salt", "notes": "for rimming the glass"}
      ],
      "instructions": [
        "Rim a margarita glass with salt.",
        "Shake the tequila, cointreau, and lime juice with ice.",
        "Strain into the salt-rimmed glass filled with ice."
      ],
      "glassware": "Margarita glass",
      "garnish": "Lime wheel",
      "tags": ["classic", "tequila", "shaken", "citrus"]
    }
  ]
}

CRITICAL: Return ONLY valid JSON. No explanatory text before or after.
`;

export const MULTI_RECIPE_MARKDOWN_FALLBACK = `
### <Recipe Name>
_Description_

**Ingredients**
- <quantity> <unit> <item> (notes?)

**Instructions**
1) ...
2) ...

**Glassware**: ...
**Garnish**: ...
**Tags**: tag1, tag2
---

EXAMPLE - Two classic cocktails:

### Old Fashioned
_A timeless cocktail with a robust, sweet, and spicy flavor._

**Ingredients**
- 2 oz Bourbon whiskey
- 0.5 oz Rich simple syrup (2 parts sugar : 1 part water)
- 2 dashes Angostura bitters
- 1 Orange twist (for garnish)

**Instructions**
1) In an old-fashioned glass, combine the bourbon, simple syrup, and bitters.
2) Add ice and stir until well chilled.
3) Garnish with an orange twist.

**Glassware**: Old-fashioned glass
**Garnish**: Orange twist
**Tags**: classic, bourbon, stirred
---

### Margarita
_A refreshing and tangy cocktail that's perfect for hot days._

**Ingredients**
- 2 oz Tequila
- 1 oz Cointreau
- 1 oz Fresh lime juice
- Salt (for rimming the glass)

**Instructions**
1) Rim a margarita glass with salt.
2) Shake the tequila, cointreau, and lime juice with ice.
3) Strain into the salt-rimmed glass filled with ice.

**Glassware**: Margarita glass
**Garnish**: Lime wheel
**Tags**: classic, tequila, shaken, citrus
---

### Mojito
_A light and fresh cocktail that's perfect for summertime._

**Ingredients**
- 2 oz White rum
- 1 oz Fresh lime juice (from approximately 2 limes)
- 0.5 oz Simple syrup
- 2 sprigs Fresh mint leaves
- Club soda (to top up)

**Instructions**
1) Muddle the mint leaves and lime juice in a highball glass.
2) Add the simple syrup and white rum, stir gently.
3) Fill the glass with ice cubes, then top up with club soda.
4) Stir briefly and serve immediately.

**Glassware**: Highball glass
**Garnish**: Fresh mint sprig
**Tags**: classic, rum, muddled, refreshing
---
`;