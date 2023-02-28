// TODO 
// Create a simple integration test

import axios from "axios";

describe("Product API", () => {
  const baseUrl = "http://localhost:3000"; // replace with actual endpoint URL

  it("should create a product", async () => {
    const data = {
      name: "Test Product",
      description: "This is a test product.",
      price: 9.99,
      images: []
    };

    const response = await axios.post(`${baseUrl}/products`, data);

    expect(response.status).toBe(201);
    expect(response.data).toMatchObject({
      name: "Test Product",
      description: "This is a test product.",
      price: 9.99,
      images: []
    });
  });

  // add more test cases for other API operations
});

