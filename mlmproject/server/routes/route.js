const express = require("express")
const router = express.Router()
const {joinUser,login,creditWallet,getAvailableSide,getAllUser,addPurchase} = require("../api/user/userController")
const {addOwnPayment,addReceivedPayment} = require("../api/account/accountController")
const {getCompanyStats} = require("../api/company/companyController")
const {createProduct,getProducts,purchaseProduct} = require("../api/product/productController") 


router.post("/purchaseproduct",purchaseProduct)
router.post("/getproducts",getProducts)
router.post("/createproduct",createProduct);
router.post("/getcompanystats",getCompanyStats)
router.post("/addpurchase",addPurchase)
router.post("/getalluser",getAllUser)
router.post("/getavailableside",getAvailableSide)
router.post("/creditwallet",creditWallet)
router.post("/login",login)
// router.post("/getemptyleg",getLastEmptyLeg)
// router.post("/addownpayment",addOwnPayment)
// router.post("/addreceivedpayment",addReceivedPayment)
router.post("/joinuser",joinUser)

module.exports = router