import { APIRequestContext } from '@playwright/test';

export async function apiLogin(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<{ success: boolean; cookies?: string[] }> {
  const response = await request.post('/api/auth/login', {
    data: { email, password },
  });
  
  if (response.ok()) {
    const cookies = response.headers()['set-cookie'];
    return { success: true, cookies: cookies ? [cookies] : [] };
  }
  
  return { success: false };
}

export async function apiRegister(
  request: APIRequestContext,
  data: { username: string; email: string; password: string }
): Promise<{ success: boolean; userId?: string }> {
  const response = await request.post('/api/auth/register', {
    data,
  });
  
  if (response.ok()) {
    const body = await response.json();
    return { success: true, userId: body.userId || body.id };
  }
  
  return { success: false };
}

export async function apiLogout(request: APIRequestContext): Promise<boolean> {
  const response = await request.post('/api/auth/logout');
  return response.ok();
}

export async function apiGetCocktails(
  request: APIRequestContext
): Promise<any[]> {
  const response = await request.get('/api/cocktails');
  if (response.ok()) {
    return await response.json();
  }
  return [];
}

export async function apiGetIngredients(
  request: APIRequestContext
): Promise<any[]> {
  const response = await request.get('/api/ingredients');
  if (response.ok()) {
    return await response.json();
  }
  return [];
}

export async function apiCreateCocktail(
  request: APIRequestContext,
  cocktail: any
): Promise<{ success: boolean; id?: string }> {
  const response = await request.post('/api/cocktails', {
    data: cocktail,
  });
  
  if (response.ok()) {
    const body = await response.json();
    return { success: true, id: body.id };
  }
  
  return { success: false };
}

export async function apiDeleteCocktail(
  request: APIRequestContext,
  id: string
): Promise<boolean> {
  const response = await request.delete(`/api/cocktails/${id}`);
  return response.ok();
}

export async function apiCreateIngredient(
  request: APIRequestContext,
  ingredient: any
): Promise<{ success: boolean; id?: string }> {
  const response = await request.post('/api/ingredients', {
    data: ingredient,
  });
  
  if (response.ok()) {
    const body = await response.json();
    return { success: true, id: body.id };
  }
  
  return { success: false };
}

export async function apiDeleteIngredient(
  request: APIRequestContext,
  id: string
): Promise<boolean> {
  const response = await request.delete(`/api/ingredients/${id}`);
  return response.ok();
}

export async function apiHealthCheck(
  request: APIRequestContext
): Promise<boolean> {
  try {
    const response = await request.get('/api/cocktails');
    return response.ok();
  } catch {
    return false;
  }
}
