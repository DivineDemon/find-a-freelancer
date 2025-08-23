import { api } from "./core";
export const addTagTypes = [] as const;
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      healthCheckGet: build.query<HealthCheckGetApiResponse, HealthCheckGetApiArg>({
        query: () => ({ url: `/` }),
      }),
    }),
    overrideExisting: false,
  });
export { injectedRtkApi as appApis };
export type HealthCheckGetApiResponse = /** status 200 Successful Response */ ResponseModelHealthBase;
export type HealthCheckGetApiArg = void;
export type HealthBase = {
  status: string;
  message: string;
};
export type ResponseModelHealthBase = {
  status?: number;
  data?: HealthBase | null;
  message?: string;
};
export const { useHealthCheckGetQuery } = injectedRtkApi;
