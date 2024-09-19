import { ApiError } from "./apiError.js";

const asyncHandler = (requestHandler) =>{
    return async (req, res, next) => {
        try {
           await requestHandler(req, res,next);
        } catch (error) {
            res
            .status(error.statusCode)
            .json(new ApiError(error.statusCode,error.message || 500,[],error.stack));          
        }
    }
}


export { asyncHandler }








// const asyncHandler=(fn)=>async(res,req,next)=>{
// try{
//   await fn(res,req,next);
// }catch(error){
//   res.status(err.code||500).json({message: err.message,
//     success: false,
//   })
// }
// }