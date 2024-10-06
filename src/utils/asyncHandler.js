const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };



const asynHandler3 = (requestHandler) =>{
    return Promise(err, res, req, next).resolve(requestHandler(err,req,res,next)).catch((error)=>next(error))
}
// const asyncHandler1 = (fn) => async (req, res, next)=>{
//     try{
//         await fn(req, res, next)
//     }
//     catch{
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message,
//         })
//     }
// }

//practice

// const asyncHandler2 = (fxn) => async (err, req, res, next) => {
//   try {
//     await fxn(err, res, req, next);
//   } catch {
//     res.res(err.code || 500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };
