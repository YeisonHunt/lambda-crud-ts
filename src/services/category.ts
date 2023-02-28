import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";
import { v4 } from "uuid";
import { secrets } from "../helpers/secrets";
import { handleError, HttpError, schema } from "../helpers/utils";

const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = "CategoriesTable";
const headers = {
    "content-type": "application/json",
};



export const addImageToCategory = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    try {

        const BUCKET_NAME = secrets.S3_BUCKET_NAME;
        const s3 = new AWS.S3({
            accessKeyId: secrets.S3_ACCESS_KEY_ID,
            secretAccessKey: secrets.S3_SECRET_ACCESS_KEY
        });

        const id = event.pathParameters?.id as string;

        const category = await fetchCategoryById(id);

        // Check if there are any files in the event
        if (event?.isBase64Encoded && event?.body) {
            const mimeType = event.headers["content-type"];
            const fileName = mimeType ? `image_${category.categoryID}.${mimeType.split("/")[1]}` : "";

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

            // Add S3 object URL to category object
            category.image = s3Object.Location;
        }

        await docClient
            .put({
                TableName: tableName,
                Item: category,
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

export const createCategory = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {


    try {
        const reqBody = JSON.parse(event.body as string);

        await schema.validate(reqBody, { abortEarly: false });

        const category = {
            ...reqBody,
            categoryID: v4(),
        };

        await docClient
            .put({
                TableName: tableName,
                Item: category,
            })
            .promise();

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify(category),
        };
    } catch (e) {
        return handleError(e);
    }
};


const fetchCategoryById = async (id: string) => {
    const output = await docClient
        .get({
            TableName: tableName,
            Key: {
                categoryID: id,
            },
        })
        .promise();

    if (!output.Item || (output && output.Item && output.Item.categoryID !== id)) {
        throw new HttpError(404, { error: "not found" });
    }

    return output.Item;
};

export const getCategory = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    try {
        const category = await fetchCategoryById(event.pathParameters?.id as string);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(category),
        };
    } catch (e) {
        return handleError(e);
    }
};

export const updateCategory = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const id = event.pathParameters?.id as string;

        await fetchCategoryById(id);

        const reqBody = JSON.parse(event.body as string);

        await schema.validate(reqBody, { abortEarly: false });

        const category = {
            ...reqBody,
            categoryID: id,
        };

        const updateResult = await docClient
            .put({
                TableName: tableName,
                Item: category,
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

export const deleteCategory = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const id = event.pathParameters?.id as string;

        await fetchCategoryById(id);

        await docClient
            .delete({
                TableName: tableName,
                Key: {
                    categoryID: id,
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

export const listCategory = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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
