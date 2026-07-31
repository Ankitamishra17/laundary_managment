import bcrypt from "bcrypt";
import  User from "../models/User.js"
import generateToken from "../utils/generateToken.js";

//Login user

export  const login = async (req,res)=>{
    try {
        const {email, password} = req.body;

        //check required 
        if(!email || !password){
            return res.status(400).json({
                success:false,
                message:"email and password are required."
            });
        }

         // Find user  by email

            const user = await User.findOne({
                where : {email}
            });
             if (!user){
                return res.status(401).json({
                    success:false,
                    message:"Invalid email and password",
                })
             }

             //check if account is avctive
             if(!user.isActive){
                return res.status(403).json({
                    success:false,
                    message:"your account has been deactivated",
                })
             }

             //Compare password

             const isPasswordMatch = await bcrypt.compare(
              password,
              user.password  
             );

             if(!isPasswordMatch){
                return res.status(401).json({
                     success:false,
                    message:"Invalid email & password",
                   
                })
             }

             //Generate JWT Token

             const token= generateToken(user);
             
             return res.status(200).json({
                success:true,
                message:"Successfully login",
                token,

                user:{
                    id:user.id,
                    shopId:user.shopId,
                    name:user.name,
                    email:user,email,
                    phone:user.phone,
                    role:user.role,
                }
            })
        }catch(error){
            console.error("login error" ,error)

            return res.status(500).json({
                success:false,
                message:"Server Error"
            })
        }
}