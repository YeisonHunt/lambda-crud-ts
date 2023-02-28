import { APIGatewayEventDefaultAuthorizerContext, APIGatewayEventRequestContextWithAuthorizer, APIGatewayProxyEvent } from "aws-lambda";

export const modifiedProduct = {
    Item: {
        productID: "1",
        name: "Modified Product",
        description: "This is a modified product.",
        price: 9.99,
        images:[]
    }
}

export const mockProduct = {
    name: "Test Product",
    description: "This is a test product.",
    price: 9.99,
    productID: expect.any(String),
    images:[]
};



export const mockEvent: APIGatewayProxyEvent = {
    body: JSON.stringify({
        name: "Test Product",
        description: "This is a test product.",
        price: 9.99,
        images: []
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
    requestContext: {} as APIGatewayEventRequestContextWithAuthorizer<APIGatewayEventDefaultAuthorizerContext>,
    resource: ""
};
