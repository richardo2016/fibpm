export interface Person {
    /**
     * @sample Richard
     */
    name?: string

    /**
     * @sample richardo2016@gmail.com
     */
    email?: string

    /**
     * @sample https://github.com/richardo2016
     */
    url?: string
}
/**
 * @see https://docs.npmjs.com/files/package.json
 * @description PackageJSON: information parsed from package.json
 */
export interface PackageJSON {
    /**
     * @sample fib-typify
     */
    name: string
    /**
     * @description valid semver without modifiers or range operator.
     * 
     * @sample 1.0.0
     */
    version: string

    /**
     * @description This helps people discover your package, as it’s listed in npm search.
     */
    description?: string

    /**
     * @description This helps people discover your package as it’s listed in npm search.
     */
    keywords?: string[]

    homepage?: string

    /**
     * @description The url to your project’s issue tracker and / or the email address to which issues should be reported. These are helpful for people who encounter issues with your package.
     * 
     * @notice if input provide one string only, treat it as bugs['url']
     */
    bugs?: {
        /**
         * @sample https://github.com/owner/project/issues
         */
        url?: string
        /**
         * @sample "project@hostname.com"
         */
        email?: string
    }

    /**
     * @notice If you’re using a common license such as BSD-2-Clause or MIT, add a current SPDX license identifier for the license you’re using
     * 
     * @see https://spdx.org/licenses/
     * 
     * @notice only resolve it from 'license' in package.json, `licenses` is deprecated.
     * 
     * @sample MIT
     * @sample SEE LICENSE in <filename>
     * @sample (ISC OR GPL-3.0)
     * @sample UNLICENSED
     */
    license?: string | 'UNLICENSED'

    /**
     * @descripiton
     * 
     * @sample {string} 'Richard <richardo2016@gmail.com> (https://github.com/richardo2016)'
     */
    author?: Person | string

    contributors?: (Person | string)[]

    /**
     * @description The optional files field is an array of file patterns that describes the entries to be included when your package is installed as a dependency.
     * 
     * @notice There are some files always included or excluded, see details in npm document.
     * 
     * @see https://docs.npmjs.com/files/package.json#files
     */
    files?: string[]

    main?: string
    browser?: string

    /**
     * @notice it could be string in package.json, transform its form to Record, for instance,
     * ```
     *  {
     *      "name": "my-program",
     *      "bin": "/path/to/program"
     *  }
     * ```
     * equals to
     * ```
     *  {
     *      "name": "my-program",
     *      "bin": {
     *          "my-program": "/path/to/program"
     *      }
     *  }
     * ```
     */
    bin?: Record<string, string>
    
    /**
     * @notice it could be string in package.json, normalize it.
     * 
     * @unsupported_now
     */
    man?: string[]
    
    /**
     * @see https://docs.npmjs.com/files/package.json#directories
     * 
     * @unsupported_now
     */
    directories?: {
        lib?: string
        bin?: PackageJSON['bin']
        man?: PackageJSON['man']
        doc?: string
        example?: string
        test?: string
    }

    /**
     * @input_sample "npm/npm"
     * @input_sample "github:user/repo"
     * @input_sample "gist:11081aaa281"
     * @input_sample "bitbucket:user/repo"
     * @input_sample "gitlab:user/repo"
     */
    repository?: {
        type: 'npm' | 'git' | 'svn',
        url: string
        directory?: string
    }

    /**
     * @description The “scripts” property is a dictionary containing script commands that are run at various times in the lifecycle of your package. The key is the lifecycle event, and the value is the command to run at that point.
     * 
     * @notice see default value in `scripts` field at https://docs.npmjs.com/files/package.json#default-values
     */
    scripts?: {
        [k: string]: string
    }
    /**
     * @description A “config” object can be used to set configuration parameters used in package scripts that persist across upgrades.
     */
    config?: {
        [k: string]: string | number | undefined | null
    }
    /**
     * @sample
     * 
     * { "dependencies" :
        { "foo" : "1.0.0 - 2.9999.9999"
        , "bar" : ">=1.0.2 <2.1.2"
        , "baz" : ">1.0.2 <=2.3.4"
        , "boo" : "2.0.1"
        , "qux" : "<1.0.0 || >=2.3.1 <2.4.5 || >=2.5.2 <3.0.0"
        , "asd" : "http://asdf.com/asdf.tar.gz"
        , "til" : "~1.2"
        , "elf" : "~1.2.3"
        , "two" : "2.x"
        , "thr" : "3.3.x"
        , "lat" : "latest"
        , "dyl" : "file:../dyl"
        }
     * }
     * @notice You may specify a tarball URL in place of a version range.
     * 
     * @notice This tarball will be downloaded and installed locally to your package at install time.
     * @notice Git urls are of the form:
     *  `<protocol>://[<user>[:<password>]@]<hostname>[:<port>][:][/]<path>[#<commit-ish> | #semver:<semver>]`
     * 
     * @sample
     *  `git+ssh://git@github.com:npm/cli.git#v1.0.27`
     *  `git+ssh://git@github.com:npm/cli#semver:^5.0`
     *  `git+https://isaacs@github.com/npm/cli.git`
     *  `git://github.com/npm/cli.git#v1.0.27 `
     * 
     * @notice you can refer to GitHub urls as just “foo”: “user/foo-project”. Just as with git URLs, a commit-ish suffix can be included
     * 
     * @sample expressjs/express
     * @sample mochajs/mocha#4727d357ea
     * @sample user/repo#feature\/branch
     * 
     * @notice you can provide a path to a local directory that contains a package. Local paths can be saved using `npm install -S` or `npm install --save`
     * 
     * @sample file:../foo/bar
     * @sample file:~/foo/bar
     * @sample file:./foo/bar
     * @sample file:/foo/bar
     */
    dependencies?: {
        [k: string]: string
    }
    devDependencies?: {
        [k: string]: string
    }
    /**
     * @description In some cases, you want to express the compatibility of your package with a host tool or library, while not necessarily doing a require of this host. This is usually referred to as a plugin. Notably, your module may be exposing a specific interface, expected and specified by the host documentation.
     */
    peerDependencies?: {
        [k: string]: string
    }
    /**
     * @alias bundleDependencies
     * 
     * @unsupported_now
     */
    bundledDependencies?: string[]
    /**
     * @notice Entries in optionalDependencies will override entries of the same name in dependencies, so it’s usually best to only put in one place.
     * 
     * @unsupported_now
     */
    optionalDependencies?: PackageJSON['dependencies']
    engines?: {
        node?: string
        npm?: string
        fpm?: string
        fibjs?: string
        fibos?: string
    }
    os?: (
        'win32' | '!win32'
        | 'linux' | '!linux'
        | 'darwin' | '!darwin'
    )[]
    cpu?: (
        'x64' | '!x64'
        | 'ia32' | '!ia32'
        | 'arm' | '!arm'
        | 'mips' | '!mips'
    )[]
    private?: boolean
    publishConfig?: {
        registry?: string
    }
}

/**
 * @description If you don’t plan to publish your package, the name and version fields are optional.
 */
export type UnpublishedPackageJSON = Omit<PackageJSON, 'name' | 'version'> & Partial<
    Pick<PackageJSON, 'name' | 'version'>
>