# XCM Demo Web App

## Development

### Pre-requisite: Configure Fontawesome Pro 
The icons we use this repo are through paid subscription, so a secret needs to be set before package installation.

**Option 1: NPM Global Set up**
Globally set fontawesome secret in npm, so it works in any project.
```
`npm config set "@fortawesome:registry" https://npm.fontawesome.com/`

`npm config set "//npm.fontawesome.com/:_authToken" 56D593CA-ADCD-46AC-99D9-8762640B6BD9`
```

**Option 2: Set in this project**
If you’d prefer a per-project setting, create a `.npmrc` file in the root of the project (where you have your package.json file).

```
 @fortawesome:registry=https://npm.fontawesome.com/
//npm.fontawesome.com/:_authToken=<your_token>
```

### Install dependencies
Run `yarn`

### Start up the program
Run `yarn dev` for local dev run, and a browser tab of `http://localhost:3005/` should pop up.

### Code Formatting with ESLint
`yarn run eslint filename.js`

## Configuration
Please create the following configuration files in the project directory and refer to the `.env` file for configuration.

The default values ​​of variables set in `.env` will be overridden by variables in the following files or environment variables set externally.

1. `.env`

	It is the default configuration file, and running `yarn run dev` will read it.

2. `.env.product`. 

	It is read when `yarn run export` is run.

By default environment variables are only available in the Node.js environment, meaning they won't be exposed to the browser.

In order to expose a variable to the browser you have to prefix the variable with `NEXT_PUBLIC_`.

**Note: In some static resources servers (such as Amazon S3), next.js cannot correctly route the access path to the corresponding page. So we need to set `ASSET_PREFIX` in order to generate the directory corresponding to the page.**

## Deployment
In order to create correct subpath URL so users could visit https://oak.tech/team directly, we need to specify the target domain name as `prefix` in `./next.config.js`. The static files in `./out` folder is generated by separate yarn commands for `staging` and `production` environments.

1. For `production` environment, run `yarn export` to generate static files in `./out` folder.
2. For deployment to custom domain, run `./node_modules/dotenv-cli/cli.js -e <config_file> -- bash -c yarn export`.
