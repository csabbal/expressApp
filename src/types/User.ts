export interface UserEntity{
    id:string,
    name:string,
    googleId?:string,
    fullName:string,
    password?:string,
    email:string,
    profileId?:string,
    jwtSecureCode:string,
    accessToken?:string
}