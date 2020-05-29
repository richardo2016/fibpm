export interface NpmUserInfo {
    username: string
    email: string
}

export interface SearchedUserInfo {
    username: NpmUserInfo['username']
    email: NpmUserInfo['email']
}