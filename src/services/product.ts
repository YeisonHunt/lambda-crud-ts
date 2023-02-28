import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";
import { v4 } from "uuid";
import * as yup from "yup";
import { secrets } from "../helpers/secrets";

const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = "ProductsTable";
const headers = {
  "content-type": "application/json",
};


// Validation schema
const schema = yup.object().shape({
  name: yup.string().required(),
  description: yup.string().required(),
  price: yup.number().required(),
});

export const addImageToProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  try {

    const BUCKET_NAME = secrets.S3_BUCKET_NAME;
    const s3 = new AWS.S3({
      accessKeyId: secrets.S3_ACCESS_KEY_ID,
      secretAccessKey: secrets.S3_SECRET_ACCESS_KEY
    });

    const id = event.pathParameters?.id as string;

    const product = await fetchProductById(id);

    // Check if there are any files in the event
    if (event?.isBase64Encoded && event?.body) {
      const mimeType = event.headers["content-type"];
      const fileName = mimeType ? `image_${product.productID}.${mimeType.split("/")[1]}` : "";

      const base64Data = event.body ? event.body.replace(/^data:image\/\w+;base64,/, "") : "";
      const buffer = Buffer.from(base64Data, "base64");

      const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentEncoding: "base64",
        ContentType: mimeType,
      };

      const s3Object = await s3.upload(params).promise();

      // Add S3 object URL to product object
      product.images.push(s3Object.Location);
    }

    await docClient
      .put({
        TableName: tableName,
        Item: product,
      })
      .promise();

    return {
      statusCode: 200,
      headers,
      body: "Image added successfully",
    };
  } catch (e) {
    return handleError(e);
  }
}

export const createProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {


  try {
    const reqBody = JSON.parse(event.body as string);

    await schema.validate(reqBody, { abortEarly: false });

    const product = {
      ...reqBody,
      productID: v4(),
    };

    await docClient
      .put({
        TableName: tableName,
        Item: product,
      })
      .promise();

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(product),
    };
  } catch (e) {
    return handleError(e);
  }
};

export class HttpError extends Error {
  constructor(public statusCode: number, body: Record<string, unknown> = {}) {
    super(JSON.stringify(body));
  }
}

const handleError = (e: unknown) => {
  if (e instanceof yup.ValidationError) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        errors: e.errors,
      }),
    };
  }

  if (e instanceof SyntaxError) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `invalid request body format : "${e.message}"` }),
    };
  }

  if (e instanceof HttpError) {
    return {
      statusCode: e.statusCode,
      headers,
      body: e.message,
    };
  }

  throw e;
};

const fetchProductById = async (id: string) => {
  const output = await docClient
    .get({
      TableName: tableName,
      Key: {
        productID: id,
      },
    })
    .promise();

  if (!output.Item || (output && output.Item && output.Item.productID !== id)) {
    throw new HttpError(404, { error: "not found" });
  }

  return output.Item;
};

export const getProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  try {
    const product = await fetchProductById(event.pathParameters?.id as string);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(product),
    };
  } catch (e) {
    return handleError(e);
  }
};

export const updateProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id as string;

    await fetchProductById(id);

    const reqBody = JSON.parse(event.body as string);

    await schema.validate(reqBody, { abortEarly: false });

    const product = {
      ...reqBody,
      productID: id,
    };

    const updateResult = await docClient
      .put({
        TableName: tableName,
        Item: product,
      })
      .promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updateResult),
    };
  } catch (e) {
    return handleError(e);
  }
};

export const deleteProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id as string;

    await fetchProductById(id);

    await docClient
      .delete({
        TableName: tableName,
        Key: {
          productID: id,
        },
      })
      .promise();

    return {
      statusCode: 204,
      body: "",
    };
  } catch (e) {
    return handleError(e);
  }
};

export const listProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const output = await docClient
    .scan({
      TableName: tableName,
    })
    .promise();

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(output.Items),
  };
};
