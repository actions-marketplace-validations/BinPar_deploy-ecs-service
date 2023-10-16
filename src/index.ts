import * as core from '@actions/core';
import { readFileSync } from 'fs';
import { isAbsolute, resolve } from 'path';
import { parse } from 'yaml';
import {
  cleanNullKeys,
  maintainValidObjects,
  removeIgnoredAttributes,
} from './utils';
import { type RegisterTaskDefinitionCommandInput } from '@aws-sdk/client-ecs';
import { serviceDefinitionSchema } from './models/serviceDefinition';
import { checkServiceExistence } from './aws/checkServiceExistence';
import { deployServiceProject } from './aws/deployServiceProject';

async function run() {
  const taskDefinitionFile = core.getInput('task-definition', {
    required: true,
  });
  const servicesDefinitionFile = core.getInput('services-definition', {
    required: true,
  });
  const waitForServiceStability =
    core.getBooleanInput('wait-for-service-stability', {
      required: false,
    }) ?? false;
  const waitForServiceStabilityTimeout =
    parseInt(
      core.getInput('wait-for-minutes', {
        required: false,
      }),
      10,
    ) || 10;
  const forceNewDeploy =
    core.getBooleanInput('force-new-deploy', {
      required: false,
    }) ?? true;
  const taskDefinitionPath = isAbsolute(taskDefinitionFile)
    ? taskDefinitionFile
    : resolve(process.env.GITHUB_WORKSPACE!, taskDefinitionFile);
  const servicesDefinitionPath = isAbsolute(servicesDefinitionFile)
    ? servicesDefinitionFile
    : resolve(process.env.GITHUB_WORKSPACE!, servicesDefinitionFile);
  const taskDefinitionText = readFileSync(taskDefinitionPath, 'utf8');
  const servicesDefinitionText = readFileSync(servicesDefinitionPath, 'utf8');
  const taskDefContents = maintainValidObjects(
    removeIgnoredAttributes(
      cleanNullKeys(
        parse(taskDefinitionText) as RegisterTaskDefinitionCommandInput,
      ),
    ),
  );
  const servicesDefContents = serviceDefinitionSchema.parse(
    parse(servicesDefinitionText),
  );
  const projects = await checkServiceExistence(servicesDefContents.projects);
  for (const project of projects) {
    await deployServiceProject(
      project,
      taskDefContents,
      waitForServiceStability,
      waitForServiceStabilityTimeout,
      forceNewDeploy,
    );
  }
}

run().catch((err: Error) => {
  core.setFailed(err.message);
  core.debug(err.stack ?? '');
});
