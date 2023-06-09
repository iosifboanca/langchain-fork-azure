import { AsyncCaller } from "../util/async_caller.js";
import { getModelNameForTiktoken, importTiktoken } from "./count_tokens.js";
const getVerbosity = () => false;
/**
 * Base class for language models, chains, tools.
 */
export class BaseLangChain {
    constructor(params) {
        /**
         * Whether to print out response text.
         */
        Object.defineProperty(this, "verbose", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "callbacks", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.verbose = params.verbose ?? getVerbosity();
        this.callbacks = params.callbacks;
    }
}
/**
 * Base class for language models.
 */
export class BaseLanguageModel extends BaseLangChain {
    constructor(params) {
        super({
            verbose: params.verbose,
            callbacks: params.callbacks ?? params.callbackManager,
        });
        /**
         * The async caller should be used by subclasses to make any async calls,
         * which will thus benefit from the concurrency and retry logic.
         */
        Object.defineProperty(this, "caller", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_encoding", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_registry", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.caller = new AsyncCaller(params ?? {});
    }
    async getNumTokens(text) {
        // fallback to approximate calculation if tiktoken is not available
        let numTokens = Math.ceil(text.length / 4);
        try {
            if (!this._encoding) {
                const { encoding_for_model } = await importTiktoken();
                // modelName only exists in openai subclasses, but tiktoken only supports
                // openai tokenisers anyway, so for other subclasses we default to gpt2
                if (encoding_for_model) {
                    this._encoding = encoding_for_model("modelName" in this
                        ? getModelNameForTiktoken(this.modelName)
                        : "gpt2");
                    // We need to register a finalizer to free the tokenizer when the
                    // model is garbage collected.
                    this._registry = new FinalizationRegistry((t) => t.free());
                    this._registry.register(this, this._encoding);
                }
            }
            if (this._encoding) {
                numTokens = this._encoding.encode(text).length;
            }
        }
        catch (error) {
            console.warn("Failed to calculate number of tokens with tiktoken, falling back to approximate count", error);
        }
        return numTokens;
    }
    /**
     * Get the identifying parameters of the LLM.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _identifyingParams() {
        return {};
    }
    /**
     * Return a json-like object representing this LLM.
     */
    serialize() {
        return {
            ...this._identifyingParams(),
            _type: this._llmType(),
            _model: this._modelType(),
        };
    }
    /**
     * Load an LLM from a json-like object describing it.
     */
    static async deserialize(data) {
        const { _type, _model, ...rest } = data;
        if (_model && _model !== "base_chat_model") {
            throw new Error(`Cannot load LLM with model ${_model}`);
        }
        const Cls = {
            openai: (await import("../chat_models/openai.js")).ChatOpenAI,
        }[_type];
        if (Cls === undefined) {
            throw new Error(`Cannot load  LLM with type ${_type}`);
        }
        return new Cls(rest);
    }
}
