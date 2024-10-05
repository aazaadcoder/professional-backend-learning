// now to standardize error response we will make a new api error class so that we dont have recall everytime send a error 

class ApiError extends Error{
    constructor(
        statusCode,
        message= "Something went Wrong.",
        errors= [],
        stack="",
    ){
        //super call to overwrite the parent construcotr  
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message  = message
        this.success = false;
        this.errors = errors

        if(stack){
            this.stack = stack
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}