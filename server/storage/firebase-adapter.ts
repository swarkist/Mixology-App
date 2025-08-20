import { FirebaseStorage } from './firebase';
import type { IStorage } from '../storage';
import type { 
  User, InsertUser, Cocktail, InsertCocktail, Ingredient, InsertIngredient, 
  Tag, InsertTag, CocktailIngredient, CocktailInstruction, CocktailForm, IngredientForm,
  PreferredBrand, InsertPreferredBrand, PreferredBrandForm,
  Session, InsertSession, AuditLog, InsertAuditLog, MyBar, InsertMyBar,
  PasswordReset, InsertPasswordReset
} from '@shared/schema';

type IngredientWithMyBar = Ingredient & { inMyBar: boolean };

// Adapter class that implements the existing IStorage interface using Firebase
export class FirebaseStorageAdapter implements IStorage {
  private firebase: FirebaseStorage;

  constructor() {
    this.firebase = new FirebaseStorage();
  }

  // ============= USER MANAGEMENT =============
  
  async getUserById(id: number): Promise<User | undefined> {
    try {
      const doc = await this.firebase.getDocument('users', id.toString());
      if (!doc) return undefined;
      return { id, ...doc } as User;
    } catch (error) {
      console.error('Error getting user by id:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const snapshot = await this.firebase.query('users', 'email', '==', email);
      if (snapshot.empty) return undefined;
      
      const doc = snapshot.docs[0];
      return { id: parseInt(doc.id), ...doc.data() } as User;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const id = Date.now(); // Simple ID generation for Firebase
      const userData = {
        ...user,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await this.firebase.setDocument('users', id.toString(), userData);
      return { id, ...userData } as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date()
      };
      
      await this.firebase.updateDocument('users', id.toString(), updateData);
      const user = await this.getUserById(id);
      if (!user) throw new Error('User not found after update');
      
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  async promoteUserToAdmin(id: number): Promise<User> {
    return this.updateUserRole(id, 'admin');
  }

  async updateUserRole(id: number, role: 'basic' | 'admin'): Promise<User> {
    return this.updateUser(id, { role });
  }

  async updateUserStatus(id: number, is_active: boolean): Promise<User> {
    return this.updateUser(id, { is_active });
  }

  async getAllUsers(options: { 
    search?: string; 
    role?: 'basic' | 'admin'; 
    status?: boolean; 
    page?: number; 
    limit?: number; 
  } = {}): Promise<{ users: User[]; total: number }> {
    try {
      const snapshot = await this.firebase.getCollection('users');
      let users: User[] = snapshot.docs.map(doc => ({
        id: parseInt(doc.id),
        ...doc.data()
      } as User));

      // Apply filters
      if (options.search) {
        const searchTerm = options.search.toLowerCase();
        users = users.filter(user => 
          user.email.toLowerCase().includes(searchTerm)
        );
      }

      if (options.role) {
        users = users.filter(user => user.role === options.role);
      }

      if (options.status !== undefined) {
        users = users.filter(user => user.is_active === options.status);
      }

      // Sort by created_at desc
      users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const total = users.length;

      // Apply pagination
      const page = options.page || 1;
      const limit = options.limit || 20;
      const startIndex = (page - 1) * limit;
      const paginatedUsers = users.slice(startIndex, startIndex + limit);

      return { users: paginatedUsers, total };
    } catch (error) {
      console.error('Error getting all users:', error);
      return { users: [], total: 0 };
    }
  }

  async getLastActiveAdmin(): Promise<User | undefined> {
    try {
      const snapshot = await this.firebase.query('users', 'role', '==', 'admin');
      const admins = snapshot.docs.map(doc => ({
        id: parseInt(doc.id),
        ...doc.data()
      } as User));
      
      return admins.find(admin => admin.is_active) || admins[0];
    } catch (error) {
      console.error('Error getting last active admin:', error);
      return undefined;
    }
  }

  // ============= SESSION MANAGEMENT =============
  
  async createSession(session: InsertSession): Promise<Session> {
    try {
      const id = Date.now();
      const sessionData = {
        ...session,
        created_at: new Date()
      };
      
      await this.firebase.setDocument('sessions', id.toString(), sessionData);
      return { id, ...sessionData } as Session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  async getSessionByRefreshTokenHash(tokenHash: string): Promise<Session | undefined> {
    try {
      const snapshot = await this.firebase.query('sessions', 'refresh_token_hash', '==', tokenHash);
      if (snapshot.empty) return undefined;
      
      const doc = snapshot.docs[0];
      return { id: parseInt(doc.id), ...doc.data() } as Session;
    } catch (error) {
      console.error('Error getting session by token hash:', error);
      return undefined;
    }
  }

  async revokeSession(sessionId: number): Promise<void> {
    try {
      await this.firebase.deleteDocument('sessions', sessionId.toString());
    } catch (error) {
      console.error('Error revoking session:', error);
      throw new Error('Failed to revoke session');
    }
  }

  async revokeAllUserSessions(userId: number): Promise<void> {
    try {
      const snapshot = await this.firebase.query('sessions', 'user_id', '==', userId);
      const batch = this.firebase.firestore.batch();
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error revoking all user sessions:', error);
      throw new Error('Failed to revoke user sessions');
    }
  }

  async cleanExpiredSessions(): Promise<void> {
    try {
      const now = new Date();
      const snapshot = await this.firebase.getCollection('sessions');
      const batch = this.firebase.firestore.batch();
      
      snapshot.docs.forEach(doc => {
        const session = doc.data() as Session;
        if (new Date(session.expires_at) < now) {
          batch.delete(doc.ref);
        }
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error cleaning expired sessions:', error);
    }
  }

  // ============= PASSWORD RESET =============
  
  async createPasswordReset(reset: InsertPasswordReset): Promise<PasswordReset> {
    try {
      const id = Date.now();
      const resetData = {
        ...reset,
        created_at: new Date()
      };
      
      await this.firebase.setDocument('password_resets', id.toString(), resetData);
      return { id, ...resetData } as PasswordReset;
    } catch (error) {
      console.error('Error creating password reset:', error);
      throw new Error('Failed to create password reset');
    }
  }

  async getPasswordResetByTokenHash(tokenHash: string): Promise<PasswordReset | undefined> {
    try {
      const snapshot = await this.firebase.query('password_resets', 'token_hash', '==', tokenHash);
      if (snapshot.empty) return undefined;
      
      const doc = snapshot.docs[0];
      return { id: parseInt(doc.id), ...doc.data() } as PasswordReset;
    } catch (error) {
      console.error('Error getting password reset by token hash:', error);
      return undefined;
    }
  }

  async markPasswordResetAsUsed(resetId: number): Promise<void> {
    try {
      await this.firebase.updateDocument('password_resets', resetId.toString(), {
        used_at: new Date()
      });
    } catch (error) {
      console.error('Error marking password reset as used:', error);
      throw new Error('Failed to mark password reset as used');
    }
  }

  async cleanExpiredPasswordResets(): Promise<void> {
    try {
      const now = new Date();
      const snapshot = await this.firebase.getCollection('password_resets');
      const batch = this.firebase.firestore.batch();
      
      snapshot.docs.forEach(doc => {
        const reset = doc.data() as PasswordReset;
        if (new Date(reset.expires_at) < now) {
          batch.delete(doc.ref);
        }
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error cleaning expired password resets:', error);
    }
  }

  // ============= MY BAR MANAGEMENT =============
  
  async getMyBarItems(userId: number): Promise<MyBar[]> {
    try {
      const snapshot = await this.firebase.query('my_bar', 'user_id', '==', userId);
      return snapshot.docs.map(doc => ({
        id: parseInt(doc.id),
        ...doc.data()
      } as MyBar));
    } catch (error) {
      console.error('Error getting my bar items:', error);
      return [];
    }
  }

  async addToMyBar(item: InsertMyBar): Promise<MyBar> {
    try {
      const id = Date.now();
      const itemData = {
        ...item,
        created_at: new Date()
      };
      
      await this.firebase.setDocument('my_bar', id.toString(), itemData);
      return { id, ...itemData } as MyBar;
    } catch (error) {
      console.error('Error adding to my bar:', error);
      throw new Error('Failed to add to my bar');
    }
  }

  async removeFromMyBar(userId: number, type: 'ingredient' | 'brand', refId: number): Promise<void> {
    try {
      const snapshot = await this.firebase.queryMultiple('my_bar', [
        ['user_id', '==', userId],
        ['type', '==', type],
        ['ref_id', '==', refId]
      ]);
      
      if (!snapshot.empty) {
        await this.firebase.deleteDocument('my_bar', snapshot.docs[0].id);
      }
    } catch (error) {
      console.error('Error removing from my bar:', error);
      throw new Error('Failed to remove from my bar');
    }
  }

  async getUserMyBarByAdmin(userId: number): Promise<MyBar[]> {
    return this.getMyBarItems(userId);
  }

  // ============= AUDIT LOGGING =============
  
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    try {
      const id = Date.now();
      const logData = {
        ...log,
        created_at: new Date()
      };
      
      await this.firebase.setDocument('audit_logs', id.toString(), logData);
      return { id, ...logData } as AuditLog;
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw new Error('Failed to create audit log');
    }
  }

  async getAuditLogs(options: { 
    userId?: number; 
    action?: string; 
    resource?: string;
    limit?: number;
  } = {}): Promise<AuditLog[]> {
    try {
      let snapshot;
      
      if (options.userId) {
        snapshot = await this.firebase.query('audit_logs', 'user_id', '==', options.userId);
      } else {
        snapshot = await this.firebase.getCollection('audit_logs');
      }
      
      let logs = snapshot.docs.map(doc => ({
        id: parseInt(doc.id),
        ...doc.data()
      } as AuditLog));

      // Apply additional filters
      if (options.action) {
        logs = logs.filter(log => log.action === options.action);
      }

      if (options.resource) {
        logs = logs.filter(log => log.resource === options.resource);
      }

      // Sort by created_at desc
      logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Apply limit
      if (options.limit) {
        logs = logs.slice(0, options.limit);
      }

      return logs;
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return [];
    }
  }

  // Tags (basic implementation)
  async getAllTags(): Promise<Tag[]> {
    return this.firebase.getAllTags();
  }

  async getTagsByNames(names: string[]): Promise<Tag[]> {
    const allTags = await this.firebase.getAllTags();
    return allTags.filter(tag => names.includes(tag.name));
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    return this.firebase.createTag(tag);
  }

  async getMostUsedTags(limit?: number): Promise<Tag[]> {
    const tags = await this.firebase.getAllTags();
    return tags.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)).slice(0, limit || 10);
  }

  async getMostRecentTags(limit?: number): Promise<Tag[]> {
    const tags = await this.firebase.getAllTags();
    return tags.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit || 10);
  }

  async getMostUsedIngredientTags(limit = 5): Promise<Tag[]> {
    // TODO: Implement ingredient-specific tag filtering
    const tags = await this.firebase.getAllTags();
    return tags.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)).slice(0, limit);
  }

  async getMostRecentIngredientTags(limit = 5): Promise<Tag[]> {
    // TODO: Implement ingredient-specific tag filtering
    const tags = await this.firebase.getAllTags();
    return tags.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
  }

  async getMostUsedCocktailTags(limit = 5): Promise<Tag[]> {
    // TODO: Implement cocktail-specific tag filtering
    const tags = await this.firebase.getAllTags();
    return tags.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)).slice(0, limit);
  }

  async getMostRecentCocktailTags(limit = 5): Promise<Tag[]> {
    // TODO: Implement cocktail-specific tag filtering
    const tags = await this.firebase.getAllTags();
    return tags.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
  }

  async incrementTagUsage(tagId: number): Promise<void> {
    // TODO: Implement tag usage increment
  }

  async deleteTag(id: number): Promise<boolean> {
    try {
      return await this.firebase.deleteTag(id);
    } catch (error) {
      console.error('Error deleting tag:', error);
      return false;
    }
  }

  // Ingredients
  async getAllIngredients(): Promise<Ingredient[]> {
    return this.firebase.getAllIngredients();
  }

  async getIngredient(id: number): Promise<Ingredient | undefined> {
    const ingredient = await this.firebase.getIngredientById(id);
    return ingredient || undefined;
  }

  async searchIngredients(query: string): Promise<Ingredient[]> {
    const ingredients = await this.firebase.getAllIngredients();
    const lowerQuery = query.toLowerCase();
    
    // Get all tags for tag-based searching
    const allTags = await this.firebase.getAllTags();
    const tagMap = new Map(allTags.map(tag => [tag.id, tag.name.toLowerCase()]));
    
    return ingredients.filter((ingredient: Ingredient) => {
      // Search by basic ingredient properties
      const matchesBasic = ingredient.name.toLowerCase().includes(lowerQuery) ||
        ingredient.category.toLowerCase().includes(lowerQuery) ||
        (ingredient.subCategory && ingredient.subCategory.toLowerCase().includes(lowerQuery)) ||
        (ingredient.preferredBrand && ingredient.preferredBrand.toLowerCase().includes(lowerQuery)) ||
        (ingredient.description && ingredient.description.toLowerCase().includes(lowerQuery));
      
      if (matchesBasic) return true;
      
      // Search by ingredient tags - TODO: implement tag relationship lookup
      // For now, we skip tag-based searching as it requires junction table queries
      
      return false;
    });
  }

  async getIngredientsByCategory(category: string): Promise<Ingredient[]> {
    return this.firebase.getIngredientsByCategory(category);
  }

  async getIngredientsInMyBar(): Promise<Ingredient[]> {
    return this.firebase.getMyBarIngredients();
  }

  async createIngredient(ingredient: IngredientForm): Promise<Ingredient> {
    // Convert IngredientForm to InsertIngredient
    const insertIngredient: InsertIngredient & { inMyBar: boolean } = {
      name: ingredient.name,
      description: ingredient.description || null,
      imageUrl: ingredient.imageUrl || null,
      category: ingredient.category,
      subCategory: ingredient.subCategory || null,
      preferredBrand: ingredient.preferredBrand || null,
      abv: ingredient.abv || null,
      inMyBar: (ingredient as any).inMyBar || false, // Include the inMyBar field
    };
    return this.firebase.createIngredient(insertIngredient);
  }

  async updateIngredient(id: number, ingredient: Partial<InsertIngredient>): Promise<Ingredient> {
    const updated = await this.firebase.updateIngredient(id, ingredient);
    if (!updated) throw new Error('Ingredient not found');
    return updated;
  }

  async toggleMyBar(ingredientId: number): Promise<Ingredient> {
    const ingredient = await this.firebase.getIngredientById(ingredientId) as IngredientWithMyBar | null;
    if (!ingredient) throw new Error('Ingredient not found');

    const updated = await this.firebase.toggleIngredientInMyBar(ingredientId, !ingredient.inMyBar);
    if (!updated) throw new Error('Failed to update ingredient');
    return updated as Ingredient;
  }

  async incrementIngredientUsage(ingredientId: number): Promise<void> {
    await this.firebase.incrementIngredientUsage(ingredientId);
  }

  async recalculateIngredientUsageCounts(): Promise<void> {
    await this.firebase.recalculateIngredientUsageCounts();
  }

  async deleteIngredient(id: number): Promise<boolean> {
    return this.firebase.deleteIngredient(id);
  }

  async findIngredientByName(name: string): Promise<Ingredient | null> {
    const allIngredients = await this.firebase.getAllIngredients();
    const lowercaseName = name.toLowerCase();
    const found = allIngredients.find(ingredient => 
      ingredient.name.toLowerCase() === lowercaseName
    );
    return found || null;
  }

  async findTagByName(name: string): Promise<Tag | null> {
    const allTags = await this.firebase.getAllTags();
    const lowercaseName = name.toLowerCase();
    const found = allTags.find(tag => 
      tag.name.toLowerCase() === lowercaseName
    );
    return found || null;
  }

  // Cocktails
  async getAllCocktails(): Promise<Cocktail[]> {
    return this.firebase.getAllCocktails();
  }

  async getCocktail(id: number): Promise<Cocktail | undefined> {
    const cocktail = await this.firebase.getCocktailById(id);
    return cocktail || undefined;
  }

  async searchCocktails(query: string): Promise<Cocktail[]> {
    return this.firebase.searchCocktails(query);
  }

  async getFeaturedCocktails(): Promise<Cocktail[]> {
    return this.firebase.getFeaturedCocktails();
  }

  async getPopularCocktails(): Promise<Cocktail[]> {
    return this.firebase.getPopularCocktails();
  }

  async getCocktailsByIngredients(ingredientIds: number[], matchAll?: boolean): Promise<Cocktail[]> {
    // TODO: Implement ingredient-based cocktail filtering
    // For now, return all cocktails
    return this.firebase.getAllCocktails();
  }

  async createCocktail(cocktail: CocktailForm): Promise<Cocktail> {
    console.log('\n=== FIREBASE ADAPTER createCocktail START ===');
    console.log('Adapter received cocktail data:', JSON.stringify(cocktail, null, 2));
    console.log('Cocktail data keys:', Object.keys(cocktail));
    
    // Pass ALL cocktail data to Firebase, including junction table data
    const createdCocktail = await this.firebase.createCocktail(cocktail as any);
    
    console.log('=== FIREBASE ADAPTER createCocktail COMPLETE ===\n');
    return createdCocktail;
  }

  async updateCocktail(id: number, cocktail: Partial<InsertCocktail> | CocktailForm): Promise<Cocktail> {
    const updated = await this.firebase.updateCocktail(id, cocktail as any);
    if (!updated) throw new Error('Cocktail not found');
    return updated;
  }

  async deleteCocktail(id: number): Promise<boolean> {
    return this.firebase.deleteCocktail(id);
  }

  async toggleFeatured(cocktailId: number): Promise<Cocktail> {
    const cocktail = await this.firebase.getCocktailById(cocktailId);
    if (!cocktail) throw new Error('Cocktail not found');
    
    const updated = await this.firebase.toggleCocktailFeatured(cocktailId, !cocktail.isFeatured);
    if (!updated) throw new Error('Failed to update cocktail');
    return updated;
  }

  async incrementPopularity(cocktailId: number): Promise<Cocktail> {
    const updated = await this.firebase.incrementCocktailPopularity(cocktailId);
    if (!updated) throw new Error('Cocktail not found');
    return updated;
  }

  async resetPopularity(cocktailId: number): Promise<Cocktail> {
    const updated = await this.firebase.resetCocktailPopularity(cocktailId);
    if (!updated) throw new Error('Cocktail not found');
    return updated;
  }

  // Cocktail details (basic implementation)
  async getCocktailWithDetails(id: number): Promise<{
    cocktail: Cocktail;
    ingredients: Array<CocktailIngredient & { ingredient: Ingredient }>;
    instructions: CocktailInstruction[];
    tags: Tag[];
  } | undefined> {
    const cocktail = await this.firebase.getCocktailById(id);
    if (!cocktail) return undefined;

    // Get related data
    const ingredients = await this.firebase.getCocktailIngredients(id);
    const instructions = await this.firebase.getCocktailInstructions(id);
    const tags = await this.firebase.getCocktailTags(id);

    // Enrich ingredients with ingredient details
    const enrichedIngredients = await Promise.all(
      ingredients.map(async (ci) => {
        const ingredient = await this.firebase.getIngredientById(ci.ingredientId);
        return { ...ci, ingredient: ingredient! };
      })
    );

    return {
      cocktail,
      ingredients: enrichedIngredients,
      instructions,
      tags,
    };
  }

  // =================== PREFERRED BRANDS ===================
  async getAllPreferredBrands(userId: number): Promise<PreferredBrand[]> {
    return this.firebase.getAllPreferredBrands(userId);
  }

  async getPreferredBrand(id: number): Promise<PreferredBrand | undefined> {
    return this.firebase.getPreferredBrand(id);
  }

  async searchPreferredBrands(query: string, userId: number): Promise<PreferredBrand[]> {
    return this.firebase.searchPreferredBrands(query, userId);
  }

  async getPreferredBrandsInMyBar(userId: number): Promise<PreferredBrand[]> {
    try {
      // Get user's My Bar items for brands
      const myBarItems = await this.getMyBarItems(userId);
      const brandIds = myBarItems
        .filter(item => item.type === 'brand')
        .map(item => item.ref_id);

      if (brandIds.length === 0) {
        return [];
      }

      // Get the actual brand details for those IDs
      const brands = await Promise.all(
        brandIds.map(async (id) => {
          const brand = await this.firebase.getPreferredBrand(id);
          return brand;
        })
      );

      return brands.filter((brand): brand is PreferredBrand => brand !== null);
    } catch (error) {
      console.error('Error getting preferred brands in My Bar:', error);
      return [];
    }
  }

  async createPreferredBrand(brand: PreferredBrandForm, userId: number): Promise<PreferredBrand> {
    return this.firebase.createPreferredBrand({ ...brand, user_id: userId });
  }

  async updatePreferredBrand(id: number, brand: Partial<InsertPreferredBrand>): Promise<PreferredBrand> {
    const updated = await this.firebase.updatePreferredBrand(id, brand);
    if (!updated) throw new Error('Preferred brand not found');
    return updated;
  }

  async deletePreferredBrand(id: number): Promise<boolean> {
    return this.firebase.deletePreferredBrand(id);
  }

  async toggleMyBarBrand(brandId: number): Promise<PreferredBrand> {
    return this.firebase.toggleMyBarBrand(brandId);
  }

  async incrementPreferredBrandUsage(brandId: number): Promise<void> {
    await this.firebase.incrementPreferredBrandUsage(brandId);
  }

  async recalculatePreferredBrandUsageCounts(): Promise<void> {
    await this.firebase.recalculatePreferredBrandUsageCounts();
  }

  async findPreferredBrandByName(name: string): Promise<PreferredBrand | null> {
    return this.firebase.findPreferredBrandByName(name);
  }

  async getPreferredBrandWithDetails(id: number): Promise<{
    brand: PreferredBrand;
    ingredients: Ingredient[];
    tags: Tag[];
  } | undefined> {
    return this.firebase.getPreferredBrandWithDetails(id);
  }

  async getIngredientWithDetails(id: number): Promise<{
    ingredient: Ingredient;
    preferredBrands: PreferredBrand[];
    tags: Tag[];
  } | undefined> {
    return this.firebase.getIngredientWithDetails(id);
  }

  // Association management methods
  async associateIngredientWithPreferredBrand(ingredientId: number, preferredBrandId: number): Promise<void> {
    await this.firebase.associateIngredientWithPreferredBrand(ingredientId, preferredBrandId);
  }

  async removeIngredientFromPreferredBrand(ingredientId: number, preferredBrandId: number): Promise<void> {
    await this.firebase.removeIngredientFromPreferredBrand(ingredientId, preferredBrandId);
  }
}