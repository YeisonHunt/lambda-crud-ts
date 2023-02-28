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

  it("should fetch a product by ID", async () => {
    const productId = "1";
    const response = await axios.get(`${baseUrl}/products/${productId}`);

    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      productID: productId,
      name: "Test Product",
      description: "This is a test product.",
      price: 9.99,
      images: []
    });
  });

  it("should return 404 for a non existing product", async () => {
    const productId = "999";
    try {
      await axios.get(`${baseUrl}/products/${productId}`);
    } catch (error) {
      //@ts-ignore - error.response is not defined
      expect(error.response.status).toBe(404);
    }
  });

  it("should update a product by ID", async () => {
    const productId = "1";
    const data = {
      Item: {
        productID: productId,
        name: "Modified Product",
        description: "This is a modified product.",
        price: 9.99,
        images: []
      }
    };
    const response = await axios.put(`${baseUrl}/products/${productId}`, data);

    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      productID: productId,
      name: "Modified Product",
      description: "This is a modified product.",
      price: 9.99,
      images: []
    });
  });

  it("should not update a product if the product doesnt exist", async () => {
    const productId = "999";
    const data = {
      Item: {
        productID: productId,
        name: "Modified Product",
        description: "This is a modified product.",
        price: 9.99,
        images: []
      }
    };
    try {
      await axios.put(`${baseUrl}/products/${productId}`, data);
    } catch (error) {
      //@ts-ignore - error.response is not defined
      expect(error.response.status).toBe(404);
    }
  });

  it("should delete a product by ID", async () => {
    const productId = "1";
    const response = await axios.delete(`${baseUrl}/products/${productId}`);

    expect(response.status).toBe(204);
  });

  it("should not delete if the product doesnt exist", async () => {
    const productId = "999";
    try {
      await axios.delete(`${baseUrl}/products/${productId}`);
    } catch (error) {
      //@ts-ignore - error.response is not defined
      expect(error.response.status).toBe(404);
    }
  });
});

