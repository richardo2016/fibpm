export type ISpecInOptions = string | ReturnType<typeof import('npm-package-arg')>

export type INpmHttpResponse = Class_HttpResponse & {
    url: string
}