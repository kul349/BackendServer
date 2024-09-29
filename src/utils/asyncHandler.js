import { ApiError } from "./ApiError.js";

const asyncHandler = (requestHandler) => {
    return async (req, res, next) => {
        try {
            await requestHandler(req, res, next);
        } catch (error) {
            // Ensure statusCode is set, if not default to 500
            const statusCode = error.statusCode || 500; 
            const apiError = new ApiError(statusCode, error.message || "Internal Server Error", [], error.stack);
            
            // Log the error for debugging
            console.error("Error occurred:", apiError);

            // Send the response
            res.status(statusCode).json(apiError);
        }
    }
}

export { asyncHandler };
