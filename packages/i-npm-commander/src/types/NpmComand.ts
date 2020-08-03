import { SearchedUserInfo } from './NpmUser'
import { NpmPackageIndexedCriticalInfo, NpmPackageInfoFromBrowser } from './NpmPackage'

export type CommandActionOptions<T = {}> = {
    /**
     * @description auth token
     */
    authToken?: string
    /**
     * @description prefer action name
     */
    referer?: string
    /**
     * @description npm scope
     */
    npmScope?: string
    /**
     * @description whether always auth
     */
    alwaysAuth?: boolean
    /**
     * @description one time password
     */
    otp?: string
    
    registry?: string
} & T

export type CmderSearchActionParams = CommandActionOptions<{
    /**
     * @description page offset
     */
    offset?: number
    /**
     * @description pageSize
     */
    size?: number
    keyword: string
}>

export type CmderSearchActionResult = {
    objects: Array<{
        package: {
            name: string
            scope: 'unscoped' | string
            /**
             * @description semver
             */
            version: string
            /**
             * @description formatted UTC 0 date string
             * 
             * @sample "2014-12-10T18:36:28.290Z"
             */
            date: string
            links: {
                npm?: string
                [k: string]: string
            }
            publisher: SearchedUserInfo
            maintainers: SearchedUserInfo[]
            flags: {
                unstable?: boolean
            }
            score: {
                /**
                 * @description float value
                 * 
                 * @sample 0.08999959229076177
                 */
                final: number
                detail: {
                    quality: number
                    popularity: number
                    maintenance: number
                }
            },
            searchScore: number
        },

    }>,
    // searched number
    total: number,
    // UTC ISO time string
    time: string
}

export type ISearchPkgInfo = CmderSearchActionResult['objects'][any]

export type ISearchedPkgInfoWithDetail = Omit<CmderSearchActionResult, 'objects'> & {
    objects: (ISearchPkgInfo & {
        indexedInfo: NpmPackageInfoFromBrowser
    })[]
};