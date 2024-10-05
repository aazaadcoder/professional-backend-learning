

function printFxn(x){
    console.log("You are inside printFxn")
    return x;
}
const printReturnValuePlusAdd = (printFxn) => (content, addWhat)=>{
    console.log("You are inside printReturnValuePlusAdd")

    console.log(printFxn(content+addWhat));
}

console.log("start")

printReturnValuePlusAdd(printFxn)(4,6);

console.log('end')