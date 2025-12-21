/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ModeService {
    /**
     * Get current mode (automatic or manual)
     * Checks if Claude CLI is available and returns the current mode
     * @returns any Mode information
     * @throws ApiError
     */
    public static getApiMode(): CancelablePromise<{
        /**
         * Whether Claude CLI is available
         */
        available?: boolean;
        /**
         * Current mode
         */
        mode?: 'automatic' | 'manual';
        /**
         * Status message
         */
        message?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/mode',
        });
    }
}
