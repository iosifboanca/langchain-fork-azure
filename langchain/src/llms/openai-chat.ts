import {
  Configuration,
  OpenAIApi,
  ChatCompletionRequestMessage,
  CreateChatCompletionRequest,
  ConfigurationParameters,
  ChatCompletionResponseMessageRoleEnum,
  CreateChatCompletionResponse,
} from "openai";
import {
  AzureOpenAIInput,
  Kwargs,
  OpenAICallOptions,
  OpenAIChatInput,
} from "types/open-ai-types.js";
import type {StreamingAxiosConfiguration} from "../util/axios-types.js";
import fetchAdapter from "../util/axios-fetch-adapter.js";
import {BaseLLMParams, LLM} from "./base.js";
import {CallbackManagerForLLMRun} from "../callbacks/manager.js";

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
export class OpenAIChat
    extends LLM
    implements OpenAIChatInput, AzureOpenAIInput {
  declare CallOptions: OpenAICallOptions;

  temperature = 1;

  topP = 1;

  frequencyPenalty = 0;

  presencePenalty = 0;

  n = 1;

  logitBias?: Record<string, number>;

  maxTokens?: number;

  modelName = "gpt-3.5-turbo";

  prefixMessages?: ChatCompletionRequestMessage[];

  modelKwargs?: Kwargs;

  timeout?: number;

  stop?: string[];

  streaming = false;

  azureOpenAIApiVersion?: string;

  azureOpenAIApiKey?: string;

  azureOpenAIApiInstanceName?: string;

  azureOpenAIApiDeploymentName?: string;

  private client: OpenAIApi;

  private clientConfig: ConfigurationParameters;

  constructor(
      fields?: Partial<OpenAIChatInput> &
          Partial<AzureOpenAIInput> &
          BaseLLMParams & {
        openAIApiKey?: string;
      },
      configuration?: ConfigurationParameters
  ) {
    super(fields ?? {});

    const apiKey =
        fields?.openAIApiKey ??
        (typeof process !== "undefined"
            ? // eslint-disable-next-line no-process-env
            process.env?.OPENAI_API_KEY
            : undefined);

    const azureApiKey =
        fields?.azureOpenAIApiKey ??
        (typeof process !== "undefined"
            ? // eslint-disable-next-line no-process-env
            process.env?.AZURE_OPENAI_API_KEY
            : undefined);
    if (!azureApiKey && !apiKey) {
      throw new Error("(Azure) OpenAI API key not found");
    }

    const azureApiInstanceName =
        fields?.azureOpenAIApiInstanceName ??
        (typeof process !== "undefined"
            ? // eslint-disable-next-line no-process-env
            process.env?.AZURE_OPENAI_API_INSTANCE_NAME
            : undefined);

    const azureApiDeploymentName =
        fields?.azureOpenAIApiDeploymentName ??
        (typeof process !== "undefined"
            ? // eslint-disable-next-line no-process-env
            process.env?.AZURE_OPENAI_API_DEPLOYMENT_NAME
            : undefined);

    const azureApiVersion =
        fields?.azureOpenAIApiVersion ??
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
  invocationParams(): Omit<CreateChatCompletionRequest, "messages"> & Kwargs {
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

  private formatMessages(prompt: string): ChatCompletionRequestMessage[] {
    const message: ChatCompletionRequestMessage = {
      role: "user",
      content: prompt,
    };
    return this.prefixMessages ? [...this.prefixMessages, message] : [message];
  }

  /** @ignore */
  async _call(
      prompt: string,
      stopOrOptions?: string[] | this["CallOptions"],
      runManager?: CallbackManagerForLLMRun
  ): Promise<string> {
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
        ? await new Promise<CreateChatCompletionResponse>((resolve, reject) => {
          let response: CreateChatCompletionResponse;
          let rejected = false;
          this.completionWithRetry(
              {
                ...params,
                messages: this.formatMessages(prompt),
              },
              {
                ...options,
                responseType: "stream",
                onmessage: (event) => {
                  console.log("OPENAI-CHAT", event);
                  if (event.data?.trim?.() === "[DONE]") {
                    resolve(response);
                  } else {
                    const message = JSON.parse(event.data) as {
                      id: string;
                      object: string;
                      created: number;
                      model: string;
                      choices: Array<{
                        index: number;
                        finish_reason: string | null;
                        delta: { content?: string; role?: string };
                      }>;
                    };

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
                      let choice = response.choices.find(
                          (c) => c.index === part.index
                      );

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
                              ?.role as ChatCompletionResponseMessageRoleEnum,
                          content: part.delta?.content ?? "",
                        };
                      }

                      choice.message.content += part.delta?.content ?? "";
                      (runManager as any)?.handleLLMNewToken(
                          part.delta?.content ?? ""
                      )
                      if (part.finish_reason) resolve(response);
                    }
                  }
                },
              }
          ).catch((error) => {
            if (!rejected) {
              rejected = true;
              reject(error);
            }
          });
        })
        : await this.completionWithRetry(
            {
              ...params,
              messages: this.formatMessages(prompt),
            },
            options
        );

    return data.choices[0].message?.content ?? "";
  }

  /** @ignore */
  async completionWithRetry(
      request: CreateChatCompletionRequest,
      options?: StreamingAxiosConfiguration
  ) {
    if (!this.client) {
      const endpoint = this.azureOpenAIApiKey
          ? `https://${this.azureOpenAIApiInstanceName}.openai.azure.com/openai/deployments/${this.azureOpenAIApiDeploymentName}`
          : this.clientConfig.basePath;
      const clientConfig = new Configuration({
        ...this.clientConfig,
        basePath: endpoint,
        baseOptions: {
          timeout: this.timeout,
          adapter: fetchAdapter,
          ...this.clientConfig.baseOptions,
        },
      });
      this.client = new OpenAIApi(clientConfig);
    }
    const axiosOptions = (options ?? {}) as StreamingAxiosConfiguration &
        OpenAICallOptions;
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
        .call(
            this.client.createChatCompletion.bind(this.client),
            request,
            axiosOptions
        )
        .then((res) => res.data);
  }

  _llmType() {
    return "openai";
  }
}
