/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ErrorCode } from './ErrorCode';
export type ErrorResponse = {
    success?: boolean;
    /**
     * User-friendly error message
     */
    error?: string;
    errorCode?: ErrorCode;
    /**
     * Technical error details for debugging
     */
    details?: string;
};

