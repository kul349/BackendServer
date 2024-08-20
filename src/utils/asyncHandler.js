const asyncHandler=(requestHandler)=>async()=>{
    (res,req,next) => {
        Promise.resolve(requestHandler(req,req,next)).catch(err=>next(err));
    }
}
export {asyncHandler};








// const asyncHandler=(fn)=>async(res,req,next)=>{
// try{
//   await fn(res,req,next);
// }catch(error){
//   res.status(err.code||500).json({message: err.message,
//     success: false,
//   })
// }
// }