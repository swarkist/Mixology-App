import { describe, it, expect, beforeAll, afterAll } from "vitest";

describe("Preferred Brands Ownership Security", () => {
  let user1Cookies: string;
  let user2Cookies: string;
  let adminCookies: string;
  let user1BrandId: number;
  let user2BrandId: number;

  beforeAll(async () => {
    // Create test users and get their auth cookies
    const user1Response = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "user1@ownership.test",
        password: "password123",
        role: "basic"
      })
    });
    user1Cookies = user1Response.headers.get("set-cookie") || "";

    const user2Response = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "user2@ownership.test", 
        password: "password123",
        role: "basic"
      })
    });
    user2Cookies = user2Response.headers.get("set-cookie") || "";

    const adminResponse = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@ownership.test",
        password: "password123", 
        role: "admin"
      })
    });
    adminCookies = adminResponse.headers.get("set-cookie") || "";

    // Create preferred brands for each user
    const user1BrandResponse = await fetch("http://localhost:5000/api/preferred-brands", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": user1Cookies
      },
      body: JSON.stringify({
        name: "User1 Brand",
        proof: 40,
        notes: "User 1's private brand"
      })
    });
    const user1Brand = await user1BrandResponse.json();
    user1BrandId = user1Brand.id;

    const user2BrandResponse = await fetch("http://localhost:5000/api/preferred-brands", {
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
        "Cookie": user2Cookies
      },
      body: JSON.stringify({
        name: "User2 Brand",
        proof: 43,
        notes: "User 2's private brand"
      })
    });
    const user2Brand = await user2BrandResponse.json();
    user2BrandId = user2Brand.id;
  });

  afterAll(async () => {
    // Cleanup test users (admin endpoints for cleanup)
    await fetch(`http://localhost:5000/api/auth/admin/cleanup-test-users`, {
      method: "DELETE",
      headers: { "x-admin-key": "dev-admin-key-2024" }
    });
  });

  describe("PATCH /api/preferred-brands/:id", () => {
    it("should allow users to update their own brands", async () => {
      const response = await fetch(`http://localhost:5000/api/preferred-brands/${user1BrandId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json", 
          "Cookie": user1Cookies
        },
        body: JSON.stringify({
          name: "Updated User1 Brand",
          proof: 45
        })
      });

      expect(response.status).toBe(200);
      const updated = await response.json();
      expect(updated.name).toBe("Updated User1 Brand");
      expect(updated.proof).toBe(45);
    });

    it("should prevent users from updating other users' brands", async () => {
      const response = await fetch(`http://localhost:5000/api/preferred-brands/${user1BrandId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Cookie": user2Cookies  // User2 trying to update User1's brand
        },
        body: JSON.stringify({
          name: "Malicious Update",
          proof: 99
        })
      });

      expect(response.status).toBe(403);
      const error = await response.json();
      expect(error.message).toContain("Access denied");
    });

    it("should prevent admins from updating other users' brands", async () => {
      const response = await fetch(`http://localhost:5000/api/preferred-brands/${user1BrandId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Cookie": adminCookies  // Admin trying to update User1's brand
        },
        body: JSON.stringify({
          name: "Admin Override Attempt",
          proof: 88
        })
      });

      expect(response.status).toBe(403);
      const error = await response.json();
      expect(error.message).toContain("Access denied");
    });
  });

  describe("DELETE /api/preferred-brands/:id", () => {
    it("should prevent users from deleting other users' brands", async () => {
      const response = await fetch(`http://localhost:5000/api/preferred-brands/${user2BrandId}`, {
        method: "DELETE",
        headers: {
          "Cookie": user1Cookies  // User1 trying to delete User2's brand
        }
      });

      expect(response.status).toBe(403);
      const error = await response.json();
      expect(error.message).toContain("Access denied");
    });

    it("should prevent admins from deleting other users' brands", async () => {
      const response = await fetch(`http://localhost:5000/api/preferred-brands/${user2BrandId}`, {
        method: "DELETE", 
        headers: {
          "Cookie": adminCookies  // Admin trying to delete User2's brand
        }
      });

      expect(response.status).toBe(403);
      const error = await response.json();
      expect(error.message).toContain("Access denied");
    });

    it("should allow users to delete their own brands", async () => {
      const response = await fetch(`http://localhost:5000/api/preferred-brands/${user2BrandId}`, {
        method: "DELETE",
        headers: {
          "Cookie": user2Cookies  // User2 deleting their own brand
        }
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.message).toContain("deleted successfully");
    });
  });

  describe("Data Isolation Verification", () => {
    it("should ensure modified brand belongs to correct user", async () => {
      // Verify User1's brand was updated correctly and still belongs to them
      const response = await fetch("http://localhost:5000/api/preferred-brands", {
        headers: { "Cookie": user1Cookies }
      });

      expect(response.status).toBe(200);
      const brands = await response.json();
      const user1Brand = brands.find((b: any) => b.id === user1BrandId);
      
      expect(user1Brand).toBeDefined();
      expect(user1Brand.name).toBe("Updated User1 Brand");
      expect(user1Brand.proof).toBe(45);
    });

    it("should ensure users cannot see other users' brands", async () => {
      // User2 should not see User1's brands (User2's brand was deleted)
      const response = await fetch("http://localhost:5000/api/preferred-brands", {
        headers: { "Cookie": user2Cookies }
      });

      expect(response.status).toBe(200);
      const brands = await response.json();
      expect(brands.length).toBe(0); // User2 has no brands left
      
      // Ensure User1's brand is not visible to User2
      const user1Brand = brands.find((b: any) => b.id === user1BrandId);
      expect(user1Brand).toBeUndefined();
    });
  });
});