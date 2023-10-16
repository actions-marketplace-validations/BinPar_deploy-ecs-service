import { getInput } from '@actions/core';
import { ECSClient } from '@aws-sdk/client-ecs';

let ecsClient: ECSClient;

export function getECSClient() {
  if (!ecsClient) {
    const region = getInput('region', { required: false }) || 'eu-west-1';
    ecsClient = new ECSClient({
      region,
      customUserAgent: 'aws-ecs-deploy-service-github-action',
    });
  }
  return ecsClient;
}
