import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => 
{
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })    // will not validate the required fields in user model before saving

    return { refreshToken, accessToken }

  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access tokens")
  }
}

const registerUser = asyncHandler( async (req, res) => {
  // res.status(200).json({
  //   message: "ok"
  // })

  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar (multer upload check)
  // if available - upload them to cloudinary, avatar (cloudinary upload check)
  // create user object - create entry in db
  // remove password and refresh token field from response (to frontend)
  // check for user creation
  // if created -> return response
  // else -> error

  // data handling - json
  // form and json data from req.body
  const { fullname, email, username, password } = req.body

  // console.log("email: ", email);

  // if(fullname === ""){
  //   throw new ApiError(400, "fullname is required")
  // }

  if(
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ){
    throw new ApiError(400, "All fields are required")
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  })

  if(existedUser){
    throw new ApiError(409, "User with email or username already exists")
  }

  // middleware add more fields to req.
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;

  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){

    coverImageLocalPath = req.files.coverImage[0].path
  }

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(400, "Avatar file is required")
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser){
    throw new ApiError(500, "Something went wrong while registering the user")
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully")
  )
})

const loginUser = asyncHandler( async (req, res) => {
  // req body -> data
  // username or email
  // find the user
  // if user not found : say user to register
  // else password check
  // if password wrong : message display
  // if password matched : access and refresh token generate and give to user
  // send secure cookies
  // send response : successfully logged in

  const { email, username, password } = req.body

  if(!(username || email)){
    throw new ApiError(400, "username or email is required")
  }

  const user = await User.findOne({
    $or: [{ username }, { email }]
  })

  if(!user){
    throw new ApiError(404, "User does not exist")
  }

  // User : mongoose object : findOne
  // user : our instance of object : methods made by us

  const isPasswordValid = await user.isPasswordCorrect(password)

  if(!isPasswordValid){
    throw new ApiError(401, "Invalid user credentials")
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  // cookies only modifiable by server not be frontend
  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200, 
      {
        user: loggedInUser,
        accessToken, 
        refreshToken   // user wish to save accessToken and refreshToken on his end on localStorage
      },
      "User logged In Successfully"
    )
  )
})

// req, res : cookies add , files add by multer
const logoutUser = asyncHandler( async (req, res) => {
  // cookies clear
  // refresh token reset

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true     // res will have new updated value
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler( async (req, res) => {
  
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken  // mobile application

  if(!incomingRefreshToken){

    throw new ApiError(401, "unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
  
    const user = await User.findById(decodedToken?._id)
  
    if(!user){
      throw new ApiError(401, "Invalid refresh token")
    }
  
    // encoded refresh token : user database
    // decoded refresh token : incoming 
  
    if(incomingRefreshToken !== user?.refreshToken){
  
      throw new ApiError(401, "Refresh token is expired or used")
    }
  
    const options = {
      httpOnly: true,
      secure: true
    }
  
    const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)
  
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken: newRefreshToken },
        "Access token refreshed"
      )
    )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }
})

export { 
  registerUser, 
  loginUser,
  logoutUser,
  refreshAccessToken
}