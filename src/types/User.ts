export interface User{
    id:string,
    name:string,
    fullName:string,
    email:string,
    profileId:string,
    jwtSecureCode:string,
    accessToken:string
    generateJWT:()=>string 
}
