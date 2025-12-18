/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GeneratePromptRequest } from '../models/GeneratePromptRequest';
import type { PromptResponse } from '../models/PromptResponse';
import type { SaveResponseRequest } from '../models/SaveResponseRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PromptsService {
    /**
     * Generate AI prompt for a task
     * @param requestBody
     * @returns PromptResponse Prompt generated successfully
     * @throws ApiError
     */
    public static postApiPromptsGenerate(
        requestBody: GeneratePromptRequest,
    ): CancelablePromise<PromptResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/prompts/generate',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request`,
                404: `Task not found in Jira`,
            },
        });
    }
    /**
     * Save AI response from user
     * @param requestBody
     * @returns any Response saved successfully
     * @throws ApiError
     */
    public static postApiPromptsResponse(
        requestBody: SaveResponseRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/prompts/response',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request`,
            },
        });
    }
    /**
     * Get generated prompt for a task
     * @param taskId
     * @returns PromptResponse Prompt retrieved
     * @throws ApiError
     */
    public static getApiPrompts(
        taskId: string,
    ): CancelablePromise<PromptResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/prompts/{taskId}',
            path: {
                'taskId': taskId,
            },
            errors: {
                404: `Prompt not found`,
            },
        });
    }
}
