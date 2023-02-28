import * as yup from "yup"; 

const headers = {
    "content-type": "application/json",
};

// Validation schema
export const schema = yup.object().shape({
    name: yup.string().required(),
    description: yup.string().required(),
});
  
  
export class HttpError extends Error {
constructor(public statusCode: number, body: Record<string, unknown> = {}) {
    super(JSON.stringify(body));
}
}


export const handleError = (e: unknown) => {
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