const DFLT_REG_NPMJS_COM = `https://registry.npmjs.com`
const DFLT_REG_NPMJS_ORG = `https://registry.npmjs.org`

const DFLT_REG_CNPMJS_ORG = `https://r.cnpmjs.org`
const DFLT_REG_NPM_TAOBAO_ORG = `https://registry.npm.taobao.org`

const DFLT_REG_YARN = `https://registry.yarnpkg.com`

export function getRegistryConfig (type: string): {
    type: 'npmjs' | 'npmjs.org' | 'npmjs.com' | 'taobao' | 'cnpm' | 'yarn'
    registry: string
} {
    const urls = <ReturnType<typeof getRegistryConfig>>{
        type: type,
        registry: DFLT_REG_NPMJS_ORG
    };
    
    switch (type) {
        case 'npmjs':
        case 'npmjs.org':
            urls.type = 'npmjs'
            urls.registry = DFLT_REG_NPMJS_ORG;
            break;
        case 'npmjs.com':
            urls.type = 'npmjs.com'
            urls.registry = DFLT_REG_NPMJS_COM;
            break;
        case 'taobao':
            urls.registry = DFLT_REG_NPM_TAOBAO_ORG;
            break;
        case 'cnpm':
            urls.registry = DFLT_REG_CNPMJS_ORG;
            break;
        case 'yarn':
            urls.registry = DFLT_REG_YARN;
            break;
    }

    return urls
}