"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIChat = void 0;
const openai_1 = require("openai");
const axios_fetch_adapter_js_1 = __importDefault(require("../util/axios-fetch-adapter.cjs"));
const base_js_1 = require("./base.cjs");
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
class OpenAIChat extends base_js_1.LLM {
    constructor(fields, configuration) {
        super(fields ?? {});
        Object.defineProperty(this, "temperature", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "topP", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "frequencyPenalty", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "presencePenalty", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "n", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "logitBias", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "maxTokens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "modelName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "gpt-3.5-turbo"
        });
        Object.defineProperty(this, "prefixMessages", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "modelKwargs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "timeout", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "stop", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "streaming", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "azureOpenAIApiVersion", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "azureOpenAIApiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "azureOpenAIApiInstanceName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "azureOpenAIApiDeploymentName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "clientConfig", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const apiKey = fields?.openAIApiKey ??
            (typeof process !== "undefined"
                ? // eslint-disable-next-line no-process-env
                    process.env?.OPENAI_API_KEY
                : undefined);
        const azureApiKey = fields?.azureOpenAIApiKey ??
            (typeof process !== "undefined"
                ? // eslint-disable-next-line no-process-env
                    process.env?.AZURE_OPENAI_API_KEY
                : undefined);
        if (!azureApiKey && !apiKey) {
            throw new Error("(Azure) OpenAI API key not found");
        }
        const azureApiInstanceName = fields?.azureOpenAIApiInstanceName ??
            (typeof process !== "undefined"
                ? // eslint-disable-next-line no-process-env
                    process.env?.AZURE_OPENAI_API_INSTANCE_NAME
                : undefined);
        const azureApiDeploymentName = fields?.azureOpenAIApiDeploymentName ??
            (typeof process !== "undefined"
                ? // eslint-disable-next-line no-process-env
                    process.env?.AZURE_OPENAI_API_DEPLOYMENT_NAME
                : undefined);
        const azureApiVersion = fields?.azureOpenAIApiVersion ??
            (typeof process !== "undefined"
                ? // eslint-disable-next-line no-process-env
                    process.env?.AZURE_OPENAI_API_VERSION
                : undefined);
        this.modelName = fields?.modelName ?? this.modelName;
        this.prefixMessages = fields?.prefixMessages ?? this.prefixMessages;
        this.modelKwargs = fields?.modelKwargs ?? {};
        this.timeout = fields?.timeout;
        this.temperature = fields?.temperature ?? this.temperature;
        this.topP = fields?.topP ?? this.topP;
        this.frequencyPenalty = fields?.frequencyPenalty ?? this.frequencyPenalty;
        this.presencePenalty = fields?.presencePenalty ?? this.presencePenalty;
        this.n = fields?.n ?? this.n;
        this.logitBias = fields?.logitBias;
        this.maxTokens = fields?.maxTokens;
        this.stop = fields?.stop;
        this.streaming = fields?.streaming ?? false;
        this.azureOpenAIApiVersion = azureApiVersion;
        this.azureOpenAIApiKey = azureApiKey;
        this.azureOpenAIApiInstanceName = azureApiInstanceName;
        this.azureOpenAIApiDeploymentName = azureApiDeploymentName;
        if (this.streaming && this.n > 1) {
            throw new Error("Cannot stream results when n > 1");
        }
        if (this.azureOpenAIApiKey) {
            if (!this.azureOpenAIApiInstanceName) {
                throw new Error("Azure OpenAI API instance name not found");
            }
            if (!this.azureOpenAIApiDeploymentName) {
                throw new Error("Azure OpenAI API deployment name not found");
            }
            if (!this.azureOpenAIApiVersion) {
                throw new Error("Azure OpenAI API version not found");
            }
        }
        this.clientConfig = {
            apiKey,
            ...configuration,
        };
    }
    /**
     * Get the parameters used to invoke the model
     */
    invocationParams() {
        return {
            model: this.modelName,
            temperature: this.temperature,
            top_p: this.topP,
            frequency_penalty: this.frequencyPenalty,
            presence_penalty: this.presencePenalty,
            n: this.n,
            logit_bias: this.logitBias,
            max_tokens: this.maxTokens,
            stop: this.stop,
            stream: this.streaming,
            ...this.modelKwargs,
        };
    }
    /** @ignore */
    _identifyingParams() {
        return {
            model_name: this.modelName,
            ...this.invocationParams(),
            ...this.clientConfig,
        };
    }
    /**
     * Get the identifying parameters for the model
     */
    identifyingParams() {
        return {
            model_name: this.modelName,
            ...this.invocationParams(),
            ...this.clientConfig,
        };
    }
    formatMessages(prompt) {
        const message = {
            role: "user",
            content: prompt,
        };
        return this.prefixMessages ? [...this.prefixMessages, message] : [message];
    }
    /** @ignore */
    async _call(prompt, stopOrOptions, runManager) {
        const stop = Array.isArray(stopOrOptions)
            ? stopOrOptions
            : stopOrOptions?.stop;
        const options = Array.isArray(stopOrOptions)
            ? {}
            : stopOrOptions?.options ?? {};
        if (this.stop && stop) {
            throw new Error("Stop found in input and default params");
        }
        const params = this.invocationParams();
        params.stop = stop ?? params.stop;
        const data = params.stream
            ? await new Promise((resolve, reject) => {
                let response;
                let rejected = false;
                this.completionWithRetry({
                    ...params,
                    messages: this.formatMessages(prompt),
                }, {
                    ...options,
                    responseType: "stream",
                    onmessage: (event) => {
                        if (event.data?.trim?.() === "[DONE]") {
                            resolve(response);
                        }
                        else {
                            const message = JSON.parse(event.data);
                            // on the first message set the response properties
                            if (!response) {
                                response = {
                                    id: message.id,
                                    object: message.object,
                                    created: message.created,
                                    model: message.model,
                                    choices: [],
                                };
                            }
                            // on all messages, update choice
                            const part = message.choices[0];
                            if (part != null) {
                                let choice = response.choices.find((c) => c.index === part.index);
                                if (!choice) {
                                    choice = {
                                        index: part.index,
                                        finish_reason: part.finish_reason ?? undefined,
                                    };
                                    response.choices.push(choice);
                                }
                                if (!choice.message) {
                                    choice.message = {
                                        role: part.delta
                                            ?.role,
                                        content: part.delta?.content ?? "",
                                    };
                                }
                                choice.message.content += part.delta?.content ?? "";
                                runManager?.handleLLMNewToken(part.delta?.content ?? "");
                                if (part.finish_reason)
                                    resolve(response);
                            }
                        }
                    },
                }).catch((error) => {
                    if (!rejected) {
                        rejected = true;
                        reject(error);
                    }
                });
            })
            : await this.completionWithRetry({
                ...params,
                messages: this.formatMessages(prompt),
            }, options);
        return data.choices[0].message?.content ?? "";
    }
    /** @ignore */
    async completionWithRetry(request, options) {
        if (!this.client) {
            const endpoint = this.azureOpenAIApiKey
                ? `https://${this.azureOpenAIApiInstanceName}.openai.azure.com/openai/deployments/${this.azureOpenAIApiDeploymentName}`
                : this.clientConfig.basePath;
            const clientConfig = new openai_1.Configuration({
                ...this.clientConfig,
                basePath: endpoint,
                baseOptions: {
                    timeout: this.timeout,
                    adapter: axios_fetch_adapter_js_1.default,
                    ...this.clientConfig.baseOptions,
                },
            });
            this.client = new openai_1.OpenAIApi(clientConfig);
        }
        const axiosOptions = (options ?? {});
        if (this.azureOpenAIApiKey) {
            axiosOptions.headers = {
                "api-key": this.azureOpenAIApiKey,
                ...axiosOptions.headers,
            };
            axiosOptions.params = {
                "api-version": this.azureOpenAIApiVersion,
                ...axiosOptions.params,
            };
        }
        return this.caller
            .call(this.client.createChatCompletion.bind(this.client), request, axiosOptions)
            .then((res) => res.data);
    }
    _llmType() {
        return "openai";
    }
}
exports.OpenAIChat = OpenAIChat;
