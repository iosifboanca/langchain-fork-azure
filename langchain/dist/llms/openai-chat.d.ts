import { ChatCompletionRequestMessage, CreateChatCompletionRequest, ConfigurationParameters, CreateChatCompletionResponse } from "openai";
import { AzureOpenAIInput, Kwargs, OpenAICallOptions, OpenAIChatInput } from "types/open-ai-types.js";
import type { StreamingAxiosConfiguration } from "../util/axios-types.js";
import { BaseLLMParams, LLM } from "./base.js";
import { CallbackManagerForLLMRun } from "../callbacks/manager.js";
/**
 * Wrapper around OpenAI large language models that use the Chat endpoint.
 *
 * To use you should have the `openai` package installed, with the
 * `OPENAI_API_KEY` environment variable set.
 *
 * To use with Azure you should have the `openai` package installed, with the
 * `AZURE_OPENAI_API_KEY`,
 * `AZURE_OPENAI_API_INSTANCE_NAME`,
 * `AZURE_OPENAI_API_DEPLOYMENT_NAME`
 * and `AZURE_OPENAI_API_VERSION` environment variable set.
 *
 * @remarks
 * Any parameters that are valid to be passed to {@link
    * https://platform.openai.com/docs/api-reference/chat/create |
 * `openai.createCompletion`} can be passed through {@link modelKwargs}, even
 * if not explicitly available on this class.
 *
 * @augments BaseLLM
 * @augments OpenAIInput
 * @augments AzureOpenAIChatInput
 */
export declare class OpenAIChat extends LLM implements OpenAIChatInput, AzureOpenAIInput {
    CallOptions: OpenAICallOptions;
    temperature: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    n: number;
    logitBias?: Record<string, number>;
    maxTokens?: number;
    modelName: string;
    prefixMessages?: ChatCompletionRequestMessage[];
    modelKwargs?: Kwargs;
    timeout?: number;
    stop?: string[];
    streaming: boolean;
    azureOpenAIApiVersion?: string;
    azureOpenAIApiKey?: string;
    azureOpenAIApiInstanceName?: string;
    azureOpenAIApiDeploymentName?: string;
    private client;
    private clientConfig;
    constructor(fields?: Partial<OpenAIChatInput> & Partial<AzureOpenAIInput> & BaseLLMParams & {
        openAIApiKey?: string;
    }, configuration?: ConfigurationParameters);
    /**
     * Get the parameters used to invoke the model
     */
    invocationParams(): Omit<CreateChatCompletionRequest, "messages"> & Kwargs;
    /** @ignore */
    _identifyingParams(): {
        apiKey?: string | Promise<string> | ((name: string) => string) | ((name: string) => Promise<string>) | undefined;
        organization?: string | undefined;
        username?: string | undefined;
        password?: string | undefined;
        accessToken?: string | Promise<string> | ((name?: string | undefined, scopes?: string[] | undefined) => string) | ((name?: string | undefined, scopes?: string[] | undefined) => Promise<string>) | undefined;
        basePath?: string | undefined;
        baseOptions?: any;
        formDataCtor?: (new () => any) | undefined;
        stop?: import("openai").CreateChatCompletionRequestStop | undefined;
        stream?: boolean | null | undefined;
        user?: string | undefined;
        model: string;
        temperature?: number | null | undefined;
        top_p?: number | null | undefined;
        n?: number | null | undefined;
        max_tokens?: number | undefined;
        presence_penalty?: number | null | undefined;
        frequency_penalty?: number | null | undefined;
        logit_bias?: object | null | undefined;
        model_name: string;
    };
    /**
     * Get the identifying parameters for the model
     */
    identifyingParams(): {
        apiKey?: string | Promise<string> | ((name: string) => string) | ((name: string) => Promise<string>) | undefined;
        organization?: string | undefined;
        username?: string | undefined;
        password?: string | undefined;
        accessToken?: string | Promise<string> | ((name?: string | undefined, scopes?: string[] | undefined) => string) | ((name?: string | undefined, scopes?: string[] | undefined) => Promise<string>) | undefined;
        basePath?: string | undefined;
        baseOptions?: any;
        formDataCtor?: (new () => any) | undefined;
        stop?: import("openai").CreateChatCompletionRequestStop | undefined;
        stream?: boolean | null | undefined;
        user?: string | undefined;
        model: string;
        temperature?: number | null | undefined;
        top_p?: number | null | undefined;
        n?: number | null | undefined;
        max_tokens?: number | undefined;
        presence_penalty?: number | null | undefined;
        frequency_penalty?: number | null | undefined;
        logit_bias?: object | null | undefined;
        model_name: string;
    };
    private formatMessages;
    /** @ignore */
    _call(prompt: string, stopOrOptions?: string[] | this["CallOptions"], runManager?: CallbackManagerForLLMRun): Promise<string>;
    /** @ignore */
    completionWithRetry(request: CreateChatCompletionRequest, options?: StreamingAxiosConfiguration): Promise<CreateChatCompletionResponse>;
    _llmType(): string;
}
