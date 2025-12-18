/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RunTasksRequest } from '../models/RunTasksRequest';
import type { TaskInfo } from '../models/TaskInfo';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TasksService {
    /**
     * Run test case generation for tasks
     * @param requestBody
     * @returns any Tasks started successfully
     * @throws ApiError
     */
    public static postApiTasksRun(
        requestBody: RunTasksRequest,
    ): CancelablePromise<{
        success?: boolean;
        message?: string;
        taskIds?: Array<string>;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/tasks/run',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request`,
            },
        });
    }
    /**
     * Get task status
     * @param id Task ID (e.g., PA-12345)
     * @returns TaskInfo Task information
     * @throws ApiError
     */
    public static getApiTasks(
        id: string,
    ): CancelablePromise<TaskInfo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/tasks/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Task not found`,
            },
        });
    }
    /**
     * Get task history
     * @param limit Number of tasks to return
     * @returns any List of tasks
     * @throws ApiError
     */
    public static getApiTasksHistory(
        limit: number = 20,
    ): CancelablePromise<{
        tasks?: Array<TaskInfo>;
        total?: number;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/tasks/history',
            query: {
                'limit': limit,
            },
        });
    }
}
