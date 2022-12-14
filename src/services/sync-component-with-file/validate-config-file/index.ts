import { Component } from '@atlassian/forge-graphql';

import { InvalidConfigFileError } from '../../../models/errors';
import { CompassYaml } from '../../../types';
import ConfigFileParser from './config-file-parser';

export default function validateConfigFile(file: CompassYaml, currentComponent?: Component): void {
  let validationErrors: Array<string> = [];

  if (!currentComponent) {
    validationErrors.push(`Component with id ${file?.id} not found`);
  }

  const configFileParser = new ConfigFileParser(currentComponent.type);
  configFileParser.validateConfig(file);
  validationErrors = validationErrors.concat(configFileParser.errors);
  if (validationErrors.length > 0) {
    throw new InvalidConfigFileError(validationErrors);
  }
}
