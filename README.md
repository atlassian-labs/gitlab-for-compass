<img src="assets/compass-gitlab-logo.svg" alt="Compass GitLab Integration Logo" width="400" height="120" />

# Compass GitLab Integration

[![Atlassian license](https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square)](LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

This Forge app seamlessly integrates Compass with GitLab, a web-based Git repository that provides free open and private repositories, issue-following capabilities, and wikis. The integration currently supports the following operations:

- import components from GitLab projects to track them in Compass
- automate component management from an external tool with config-as-code
- sync component data, such as deployment activity, from GitLab to Compass
- automatically calculate metrics associated with component activity

## Usage

To integrate Compass with GitLab, you must first install the GitLab app in Compass. Then, you must create and retrieve your GitLab group access token to connect Compass to the GitLab account to finish setup and begin importing components from GitLab and/or managing components via config-as-code.

## Installation

Install the dependencies:
```bash
    nvm use
    yarn
    
    npm install -g @forge/cli # if you don't have it already
```

Set up the Custom UI Frontend
```bash
    # in a new tab
    yarn ui:install
   
    # build the frontend. This will also duplicate several types files that are needed in the forge backend and ui, overwriting the versions in the ui
    yarn ui:build
    
    # watch the frontend
    yarn ui:start 
```

Set up the Forge App
```bash
    # login to Forge (will require an API token)
    forge login

    # register the app (this will change the app ID in the manifest)
    forge register

    # set an environment variable this app uses:
    forge variables set FORGE_APP_ID <ID from manifest, the part after ari:cloud:ecosystem::app/>
    
    # deploy the app
    forge deploy [-f]
    # -f, or --no-verify , allows you to include modules in your manifest that aren't officially published in Forge yet
    
    # install the app on your site
    forge install [--upgrade]
    # pick "Compass" and enter your site.  <*.atlassian.net>
    # --upgrade will attempt to upgrade existing installations if the scopes or permissions have changed
    
    # run the tunnel which will listen for changes
    forge tunnel
```

### Notes

- Use the `forge deploy` command when you want to persist code changes.
- Use the `forge install` command when you want to install the app on a new site.
- Once the app is installed on a site, the site picks up the new app changes you deploy without needing to rerun the install command.
- When running `forge tunnel` you may need to add the following to your manifest.yml file's app section if you see a nullptr exception
```
app:
  runtime:
      snapshots: false
```

## Documentation

Documentation for the Compass GitLab integration can be found [here](https://developer.atlassian.com/cloud/compass/integrations/integrate-Compass-with-Gitlab/). For more information about building integrations on Compass, see [here](https://developer.atlassian.com/cloud/compass/integrations/get-started-integrating-with-Compass/).


## Tests

Use `yarn ui:test` for UI tests and `yarn test` for all other tests.

## Contributions

Contributions to the Compass GitLab Integration are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details. 

## License

Copyright (c) 2022 Atlassian and others.
Apache 2.0 licensed, see [LICENSE](LICENSE) file.

<br/> 


[![With â¤ï¸ from Atlassian](https://raw.githubusercontent.com/atlassian-internal/oss-assets/master/banner-cheers.png)](https://www.atlassian.com)