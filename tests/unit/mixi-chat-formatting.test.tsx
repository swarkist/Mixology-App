import { describe, it, expect } from 'vitest';
import * as React from 'react';
import { render } from '@testing-library/react';
import { renderAssistantMessage } from '../../client/src/components/MixiChat';

const stubRenderSafeInline = (s: string) => <>{s}</>;

describe('MixiChat formatting', () => {
  it('renders separate instruction lists starting at 1 for each recipe', () => {
    const response = `Margarita - Classic tequila cocktail\nIngredients:\n- 2 oz tequila\n- 1 oz lime juice\nInstructions:\n1. Combine ingredients.\n2. Shake with ice.\n\nOld Fashioned - Whiskey drink\nIngredients:\n- 2 oz bourbon\nInstructions:\n1. Stir with ice.\n2. Strain into glass.`;

    const { container } = render(<>{renderAssistantMessage(response, stubRenderSafeInline)}</>);
    const lists = container.querySelectorAll('ol');
    expect(lists.length).toBe(2);
    lists.forEach(list => {
      const ol = list as HTMLOListElement;
      expect(ol.start).toBe(1);
    });
  });

  it('does not treat numbered instruction steps as multiple recipes', () => {
    const response = `Strawberry Daiquiri\nIngredients:\n- 2 oz white rum\n- 1 oz lime juice\nInstructions:\n1. Muddle the strawberries.\n2. Add rum and lime juice.\n3. Shake with ice.`;

    const { container } = render(<>{renderAssistantMessage(response, stubRenderSafeInline)}</>);
    const cards = container.querySelectorAll('div.rounded-2xl');
    expect(cards.length).toBe(0);
    const lists = container.querySelectorAll('ol');
    expect(lists.length).toBe(1);
  });
});
