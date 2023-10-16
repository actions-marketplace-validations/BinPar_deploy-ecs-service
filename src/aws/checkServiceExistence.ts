import { DescribeServicesCommand } from '@aws-sdk/client-ecs';
import { getECSClient } from './getECSClient';
import type { ServiceDefinition } from '../models/serviceDefinition';
import { getServiceName, groupProjectsByClusterName } from '../utils';

export async function checkServiceExistence(
  projects: ServiceDefinition['projects'],
) {
  const ecsClient = getECSClient();
  const groupedProjects = groupProjectsByClusterName(projects);
  for (const [clusterName, projects] of groupedProjects.entries()) {
    const describeServiceResponse = await ecsClient.send(
      new DescribeServicesCommand({
        cluster: clusterName,
        services: projects.map(getServiceName),
      }),
    );
    describeServiceResponse.services?.forEach((service) => {
      const project = projects.find(
        (project) => getServiceName(project) === service.serviceName,
      );
      if (!project) {
        return;
      }
      project.alreadyExists = !!service;
    });
  }
  return projects;
}
