/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AnalyticsType } from './AnalyticsType';
import type { TaskStatus } from './TaskStatus';
export type TaskInfo = {
    id?: string;
    title?: string;
    status?: TaskStatus;
    analyticsType?: AnalyticsType;
    timestamp?: number;
    testCasesCreated?: number;
    error?: string;
};

