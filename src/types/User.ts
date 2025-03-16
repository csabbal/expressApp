export interface User extends UserEntity{
    generateJWT: (secret:string)=>Promise<string> 
}

export interface UserEntity{
    id:string,
    name:string,
    googleId?:string,
    fullName:string,
    email:string,
    profileId?:string,
    jwtSecureCode:string,
    accessToken?:string
}