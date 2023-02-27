import 'jest';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as yup from "yup";
import { createProduct, deleteProduct, getProduct, listProduct } from "./handlers";

const modifiedProduct = {
    Item: {
        productID: "1",
        name: "Modified Product",
        description: "This is a modified product.",
        price: 9.99,
        available: false,
    }
}

//mock jest and his region config
jest.mock("aws-sdk", () => {

    const mockDynamoScan = {
        scan: jest.fn(),
        promise: jest.fn().mockReturnValue({
            Items: [
                {
                    productID: "1",
                    name: "Test Product",
                    description: "This is a test product.",
                    price: 9.99,
                    available: true,
                },
                {
                    productID: "2",
                    name: "Test Product 2",
                    description: "This is a test product 2.",
                    price: 109.99,
                    available: false,
                }
            ]
        }),
    }

    const mockDynamoDBDelete = {
        delete: jest.fn().mockReturnValue({}),
        promise: jest.fn().mockReturnValue({
            Item: {
                productID: "1",
                name: "Test Product",
                description: "This is a test product.",
                price: 9.99,
                available: true,
            }
        }),
    };


    const mockDynamoDBGet = {
        put: jest.fn().mockReturnValue({
            Item: {
                productID: "1",
                name: "Modified Product",
                description: "This is a modified product.",
                price: 9.99,
                available: false,
            }
        }),
        promise: jest.fn().mockReturnValue({
            Item: {
                productID: "1",
                name: "Test Product",
                description: "This is a test product.",
                price: 9.99,
                available: true,
            }
        }),
    };

    const mockDynamoDBPut = {
        put: jest.fn().mockReturnValue({
            Item: {
                productID: "1",
                name: "Modified Product",
                description: "This is a modified product.",
                price: 9.99,
                available: false,
            }
        }),
        promise: jest.fn().mockReturnValue({
            Item: {
                productID: "1",
                name: "Modified Product",
                description: "This is a modified product.",
                price: 9.99,
                available: false,
            }
        }),
    };


    const mockDocumentClient = {
        put: jest.fn().mockReturnValue(mockDynamoDBPut),
        get: jest.fn().mockReturnValue(mockDynamoDBGet),
        delete: jest.fn().mockReturnValue(mockDynamoDBDelete),
        scan: jest.fn().mockReturnValue(mockDynamoScan)
    };

    return {
        config: {
            update: jest.fn(),
            region: 'us-east-2',
        },
        DynamoDB: {
            DocumentClient: jest.fn(() => mockDocumentClient),
        },
    };
});


// set up a mock event and product data for testing
// @ts-ignore checking headers
const mockEvent: APIGatewayProxyEvent = {
    body: JSON.stringify({
        name: "Test Product",
        description: "This is a test product.",
        price: 9.99,
        available: true,
    }),
    httpMethod: "POST",
    path: "/products",
    headers: {},
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    isBase64Encoded: false,
};


const mockProduct = {
    name: "Test Product",
    description: "This is a test product.",
    price: 9.99,
    available: true,
    productID: expect.any(String),
};

// create a mock of the yup object validation
const mockValidate = jest.spyOn(yup.object.prototype, "validate");

// set up the tests
describe("product CRUD tests", () => {

    beforeEach(() => {

    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should successfully create a product", async () => {
        // set up the mock response from the DynamoDB put method
        const result: APIGatewayProxyResult = await createProduct(mockEvent);

        expect(result.statusCode).toBe(201);
        expect(result.headers).toEqual({ "content-type": "application/json" });
        expect(JSON.parse(result.body)).toEqual(mockProduct);
    });

    it("should handle validation errors", async () => {
        const mockError = new yup.ValidationError("Test error message");
        mockValidate.mockRejectedValueOnce(mockError);

        const result: APIGatewayProxyResult = await createProduct(mockEvent);

        expect(result.statusCode).toBe(400);
        expect(result.headers).toEqual({ "content-type": "application/json" });
        expect(JSON.parse(result.body)).toEqual({ errors: [mockError.message] });
    });


    //  Get Product by ID tests
    it("should fetch a product by ID", async () => {
        // @ts-ignore checking headers
        const mockEvent: APIGatewayProxyEvent = {
            body: JSON.stringify({
                name: "Test Product",
                description: "This is a test product.",
                price: 9.99,
                available: true,
            }),
            httpMethod: "GET",
            path: "/products/",
            headers: {},
            multiValueHeaders: {},
            queryStringParameters: null,
            multiValueQueryStringParameters: null,
            pathParameters: { id: "1" },
            stageVariables: null,
            isBase64Encoded: false,
        };
        const result: APIGatewayProxyResult = await getProduct(mockEvent);
        expect(result.statusCode).toBe(200);
        expect(result.headers).toEqual({ "content-type": "application/json" });
        expect(JSON.parse(result.body)).toEqual(mockProduct);
    });

    it("should return 404 for a non existing product", async () => {
        // @ts-ignore checking headers
        const mockEvent: APIGatewayProxyEvent = {
            body: JSON.stringify({
                name: "Test Product",
                description: "This is a test product.",
                price: 9.99,
                available: true,
            }),
            httpMethod: "GET",
            path: "/products/",
            headers: {},
            multiValueHeaders: {},
            queryStringParameters: null,
            multiValueQueryStringParameters: null,
            pathParameters: { id: "2" },
            stageVariables: null,
            isBase64Encoded: false,
        };
        const result: APIGatewayProxyResult = await getProduct(mockEvent);
        expect(result.statusCode).toBe(404);
    });


    // Update product tests
    it("should update a product by ID", async () => {
        // @ts-ignore checking headers
        const mockEvent: APIGatewayProxyEvent = {
            body: JSON.stringify(modifiedProduct),
            httpMethod: "PUT",
            path: "/products/",
            headers: {},
            multiValueHeaders: {},
            queryStringParameters: null,
            multiValueQueryStringParameters: null,
            pathParameters: { id: "1" },
            stageVariables: null,
            isBase64Encoded: false,
        };
        const result: APIGatewayProxyResult = await getProduct(mockEvent);
        expect(result.statusCode).toBe(200);
        expect(result.headers).toEqual({ "content-type": "application/json" });
        expect(JSON.parse(result.body)).toEqual(mockProduct);


    });

    it("should not update a product if the product doesnt exist", async () => {
        // @ts-ignore checking headers
        const mockEvent: APIGatewayProxyEvent = {
            body: JSON.stringify(modifiedProduct),
            httpMethod: "PUT",
            path: "/products/",
            headers: {},
            multiValueHeaders: {},
            queryStringParameters: null,
            multiValueQueryStringParameters: null,
            pathParameters: { id: "99" },
            stageVariables: null,
            isBase64Encoded: false,
        };
        const result: APIGatewayProxyResult = await getProduct(mockEvent);
        expect(result.statusCode).toBe(404);
    });



    // Delete product tests
    it("delete a product by his ID", async () => {
        // @ts-ignore checking headers
        const mockEvent: APIGatewayProxyEvent = {
            body: JSON.stringify(modifiedProduct),
            httpMethod: "DELETE",
            path: "/products/",
            headers: {},
            multiValueHeaders: {},
            queryStringParameters: null,
            multiValueQueryStringParameters: null,
            pathParameters: { id: "1" },
            stageVariables: null,
            isBase64Encoded: false,
        };
        const result: APIGatewayProxyResult = await deleteProduct(mockEvent);
        expect(result.statusCode).toBe(204);

    });

    it("should not delete if the product doesnt exist", async () => {
        // @ts-ignore checking headers
        const mockEvent: APIGatewayProxyEvent = {
            body: JSON.stringify(modifiedProduct),
            httpMethod: "DELETE",
            path: "/products/",
            headers: {},
            multiValueHeaders: {},
            queryStringParameters: null,
            multiValueQueryStringParameters: null,
            pathParameters: { id: "99" },
            stageVariables: null,
            isBase64Encoded: false,
        };

        const NotFoundError = { "body": "{\"error\":\"not found\"}", "headers": { "content-type": "application/json" }, "statusCode": 404 }

        const result: APIGatewayProxyResult = await deleteProduct(mockEvent);
        expect(result).toStrictEqual(NotFoundError);
    });


    //create test to check the listProducts function

    it("should list all products", async () => {

        const items = {

            Items: [
                {
                    productID: "1",
                    name: "Test Product",
                    description: "This is a test product.",
                    price: 9.99,
                    available: true,
                },
                {
                    productID: "2",
                    name: "Test Product 2",
                    description: "This is a test product 2.",
                    price: 109.99,
                    available: false,
                }
            ]
        }

        // @ts-ignore checking headers
        const mockEvent: APIGatewayProxyEvent = {
            body: null,
            httpMethod: "GET",
            path: "/products",
            headers: {},
            multiValueHeaders: {},
            queryStringParameters: null,
            multiValueQueryStringParameters: null,
            stageVariables: null,
            isBase64Encoded: false,
        };
        const result: APIGatewayProxyResult = await listProduct(mockEvent);
        expect(result.statusCode).toBe(200);
        expect(result.headers).toEqual({ "content-type": "application/json" });
        expect(JSON.parse(result.body)).toEqual(items.Items);
    });


});
