const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
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