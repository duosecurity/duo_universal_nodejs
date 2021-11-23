import { AxiosRequestConfig } from 'axios';

export type AxiosErrorOps = {
  message?: string;
  code?: string;
  config?: AxiosRequestConfig;
  request?: any;
  response?: any;
};

export class AxiosError extends Error {
  isAxiosError = true;

  code?: string;
  config?: AxiosRequestConfig;
  request?: any;
  response?: any;

  constructor(ops: AxiosErrorOps = {}) {
    super(ops.message);

    const { code, config, request, response } = ops;

    this.code = code;
    this.config = config;
    this.request = request;
    this.response = response;
  }
}
