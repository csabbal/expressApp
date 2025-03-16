export interface DatabaseProperties{
    type:string,
    host:string,
    port:string,
    user:string,
    password:string,
    database?:string
    env?:string
}