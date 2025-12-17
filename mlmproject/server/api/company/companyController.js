const Company = require("./companyModel")

const getCompany = async() =>{
    
     let company =  await Company.findOne()
     if(!company) company = await Company.create({})
        return company
    
}

const getCompanyStats = async(req,res) =>{
    try{
const company = await getCompany();
res.json({
    success:true,
    stats:{
        name:company.name,
        totalUser:company.totalUsers,
        totalProductSales:company.totalProductSales,
        totalCommissionPaid:company.totalCommissionPaid,
        adminProfit:company.adminProfit,
        totalCyclesCompleted:company.totalCyclesCompleted
    },
    history:company.history
})
    }catch(err){
res.json({
    status:500,
    success:false,
    message:"internal server error",
    error:err.message
})
    }
}

const addJoiningFee = async(userName,amount) =>{
   
const company = await getCompany();
company.totalUsers += 1;
company.totalJoiningFees += amount;
company.adminProfit += amount;
company.history.push({type:"JOINING_FEE",amount,description:`${userName} joined with fee`})
await company.save()
   
}

const addProductSale = async(userName,amount) =>{
    const company =  await getCompany()
    company.totalProductSales += amount;
    company.adminProfit += amount;
company.history.push({type:"SALE",amount,description:`${userName} purchased product worth ${amount}`})
await company.save()
}

const addCommissionPaid = async(userName,amount) =>{
    const company = await getCompany()
    company.totalCommissionPaid += amount;
    company.adminProfit -= amount;
    company.totalCyclesCompleted += 1;
    company.history.push({type:"COMMISSION",amount,description:`${userName} received commission`})
    await company.save()
}

module.exports = {getCompanyStats,addJoiningFee,addProductSale,addCommissionPaid}