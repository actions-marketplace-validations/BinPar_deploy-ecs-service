import { z } from 'zod';

export const defaultCapacityProviderStrategy = [
  {
    capacityProvider: 'FARGATE_SPOT',
    weight: 1,
  },
  {
    capacityProvider: 'FARGATE',
    weight: 0,
    base: 1,
  },
];

const projectSchema = z.object({
  name: z.string(),
  environment: z.enum(['test', 'release']),
  client: z.string().default('default'),
  serviceName: z.string().optional(),
  cluster: z.string().optional(),
  alreadyExists: z.boolean().optional(),
  customCapacityProviderStrategy: z
    .array(
      z.object({
        capacityProvider: z.string(),
        weight: z.number(),
        base: z.number().optional(),
      }),
    )
    .default(defaultCapacityProviderStrategy),
  customNetworkConfiguration: z
    .object({
      awsvpcConfiguration: z.object({
        subnets: z.array(z.string()),
        securityGroups: z.array(z.string()).optional(),
        assignPublicIp: z.enum(['ENABLED', 'DISABLED']),
      }),
    })
    .optional(),
  // loadBalancers:
});

export const serviceDefinitionSchema = z.object({
  projects: z.array(projectSchema),
});

export type ServiceDefinition = z.infer<typeof serviceDefinitionSchema>;
